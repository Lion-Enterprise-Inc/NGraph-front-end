'use client'

interface StatusBadgeProps {
  status: 'verified' | 'warning' | 'error'
  label: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <>
      <span className={`sb-badge sb-${status}`}>{label}</span>
      <style jsx>{`
        .sb-badge {
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        .sb-verified {
          background: #d1fae5;
          color: #059669;
        }
        .sb-warning {
          background: #fef3c7;
          color: #d97706;
        }
        .sb-error {
          background: #fee2e2;
          color: #dc2626;
        }
      `}</style>
    </>
  )
}

interface ConfidenceBarProps {
  score: number
}

export function ConfidenceBar({ score }: ConfidenceBarProps) {
  const color = score >= 75 ? '#28a745' : score >= 40 ? '#ffc107' : '#dc3545'
  const label = score >= 75 ? 'OK' : score >= 40 ? '確認推奨' : '要修正'

  return (
    <div className="cb-container">
      <div className="cb-row">
        <div className="cb-track">
          <div className="cb-fill" style={{ width: `${score}%`, background: color }} />
        </div>
        <span className="cb-score" style={{ color }}>{score}%</span>
      </div>
      <span className="cb-label" style={{ color }}>{label}</span>

      <style jsx>{`
        .cb-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .cb-row {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .cb-track {
          width: 50px;
          height: 4px;
          background: #e9ecef;
          border-radius: 2px;
          overflow: hidden;
        }
        .cb-fill {
          height: 100%;
        }
        .cb-score {
          font-size: 11px;
          font-weight: 600;
        }
        .cb-label {
          font-size: 9px;
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}
