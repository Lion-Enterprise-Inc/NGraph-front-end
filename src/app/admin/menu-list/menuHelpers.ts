import type { MenuItem } from './page'

export type MissingField = { label: string; tab: string }

export function getMissingFields(item: MenuItem): MissingField[] {
  const m: MissingField[] = []
  if (!item.ingredients?.length) m.push({ label: '原材料', tab: 'materials' })
  if (!item.allergens?.length) m.push({ label: 'アレルゲン', tab: 'allergens' })
  if (!item.description) m.push({ label: '説明文', tab: 'basic' })
  if (!item.nameEn) m.push({ label: '英語名', tab: 'basic' })
  if (!item.cookingMethods?.length) m.push({ label: '調理法', tab: 'materials' })
  const narr = Object.entries(item.narrative || {}).filter(([, v]) => v)
  if (narr.length === 0) m.push({ label: 'ナラティブ', tab: 'nfg' })
  const serv = Object.entries(item.serving || {}).filter(([, v]) => v)
  if (serv.length === 0) m.push({ label: '提供情報', tab: 'nfg' })
  return m
}
