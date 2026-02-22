'use client'

import { useState, useRef } from 'react'
import { Ingredient, Allergen, CookingMethod, Restriction, DISH_CATEGORIES, MenuApi } from '../../../services/api'
import type { MenuItem } from './page'

interface MenuFormModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'add' | 'edit'
  newMenu: { name: string; nameEn: string; price: string; category: string; description: string; descriptionEn: string; ingredients: string; narrative: Record<string, string>; serving: Record<string, string>; priceDetail: Record<string, any> }
  onNewMenuChange: (menu: any) => void
  selectedAllergenUids: string[]
  onAllergenChange: (uids: string[]) => void
  selectedCookingMethodUids: string[]
  onCookingMethodChange: (uids: string[]) => void
  selectedRestrictionUids: string[]
  onRestrictionChange: (uids: string[]) => void
  editItem: MenuItem | null
  onEditItemChange: (item: MenuItem) => void
  editIngredientsText: string
  onEditIngredientsTextChange: (text: string) => void
  editSelectedAllergenUids: string[]
  onEditAllergenChange: (uids: string[]) => void
  editSelectedCookingMethodUids: string[]
  onEditCookingMethodChange: (uids: string[]) => void
  editSelectedRestrictionUids: string[]
  onEditRestrictionChange: (uids: string[]) => void
  allergens: { mandatory: Allergen[]; recommended: Allergen[] }
  cookingMethods: CookingMethod[]
  restrictions: Restriction[]
  isSaving: boolean
  onSave: () => void
  activeTab: string
  onTabChange: (tab: string) => void
  pendingImageFile?: File | null
  onPendingImageFileChange?: (file: File | null) => void
}

export default function MenuFormModal({
  isOpen, onClose, mode,
  newMenu, onNewMenuChange,
  selectedAllergenUids, onAllergenChange,
  selectedCookingMethodUids, onCookingMethodChange,
  selectedRestrictionUids, onRestrictionChange,
  editItem, onEditItemChange,
  editIngredientsText, onEditIngredientsTextChange,
  editSelectedAllergenUids, onEditAllergenChange,
  editSelectedCookingMethodUids, onEditCookingMethodChange,
  editSelectedRestrictionUids, onEditRestrictionChange,
  allergens, cookingMethods, restrictions,
  isSaving, onSave, activeTab, onTabChange,
  pendingImageFile, onPendingImageFileChange
}: MenuFormModalProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null
  if (mode === 'edit' && !editItem) return null

  const isEdit = mode === 'edit'

  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) return 'jpg, png, webp のみ対応'
    if (file.size > MAX_FILE_SIZE) return 'ファイルサイズは5MB以下'
    return null
  }

  const handleImageFile = async (file: File) => {
    const err = validateFile(file)
    if (err) { setUploadError(err); return }
    setUploadError('')

    if (isEdit && editItem) {
      // editモード: 即アップロード
      setIsUploading(true)
      try {
        const resp = await MenuApi.uploadImage(editItem.uid, file)
        onEditItemChange({ ...editItem, imageUrl: resp.image_url })
      } catch (e: any) {
        setUploadError(e.message || 'アップロードに失敗しました')
      } finally {
        setIsUploading(false)
      }
    } else {
      // addモード: ファイルを保持、保存後にアップロード
      onPendingImageFileChange?.(file)
      // プレビュー用にlocal URLをセット
      const localUrl = URL.createObjectURL(file)
      onNewMenuChange({ ...newMenu, imageUrl: localUrl })
    }
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleImageFile(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleImageFile(file)
    e.target.value = ''
  }

  // Shorthand getters/setters depending on mode
  const getName = () => isEdit ? editItem!.name : newMenu.name
  const getNameEn = () => isEdit ? (editItem!.nameEn || '') : newMenu.nameEn
  const getPrice = () => isEdit ? editItem!.price : newMenu.price
  const getCategory = () => isEdit ? editItem!.category : newMenu.category
  const getDescription = () => isEdit ? (editItem!.description || '') : newMenu.description
  const getDescriptionEn = () => isEdit ? (editItem!.descriptionEn || '') : newMenu.descriptionEn
  const getImageUrl = () => isEdit ? (editItem!.imageUrl || '') : ((newMenu as any).imageUrl || '')
  const getProductUrl = () => isEdit ? (editItem!.productUrl || '') : ((newMenu as any).productUrl || '')
  const getIngredients = () => isEdit ? editIngredientsText : newMenu.ingredients
  const getNarrative = (key: string) => isEdit ? (editItem!.narrative?.[key] || '') : (newMenu.narrative[key] || '')
  const getServing = (key: string) => isEdit ? (editItem!.serving?.[key] || '') : (newMenu.serving[key] || '')
  const getPriceDetail = (key: string) => {
    if (isEdit) return editItem!.priceDetail?.[key]
    return newMenu.priceDetail[key]
  }

  const curAllergenUids = isEdit ? editSelectedAllergenUids : selectedAllergenUids
  const setCurAllergenUids = isEdit ? onEditAllergenChange : onAllergenChange
  const curCookingMethodUids = isEdit ? editSelectedCookingMethodUids : selectedCookingMethodUids
  const setCurCookingMethodUids = isEdit ? onEditCookingMethodChange : onCookingMethodChange
  const curRestrictionUids = isEdit ? editSelectedRestrictionUids : selectedRestrictionUids
  const setCurRestrictionUids = isEdit ? onEditRestrictionChange : onRestrictionChange

  const setField = (field: string, value: any) => {
    if (isEdit) {
      onEditItemChange({ ...editItem!, [field]: value })
    } else {
      onNewMenuChange({ ...newMenu, [field]: value })
    }
  }

  const setNarrative = (key: string, value: string) => {
    if (isEdit) {
      onEditItemChange({ ...editItem!, narrative: { ...(editItem!.narrative || {}), [key]: value } })
    } else {
      onNewMenuChange({ ...newMenu, narrative: { ...newMenu.narrative, [key]: value } })
    }
  }

  const setServing = (key: string, value: string) => {
    if (isEdit) {
      onEditItemChange({ ...editItem!, serving: { ...(editItem!.serving || {}), [key]: value } })
    } else {
      onNewMenuChange({ ...newMenu, serving: { ...newMenu.serving, [key]: value } })
    }
  }

  const setPriceDetail = (key: string, value: any) => {
    if (isEdit) {
      onEditItemChange({ ...editItem!, priceDetail: { ...(editItem!.priceDetail || {}), [key]: value } })
    } else {
      onNewMenuChange({ ...newMenu, priceDetail: { ...newMenu.priceDetail, [key]: value } })
    }
  }

  const handleClose = () => {
    setUploadError('')
    onPendingImageFileChange?.(null)
    onTabChange('basic')
    onClose()
  }

  return (
    <div className="modal active">
      <div className="modal-content">
        <button className="modal-close" onClick={handleClose}>×</button>
        <div className="modal-title">📝 メニュー編集</div>

        <div className="tab-nav">
          <button className={`tab-nav-btn ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => onTabChange('basic')}>📝 基本情報</button>
          <button className={`tab-nav-btn ${activeTab === 'materials' ? 'active' : ''}`} onClick={() => onTabChange('materials')}>🥕 原材料</button>
          <button className={`tab-nav-btn ${activeTab === 'allergens' ? 'active' : ''}`} onClick={() => onTabChange('allergens')}>⚠️ アレルギー</button>
          <button className={`tab-nav-btn ${activeTab === 'nfg' ? 'active' : ''}`} onClick={() => onTabChange('nfg')}>📊 NFG詳細</button>
        </div>

        {activeTab === 'basic' && (
          <div className="tab-content">
            <div className="form-group">
              <label className="form-label">料理名（日本語）*</label>
              <input type="text" className="form-input" value={getName()} onChange={(e) => setField('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">料理名（英語）</label>
              <input type="text" className="form-input" value={getNameEn()} onChange={(e) => setField('nameEn', e.target.value)} />
              <button className="btn ai-btn btn-small" style={{ marginTop: '5px' }}>🤖 AI自動翻訳</button>
            </div>
            <div className="form-group">
              <label className="form-label">価格 *</label>
              <input type="number" className="form-input" value={getPrice()} onChange={(e) => setField('price', isEdit ? Number(e.target.value) : e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">カテゴリー *</label>
              <select className="form-input" value={getCategory()} onChange={(e) => setField('category', e.target.value)}>
                <option value="">選択してください</option>
                {Object.entries(DISH_CATEGORIES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">料理の説明（日本語）</label>
              <textarea className="form-input" value={getDescription()} onChange={(e) => setField('description', e.target.value)} />
              <button className="btn ai-btn btn-small" style={{ marginTop: '5px' }}>🤖 AI生成</button>
            </div>
            <div className="form-group">
              <label className="form-label">料理の説明（英語）</label>
              <textarea className="form-input" value={getDescriptionEn()} onChange={(e) => setField('descriptionEn', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">商品画像</label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? '#667eea' : 'var(--border)'}`,
                  borderRadius: 8,
                  padding: '20px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragOver ? 'rgba(102,126,234,0.05)' : 'transparent',
                  transition: 'all 0.2s',
                  marginBottom: 8
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleFileInputChange}
                />
                {isUploading ? (
                  <div style={{ color: '#667eea', fontSize: 14 }}>アップロード中...</div>
                ) : (
                  <>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>📷</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>画像をドロップまたはクリックして選択</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>jpg / png / webp、最大5MB</div>
                  </>
                )}
              </div>
              {uploadError && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 4 }}>{uploadError}</div>}
              {!isEdit && pendingImageFile && (
                <div style={{ fontSize: 12, color: '#10B981', marginBottom: 4 }}>選択済み: {pendingImageFile.name}（保存後にアップロードされます）</div>
              )}
              {getImageUrl() && (
                <div style={{ marginTop: 4 }}>
                  <img
                    src={getImageUrl()}
                    alt="商品画像プレビュー"
                    style={{ maxWidth: 200, maxHeight: 150, borderRadius: 8, border: '1px solid var(--border)', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              )}
              <label className="form-label" style={{ marginTop: 8 }}>または画像URLを直接入力</label>
              <input type="url" className="form-input" value={getImageUrl()} onChange={(e) => setField('imageUrl', e.target.value || null)} placeholder="https://example.com/image.jpg" />
            </div>
            <div className="form-group">
              <label className="form-label">商品ページURL</label>
              <input type="url" className="form-input" value={getProductUrl()} onChange={(e) => setField('productUrl', e.target.value || null)} placeholder="https://example.com/product" />
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>メーカーページ等のリンク（ドリンク商品向け）</div>
            </div>
            <button className="btn btn-primary" onClick={() => onTabChange('materials')}>次へ: 原材料設定 →</button>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="tab-content">
            {!isEdit && (
              <div className="alert-info">
                現在の信頼度: <strong>65%</strong> → 完了後: <strong>95%</strong>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">原材料（カンマ区切りで入力）</label>
              <button className="btn ai-btn btn-small" style={{ marginBottom: '12px' }}>🤖 AI推察</button>
              <textarea
                className="form-input"
                value={getIngredients()}
                onChange={(e) => isEdit ? onEditIngredientsTextChange(e.target.value) : onNewMenuChange({ ...newMenu, ingredients: e.target.value })}
                placeholder="例: 鶏肉, 玉ねぎ, にんじん, 醤油, みりん"
                rows={3}
                style={{ marginBottom: '8px' }}
              />
              <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                ※ 複数の原材料はカンマ（,）で区切って入力してください
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">調理法</label>
              {cookingMethods.length > 0 ? (
                <div className="checkbox-group">
                  {cookingMethods.map(cm => (
                    <label key={cm.uid} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={curCookingMethodUids.includes(cm.uid)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCurCookingMethodUids([...curCookingMethodUids, cm.uid])
                          } else {
                            setCurCookingMethodUids(curCookingMethodUids.filter(uid => uid !== cm.uid))
                          }
                        }}
                      />
                      {cm.name_jp}
                    </label>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '13px' }}>調理法マスタデータなし</div>
              )}
            </div>
            <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #1E293B' }}>
              <button className="btn btn-primary" onClick={() => onTabChange('allergens')}>次へ: アレルギー設定 →</button>
            </div>
          </div>
        )}

        {activeTab === 'allergens' && (
          <div className="tab-content">
            <div className="form-group">
              <label className="form-label">⚠️ アレルゲン情報</label>
              {allergens && allergens.mandatory && allergens.mandatory.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <strong>特定原材料（表示義務）:</strong>
                  <div className="checkbox-group">
                    {allergens.mandatory.map(allergen => (
                      <label key={allergen.uid} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={curAllergenUids.includes(allergen.uid)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCurAllergenUids([...curAllergenUids, allergen.uid])
                            } else {
                              setCurAllergenUids(curAllergenUids.filter(uid => uid !== allergen.uid))
                            }
                          }}
                        /> {allergen.name_jp} ({allergen.name_en})
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {allergens && allergens.recommended && allergens.recommended.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <strong>推奨表示アレルゲン:</strong>
                  <div className="checkbox-group">
                    {allergens.recommended.map(allergen => (
                      <label key={allergen.uid} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={curAllergenUids.includes(allergen.uid)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCurAllergenUids([...curAllergenUids, allergen.uid])
                            } else {
                              setCurAllergenUids(curAllergenUids.filter(uid => uid !== allergen.uid))
                            }
                          }}
                        /> {allergen.name_jp} ({allergen.name_en})
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {(!allergens || (!allergens.mandatory?.length && !allergens.recommended?.length)) && (
                <div style={{ color: '#94A3B8', fontStyle: 'italic' }}>
                  アレルゲン情報が読み込めませんでした。後で再試行してください。
                </div>
              )}
            </div>
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">食事制約</label>
              {restrictions.length > 0 ? (
                <div className="checkbox-group">
                  {restrictions.map(r => (
                    <label key={r.uid} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={curRestrictionUids.includes(r.uid)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCurRestrictionUids([...curRestrictionUids, r.uid])
                          } else {
                            setCurRestrictionUids(curRestrictionUids.filter(uid => uid !== r.uid))
                          }
                        }}
                      />
                      {r.name_jp} {r.name_en && <span style={{ fontSize: '11px', color: '#94A3B8' }}>({r.name_en})</span>}
                    </label>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '13px' }}>制約マスタデータなし</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: isEdit ? '20px' : '0' }}>
              <button className="btn btn-primary" onClick={() => onTabChange('nfg')}>次へ: NFG詳細 →</button>
            </div>
          </div>
        )}

        {activeTab === 'nfg' && (
          <div className="tab-content">
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>📖 ナラティブ（料理の物語）</h4>
              <div className="form-group">
                <label className="form-label">料理のストーリー</label>
                <textarea className="form-input" rows={2} value={getNarrative('story')} onChange={(e) => setNarrative('story', e.target.value)} placeholder="この料理が生まれた背景やこだわり" />
              </div>
              <div className="form-group">
                <label className="form-label">シェフのコメント</label>
                <textarea className="form-input" rows={2} value={getNarrative('chef_note')} onChange={(e) => setNarrative('chef_note', e.target.value)} placeholder="料理人のおすすめポイント" />
              </div>
              <div className="form-group">
                <label className="form-label">テイスティングノート</label>
                <textarea className="form-input" rows={2} value={getNarrative('tasting_note')} onChange={(e) => setNarrative('tasting_note', e.target.value)} placeholder="味わいの特徴" />
              </div>
              <div className="form-group">
                <label className="form-label">ペアリング提案</label>
                <input type="text" className="form-input" value={getNarrative('pairing_suggestion')} onChange={(e) => setNarrative('pairing_suggestion', e.target.value)} placeholder="おすすめのお酒や組み合わせ" />
              </div>
              <div className="form-group">
                <label className="form-label">季節のメモ</label>
                <input type="text" className="form-input" value={getNarrative('seasonal_note')} onChange={(e) => setNarrative('seasonal_note', e.target.value)} placeholder="旬の情報など" />
              </div>
            </div>

            <div style={{ marginBottom: '20px', borderTop: '1px solid #1E293B', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>🍽️ 提供情報</h4>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">サイズ</label>
                  <select className="form-input" value={getServing('size')} onChange={(e) => setServing('size', e.target.value)}>
                    <option value="">未設定</option>
                    <option value="small">小盛り</option>
                    <option value="regular">普通</option>
                    <option value="large">大盛り</option>
                    <option value="family">ファミリー</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">提供期間</label>
                  <select className="form-input" value={getServing('availability')} onChange={(e) => setServing('availability', e.target.value)}>
                    <option value="">未設定</option>
                    <option value="always">通年</option>
                    <option value="seasonal">季節限定</option>
                    <option value="limited">数量限定</option>
                    <option value="special_event">イベント限定</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px', borderTop: '1px solid #1E293B', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>🏷️ 特集タグ</h4>
              <div className="form-group">
                <input type="text" className="form-input"
                  value={(isEdit ? (editItem!.featuredTags || []) : (newMenu as any).featuredTags || []).join(', ')}
                  onChange={(e) => {
                    const tags = e.target.value.split(/[,、]/).map(t => t.trim()).filter(Boolean)
                    setField('featuredTags', tags.length > 0 ? tags : null)
                  }}
                  placeholder="人気, 店長おすすめ, 季節限定（カンマ区切り）"
                />
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>カンマ区切りで入力。チャットAIが「おすすめは？」に活用します</div>
              </div>
            </div>

            <div style={{ marginBottom: '20px', borderTop: '1px solid #1E293B', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>💰 価格詳細</h4>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">通貨</label>
                  <input type="text" className="form-input" value={getPriceDetail('currency') || 'JPY'} onChange={(e) => setPriceDetail('currency', e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">税率(%)</label>
                  <input type="number" className="form-input" value={getPriceDetail('tax_rate') ?? 10} onChange={(e) => setPriceDetail('tax_rate', Number(e.target.value))} />
                </div>
                <div className="form-group" style={{ flex: 1, paddingTop: '24px' }}>
                  <label className="checkbox-item">
                    <input type="checkbox" checked={getPriceDetail('tax_included') !== false} onChange={(e) => setPriceDetail('tax_included', e.target.checked)} />
                    税込価格
                  </label>
                </div>
              </div>
            </div>

            {/* Status toggle (edit mode only) */}
            {isEdit && editItem && (
              <div className="form-group" style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label className="form-label" style={{ marginBottom: '12px', display: 'block' }}>📋 確認ステータス</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => onEditItemChange({ ...editItem, status: true })}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '6px',
                      border: editItem.status ? '2px solid #10b981' : '1px solid #d1d5db',
                      background: editItem.status ? '#d1fae5' : '#111827',
                      color: editItem.status ? '#059669' : '#6b7280',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    ✓ 承認済み
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditItemChange({ ...editItem, status: false })}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '6px',
                      border: !editItem.status ? '2px solid #f59e0b' : '1px solid #d1d5db',
                      background: !editItem.status ? '#fef3c7' : '#111827',
                      color: !editItem.status ? '#d97706' : '#6b7280',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    ⚠️ 未承認
                  </button>
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '8px' }}>
                  ※ 「承認済み」に設定すると、メニューが検証済みとしてマークされます
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={handleClose}>キャンセル</button>
              <button className="btn btn-primary" onClick={onSave}>💾 保存</button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal.active {
          display: flex;
        }

        .modal-content {
          background: var(--bg-surface);
          border-radius: 12px;
          padding: 24px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }

        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--muted);
        }

        .modal-close:hover {
          color: var(--text);
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
        }

        .tab-nav {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .tab-nav::-webkit-scrollbar {
          display: none;
        }

        .tab-nav-btn {
          padding: 10px 16px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
          color: var(--muted);
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .tab-nav-btn:hover {
          color: var(--text);
        }

        .tab-nav-btn.active {
          color: #667eea;
          border-bottom-color: #667eea;
          font-weight: 600;
        }

        .tab-content {
          padding: 16px 0;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: var(--muted);
          font-size: 14px;
        }

        .form-input {
          width: 100%;
          padding: 10px;
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 14px;
          transition: border 0.3s;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .checkbox-group {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 8px;
          margin-top: 12px;
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          cursor: pointer;
        }

        .checkbox-item input {
          cursor: pointer;
        }

        .alert-info {
          background: #e0f2fe;
          color: #0369a1;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .btn {
          border: none;
          border-radius: 6px;
          padding: 10px 20px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #1d4ed8, #6d28d9);
        }

        .btn-secondary {
          background: var(--bg-surface);
          color: #374151;
          border: 1px solid var(--border);
        }

        .btn-secondary:hover {
          background: var(--bg-hover);
        }

        .btn-small {
          padding: 4px 8px;
          font-size: 12px;
          background: #f3f4f6;
          color: #374151;
        }

        .btn-small:hover {
          background: #e5e7eb;
        }

        .ai-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          font-weight: 500;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
        }

        .ai-btn:hover {
          background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
        }

        @media (max-width: 640px) {
          .modal {
            padding: 0;
          }
          .modal-content {
            max-height: 100dvh;
            height: 100dvh;
            border-radius: 0;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  )
}
