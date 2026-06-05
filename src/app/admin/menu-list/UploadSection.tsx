'use client'

import React from 'react'
import { DISH_CATEGORIES, VisionMenuItem } from '../../../services/api'
import { useAdminLang } from '../../../hooks/useAdminLang'

interface UploadSectionProps {
  fileInputRef: React.RefObject<HTMLInputElement>
  cameraInputRef: React.RefObject<HTMLInputElement>
  onFileSelect: () => void
  onCameraCapture: () => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onShowTextModal: () => void
  showTextModal: boolean
  pasteText: string
  onPasteTextChange: (text: string) => void
  onTextAnalyze: () => void
  onCloseTextModal: () => void
  isAnalyzing: boolean
  showVisionApproval: boolean
  visionResults: VisionMenuItem[]
  onApproveVisionItem: (index: number) => void
  onApproveAllVision: () => void
  approvingIndex: number | null
  approvingAll: boolean
  onCloseVisionApproval: () => void
  onRemoveVisionItem: (index: number) => void
  showApprovalModal: boolean
  pendingMenus: { id: number; name: string; price: number; category: string; confidence: number }[]
  scrapingUrl: string
  onApproveMenu: (id: number) => void
  onDenyMenu: (id: number) => void
  onApproveAll: () => void
  onDenyAll: () => void
  onCloseApprovalModal: () => void
  showFetchModal: boolean
}

export default function UploadSection({
  fileInputRef, cameraInputRef,
  onFileSelect, onCameraCapture, onFileUpload, onShowTextModal,
  showTextModal, pasteText, onPasteTextChange, onTextAnalyze, onCloseTextModal,
  isAnalyzing,
  showVisionApproval, visionResults, onApproveVisionItem, onApproveAllVision, approvingIndex, approvingAll, onCloseVisionApproval, onRemoveVisionItem,
  showApprovalModal, pendingMenus, scrapingUrl, onApproveMenu, onDenyMenu, onApproveAll, onDenyAll, onCloseApprovalModal,
  showFetchModal
}: UploadSectionProps) {
  const { t } = useAdminLang()
  const isRegistered = (item: VisionMenuItem): boolean => item.source === 'db'
  const newCount = visionResults.filter(item => !isRegistered(item)).length
  const registeredCount = visionResults.length - newCount
  return (
    <>
      {/* アップロードカード */}
      <div className="card" style={{ marginTop: '8px' }}>
        <div className="card-title">{t.menuList.upCardTitle}</div>
        <p style={{ marginBottom: '16px', color: '#94A3B8', fontSize: '14px' }}>{t.menuList.upCardDesc}</p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.xlsx,.xls,.csv"
          onChange={onFileUpload}
          style={{ display: 'none' }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFileUpload}
          style={{ display: 'none' }}
        />

        <div className="upload-grid">
          <button className="upload-btn" onClick={onCameraCapture}>
            <div className="upload-icon">📷</div>
            {t.menuList.upCamera}
          </button>
          <button className="upload-btn" onClick={onFileSelect}>
            <div className="upload-icon">📄</div>
            {t.menuList.upFile}
            <span style={{ fontSize: '10px', color: '#94A3B8' }}>{t.menuList.upFileFormats}</span>
          </button>
          <button className="upload-btn" onClick={onShowTextModal}>
            <div className="upload-icon">📝</div>
            {t.menuList.upPaste}
          </button>
          <button className="upload-btn" style={{ opacity: 0.4, cursor: 'not-allowed' }} disabled>
            <div className="upload-icon">☁️</div>
            {t.menuList.upGoogleDrive}
            <span style={{ fontSize: '10px', color: '#94A3B8' }}>{t.menuList.upComingSoon}</span>
          </button>
        </div>
      </div>

      {/* テキスト貼り付けモーダル */}
      {showTextModal && (
        <div className="modal active">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <button className="modal-close" onClick={onCloseTextModal}>×</button>
            <div className="modal-title">{t.menuList.upPasteModalTitle}</div>
            <p style={{ marginBottom: '12px', color: '#94A3B8', fontSize: '14px' }}>
              {t.menuList.upPasteDesc}
            </p>
            <textarea
              className="form-input"
              value={pasteText}
              onChange={(e) => onPasteTextChange(e.target.value)}
              placeholder={t.menuList.upPastePlaceholder}
              rows={10}
              style={{ marginBottom: '16px', fontSize: '14px' }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={onCloseTextModal}>{t.menuList.upPasteCancel}</button>
              <button className="btn btn-primary" onClick={onTextAnalyze} disabled={!pasteText.trim()}>
                {t.menuList.upPasteAnalyze}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 解析中モーダル */}
      {isAnalyzing && (
        <div className="modal active">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="modal-title">{t.menuList.upAnalyzingTitle}</div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ animation: 'progress 8s ease-in-out forwards' }}></div>
            </div>
            <div style={{ marginTop: '10px', color: '#94A3B8', fontSize: '14px' }}>
              {t.menuList.upAnalyzingDesc}
            </div>
          </div>
        </div>
      )}

      {/* 取得中モーダル */}
      {showFetchModal && (
        <div className="modal active">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="modal-title">{t.menuList.upFetchingTitle}</div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill"></div>
            </div>
            <div style={{ marginTop: '10px', color: '#94A3B8' }}>{t.menuList.upFetchingDesc}</div>
          </div>
        </div>
      )}

      {/* Vision解析結果の承認モーダル */}
      {showVisionApproval && (
        <div className="modal active">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <button className="modal-close" onClick={onCloseVisionApproval}>×</button>
            <div className="modal-title">{t.menuList.upVisionTitle}</div>

            <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', color: '#166534' }}>
              {t.menuList.upVisionDetectedSummary(visionResults.length)}
              {registeredCount > 0 && (
                <span>{t.menuList.upVisionRegisteredHint(registeredCount)}</span>
              )}
              {t.menuList.upVisionReviewHint}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button
                className="btn"
                onClick={onApproveAllVision}
                disabled={approvingAll || approvingIndex !== null}
                style={{ background: '#10b981', color: 'white', opacity: (approvingAll || approvingIndex !== null) ? 0.6 : 1 }}
              >
                {approvingAll ? t.menuList.upVisionApprovingAll : t.menuList.upVisionApproveAll(newCount)}
              </button>
              <button className="btn btn-danger" onClick={onCloseVisionApproval} disabled={approvingAll}>
                {t.menuList.upVisionDiscardAll}
              </button>
            </div>

            <div>
              {visionResults.map((item, index) => (
                <div key={index} style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>
                        {item.name_jp}
                        {item.name_en && <span style={{ fontSize: '13px', color: '#888', marginLeft: '8px' }}>{item.name_en}</span>}
                        {isRegistered(item) && (
                          <span style={{ fontSize: '11px', color: '#92400e', background: '#fef3c7', borderRadius: '6px', padding: '2px 8px', marginLeft: '8px', verticalAlign: 'middle' }}>
                            {t.menuList.upVisionRegistered}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '4px' }}>
                        💰 ¥{(item.price || 0).toLocaleString()} | 📂 {DISH_CATEGORIES[item.category] || item.category || t.menuList.upVisionUncategorized}
                      </div>
                      {item.description && (
                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>{item.description}</div>
                      )}
                      {item.ingredients && item.ingredients.length > 0 && (
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>🥘 {item.ingredients.join(', ')}</div>
                      )}
                      {item.allergens && item.allergens.length > 0 && (
                        <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px' }}>⚠️ {item.allergens.join(', ')}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                      <button
                        className="btn btn-small"
                        onClick={() => onApproveVisionItem(index)}
                        disabled={approvingAll || approvingIndex !== null || isRegistered(item)}
                        style={{
                          background: isRegistered(item) ? '#e5e7eb' : '#d1fae5',
                          color: isRegistered(item) ? '#6b7280' : '#059669',
                          opacity: (approvingAll || (approvingIndex !== null && approvingIndex !== index)) ? 0.6 : 1
                        }}
                      >
                        {approvingIndex === index ? t.menuList.upVisionItemApproving : isRegistered(item) ? t.menuList.upVisionItemRegistered : t.menuList.upVisionApproveItem}
                      </button>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => onRemoveVisionItem(index)}
                        disabled={approvingAll || approvingIndex !== null}
                      >
                        ❌
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {visionResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#94A3B8' }}>
                  {t.menuList.upVisionEmpty}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI取得メニューの承認モーダル */}
      {showApprovalModal && (
        <div className="modal active">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <button className="modal-close" onClick={onCloseApprovalModal}>×</button>
            <div className="modal-title">{t.menuList.upFetchApprovalTitle}</div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '8px' }}>
                {t.menuList.upFetchSourceLabel}: <strong>{scrapingUrl}</strong>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                <span><strong>{t.menuList.upFetchNew(pendingMenus.length)}</strong></span>
                <span><strong>{t.menuList.upFetchDuplicate(0)}</strong></span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button className="btn btn-success" onClick={onApproveAll} style={{ background: '#10b981', color: 'white' }}>
                {t.menuList.upFetchApproveAll}
              </button>
              <button className="btn btn-danger" onClick={onDenyAll}>
                {t.menuList.upFetchDenyAll}
              </button>
              <button className="btn btn-secondary">
                {t.menuList.upFetchMergeDup}
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#1f2937' }}>
                {t.menuList.upFetchNewHeading(pendingMenus.length)}
              </h4>

              {pendingMenus.map(menu => (
                <div key={menu.id} style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>{menu.name}</div>
                      <div style={{ fontSize: '13px', color: '#94A3B8' }}>
                        ¥{menu.price.toLocaleString()} | {menu.category} | {t.menuList.upFetchConfidence(menu.confidence)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-small"
                        onClick={() => onApproveMenu(menu.id)}
                        style={{ background: '#d1fae5', color: '#059669' }}
                      >
                        {t.menuList.upFetchApprove}
                      </button>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => onDenyMenu(menu.id)}
                      >
                        {t.menuList.upFetchDeny}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {pendingMenus.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#94A3B8' }}>
                  {t.menuList.upVisionEmpty}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .card {
          background: var(--bg-surface);
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        .card-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          color: var(--text);
        }

        .upload-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .upload-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          background: var(--bg-hover);
          border: 2px dashed var(--border);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          color: #E2E8F0;
          font-weight: 500;
        }

        .upload-btn:hover {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.15);
          color: #F8FAFC;
        }

        .upload-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        @media (max-width: 768px) {
          .upload-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

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

        .btn-danger {
          background: #fee2e2;
          color: #dc2626;
        }

        .btn-danger:hover {
          background: #fecaca;
        }

        .progress-bar-container {
          height: 12px;
          background: var(--border);
          border-radius: 6px;
          overflow: hidden;
          margin-top: 16px;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          width: 0%;
          animation: progress 2s ease-in-out forwards;
        }

        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
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
    </>
  )
}
