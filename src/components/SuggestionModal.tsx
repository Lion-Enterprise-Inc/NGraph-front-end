'use client'

import { useState } from 'react'
import { ContributionApi } from '../services/api'

type SuggestionModalProps = {
  open: boolean;
  onClose: () => void;
  menuItem: { name_jp: string; menu_uid?: string; restaurant_uid?: string };
  onSubmit: () => void;
};

const FIELD_OPTIONS = [
  { value: 'price', label: '価格' },
  { value: 'name', label: '名前' },
  { value: 'ingredients', label: '材料' },
  { value: 'description', label: '説明' },
];

const getSessionId = (): string => {
  let id = localStorage.getItem('ngraph_session_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('ngraph_session_id', id);
  }
  return id;
};

export default function SuggestionModal({ open, onClose, menuItem, onSubmit }: SuggestionModalProps) {
  const [field, setField] = useState('price');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!value.trim() || !menuItem.menu_uid || !menuItem.restaurant_uid) return;
    setSubmitting(true);
    try {
      await ContributionApi.suggest({
        menu_uid: menuItem.menu_uid,
        restaurant_uid: menuItem.restaurant_uid,
        field,
        suggested_value: value.trim(),
        reason: reason.trim() || undefined,
        session_id: getSessionId(),
      });
      setToast(true);
      setTimeout(() => {
        setToast(false);
        setValue('');
        setReason('');
        onClose();
        onSubmit();
      }, 1200);
    } catch (err) {
      console.error('Suggestion submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease',
        }}
      />
      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#1a1a2e',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          padding: '20px 16px 32px',
          zIndex: 1000,
          animation: 'slideUp 0.25s ease',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        {/* Handle bar */}
        <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.2)', margin: '0 auto 16px' }} />

        <div style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '4px' }}>
          この情報を修正
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
          {menuItem.name_jp}
        </div>

        {/* Field selector */}
        <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', display: 'block' }}>
          修正する項目
        </label>
        <select
          value={field}
          onChange={(e) => setField(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.9)',
            fontSize: '14px',
            marginBottom: '12px',
            outline: 'none',
          }}
        >
          {FIELD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Correction input */}
        <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', display: 'block' }}>
          正しい情報
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="正しい値を入力"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.9)',
            fontSize: '14px',
            marginBottom: '12px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {/* Reason (optional) */}
        <label style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', display: 'block' }}>
          理由（任意）
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="修正の理由があれば"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.9)',
            fontSize: '14px',
            marginBottom: '20px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim() || submitting}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            border: 'none',
            background: value.trim() ? '#4f8cff' : 'rgba(255,255,255,0.1)',
            color: value.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
            fontSize: '15px',
            fontWeight: 600,
            cursor: value.trim() ? 'pointer' : 'default',
            transition: 'background 0.15s',
          }}
        >
          {submitting ? '送信中...' : '送信'}
        </button>

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.85)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 500,
            zIndex: 1100,
          }}>
            送信しました
          </div>
        )}
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
