import type { MenuItem } from './page'
import type { AdminCopy } from '../../../i18n/adminCopy'

export type MissingField = { label: string; tab: string }

export function getMissingFields(item: MenuItem, t?: AdminCopy): MissingField[] {
  const m: MissingField[] = []
  const rank = item.verificationRank
  const isLowRisk = rank === 'C' || rank === 'B'
  const labels = {
    ingredients: t?.menuList.hintIngredients ?? '原材料',
    allergens: t?.menuList.hintAllergens ?? 'アレルゲン',
    description: t?.menuList.hintDescription ?? '説明文',
    nameEn: t?.menuList.hintNameEn ?? '英語名',
    cooking: t?.menuList.hintCooking ?? '調理法',
    narrative: t?.menuList.hintNarrative ?? 'ナラティブ',
    serving: t?.menuList.hintServing ?? '提供情報',
  }
  if (!item.ingredients?.length) m.push({ label: labels.ingredients, tab: 'materials' })
  // C/Bランクはアレルゲンリスク低 → 空でも警告不要
  if (!isLowRisk && !item.allergens?.length) m.push({ label: labels.allergens, tab: 'allergens' })
  if (!item.description) m.push({ label: labels.description, tab: 'basic' })
  if (!item.nameEn) m.push({ label: labels.nameEn, tab: 'basic' })
  if (!isLowRisk && !item.cookingMethods?.length) m.push({ label: labels.cooking, tab: 'materials' })
  const narr = Object.entries(item.narrative || {}).filter(([, v]) => v)
  if (narr.length === 0) m.push({ label: labels.narrative, tab: 'nfg' })
  const serv = Object.entries(item.serving || {}).filter(([, v]) => v)
  if (serv.length === 0) m.push({ label: labels.serving, tab: 'nfg' })
  return m
}
