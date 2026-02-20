'use client'

interface UploadItem {
  icon: string
  label: string
  subLabel?: string
  disabled?: boolean
  onClick: () => void
}

interface UploadAreaProps {
  items: UploadItem[]
}

export default function UploadArea({ items }: UploadAreaProps) {
  return (
    <div className="ua-grid">
      {items.map((item, i) => (
        <button
          key={i}
          className="ua-btn"
          onClick={item.onClick}
          disabled={item.disabled}
          style={item.disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
        >
          <div className="ua-icon">{item.icon}</div>
          {item.label}
          {item.subLabel && <span className="ua-sub">{item.subLabel}</span>}
        </button>
      ))}

      <style jsx>{`
        .ua-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        .ua-btn {
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
          color: var(--text-body, #374151);
        }
        .ua-btn:hover:not(:disabled) {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.05);
        }
        .ua-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }
        .ua-sub {
          font-size: 10px;
          color: var(--muted);
          margin-top: 4px;
        }
        @media (max-width: 768px) {
          .ua-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  )
}
