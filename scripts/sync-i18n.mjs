#!/usr/bin/env node
/**
 * adminCopy.ts の JA/EN 同期スクリプト
 *
 * 用途：
 *   - en: セクション内の string / template literal 値で日本語文字を含むものを検出
 *   - GPT-4o-mini で英訳を生成
 *   - dry-run（既定）：差分を標準出力に表示
 *   - --apply: ファイル書き戻し
 *
 * 環境変数：
 *   OPENAI_API_KEY  必須
 *
 * 使い方：
 *   node scripts/sync-i18n.mjs           # 不足検出＋訳の提案だけ
 *   node scripts/sync-i18n.mjs --apply   # 提案を adminCopy.ts に書き込み
 *
 * 設計メモ：
 *   - TS の型システムが「キー欠落」は既にビルド時に止める
 *   - このスクリプトの本来の役割は「en スロットに JP がベタ貼り」状態の検出
 *   - 関数キー `(n) => \`xxx${n}件\`` の中の日本語も拾う（テンプレートリテラル全文）
 *   - 同じ JP 値が複数キーで使われていてもキー毎に独立して訳す（誤同期防止）
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import ts from 'typescript'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const FILE_PATH = resolve(__dirname, '../src/i18n/adminCopy.ts')
const APPLY = process.argv.includes('--apply')

const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) {
  console.error('Error: OPENAI_API_KEY not set')
  process.exit(1)
}

const JP_RE = /[぀-ゟ゠-ヿ一-鿿]/

/** AST から adminCopy の `en: { ... }` ノードを取得 */
function findEnSection(sourceFile) {
  let result = null
  function walk(node) {
    if (
      ts.isVariableStatement(node) &&
      node.declarationList.declarations.some(d => d.name.getText() === 'adminCopy')
    ) {
      const decl = node.declarationList.declarations.find(d => d.name.getText() === 'adminCopy')
      const init = decl?.initializer
      if (init && ts.isObjectLiteralExpression(init)) {
        for (const prop of init.properties) {
          if (
            ts.isPropertyAssignment(prop) &&
            (prop.name.getText() === 'en' || prop.name.getText() === '"en"' || prop.name.getText() === "'en'")
          ) {
            result = prop.initializer
            return
          }
        }
      }
    }
    ts.forEachChild(node, walk)
  }
  walk(sourceFile)
  return result
}

/** ノードを再帰的に歩いて、JP を含む string/template literal を [path, text, start, end] で収集 */
function collectJpLiterals(node, path = [], out = []) {
  if (ts.isObjectLiteralExpression(node)) {
    for (const prop of node.properties) {
      if (ts.isPropertyAssignment(prop)) {
        const key = prop.name.getText().replace(/^['"]|['"]$/g, '')
        collectJpLiterals(prop.initializer, [...path, key], out)
      }
    }
  } else if (ts.isArrayLiteralExpression(node)) {
    node.elements.forEach((el, i) => collectJpLiterals(el, [...path, `[${i}]`], out))
  } else if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    // 関数本体内のテンプレートリテラルを拾う
    collectJpLiterals(node.body, [...path, '<body>'], out)
  } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    if (JP_RE.test(node.text)) {
      out.push({ path: path.join('.'), text: node.text, start: node.getStart(), end: node.getEnd(), kind: 'string' })
    }
  } else if (ts.isTemplateExpression(node)) {
    const full = node.getText()
    if (JP_RE.test(full)) {
      out.push({ path: path.join('.'), text: full, start: node.getStart(), end: node.getEnd(), kind: 'template' })
    }
  } else if (ts.isParenthesizedExpression(node)) {
    collectJpLiterals(node.expression, path, out)
  } else if (ts.isBlock(node) || ts.isReturnStatement(node)) {
    ts.forEachChild(node, c => collectJpLiterals(c, path, out))
  }
  return out
}

/** OpenAI API 呼び出し（Chat Completions, structured JSON） */
async function translateBatch(items) {
  const numbered = items.map((it, i) => `[${i}] (${it.path}) ${it.text}`).join('\n')
  const systemPrompt = `You are translating Japanese UI strings to English for OMISEAI, a SaaS admin panel for restaurants in Japan.

Rules:
- Output natural, concise English suitable for restaurant managers / developers
- Preserve template literal placeholders \${n}, \${name} etc EXACTLY
- Preserve emojis 📷📋🤖✓⚠ etc as-is (keep position)
- Preserve quote style: input "..." → output "...", input \`...\` → output \`...\`
- Do NOT translate proper nouns: OMISEAI, NGraph, NFG, Google, Stripe, Vision, etc
- Restaurant domain terms: メニュー→Menu, 料理→Dish, 食材→Ingredient, アレルゲン→Allergen, 確認優先度→Verification priority
- Brand/feature names: 店主確認→Owner verified, ナラティブ→Narrative
- Keep the SAME quote/backtick style the input uses

Output as JSON array of objects: { "i": <index>, "en": "<translated string>" }`

  const userPrompt = `Translate these ${items.length} Japanese strings to English. Output JSON only:\n\n${numbered}`

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt + '\n\nReturn as { "translations": [...] }' },
      ],
    }),
  })

  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`OpenAI API ${resp.status}: ${errText}`)
  }
  const data = await resp.json()
  const content = data.choices[0].message.content
  const parsed = JSON.parse(content)
  return parsed.translations || []
}

async function main() {
  console.log(`Reading ${FILE_PATH}`)
  const source = readFileSync(FILE_PATH, 'utf-8')
  const sourceFile = ts.createSourceFile(FILE_PATH, source, ts.ScriptTarget.Latest, true)

  const enSection = findEnSection(sourceFile)
  if (!enSection) {
    console.error('Error: en: section not found in adminCopy')
    process.exit(1)
  }

  const jpLiterals = collectJpLiterals(enSection)
  console.log(`Found ${jpLiterals.length} Japanese-containing literals in en section`)

  if (jpLiterals.length === 0) {
    console.log('✓ EN section is clean. Nothing to translate.')
    return
  }

  // 一覧表示
  console.log('\n--- Candidates for translation ---')
  jpLiterals.slice(0, 20).forEach((it, i) => {
    console.log(`[${i}] ${it.path}`)
    console.log(`    JP: ${it.text.slice(0, 100)}${it.text.length > 100 ? '…' : ''}`)
  })
  if (jpLiterals.length > 20) console.log(`... and ${jpLiterals.length - 20} more`)

  console.log(`\nCalling gpt-4o-mini to translate ${jpLiterals.length} items...`)
  // 30件ずつバッチ
  const BATCH = 30
  const translations = new Array(jpLiterals.length).fill(null)
  for (let start = 0; start < jpLiterals.length; start += BATCH) {
    const batch = jpLiterals.slice(start, start + BATCH)
    const result = await translateBatch(batch)
    for (const r of result) {
      const globalIdx = start + Number(r.i)
      if (globalIdx >= 0 && globalIdx < jpLiterals.length) {
        translations[globalIdx] = r.en
      }
    }
    console.log(`  Batch ${start + 1}-${Math.min(start + BATCH, jpLiterals.length)} done`)
  }

  // 結果表示
  console.log('\n--- Suggested translations ---')
  jpLiterals.forEach((it, i) => {
    if (!translations[i]) return
    console.log(`[${i}] ${it.path}`)
    console.log(`    JP: ${it.text.slice(0, 80)}${it.text.length > 80 ? '…' : ''}`)
    console.log(`    EN: ${translations[i].slice(0, 80)}${translations[i].length > 80 ? '…' : ''}`)
  })

  if (!APPLY) {
    console.log('\n[Dry-run] Pass --apply to write these changes to adminCopy.ts')
    return
  }

  // 後ろから書き換え（インデックス維持のため）
  const sorted = jpLiterals
    .map((it, i) => ({ ...it, en: translations[i] }))
    .filter(it => it.en)
    .sort((a, b) => b.start - a.start)

  let newSource = source
  for (const it of sorted) {
    const original = newSource.slice(it.start, it.end)
    let replacement
    if (it.kind === 'string') {
      // ' or " で囲む（元と同じ引用符を保持）
      const quote = original[0]
      const escaped = it.en.replace(new RegExp(quote, 'g'), `\\${quote}`)
      replacement = `${quote}${escaped}${quote}`
    } else {
      // template literal: バッククォートを保持、placeholderは GPT が ${...} 形式で返している前提
      replacement = '`' + it.en.replace(/`/g, '\\`') + '`'
    }
    newSource = newSource.slice(0, it.start) + replacement + newSource.slice(it.end)
  }

  writeFileSync(FILE_PATH, newSource, 'utf-8')
  console.log(`\n✓ Applied ${sorted.length} translations to ${FILE_PATH}`)
  console.log('  Run `npx tsc --noEmit` to verify, then review the diff with `git diff`')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
