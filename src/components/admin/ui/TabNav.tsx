'use client'

interface Tab {
  key: string
  label: string
}

interface TabNavProps {
  tabs: Tab[]
  activeTab: string
  onChange: (key: string) => void
}

export default function TabNav({ tabs, activeTab, onChange }: TabNavProps) {
  return (
    <div className="tabnav-container">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`tabnav-btn ${activeTab === tab.key ? 'active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}

      <style jsx>{`
        .tabnav-container {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .tabnav-container::-webkit-scrollbar {
          display: none;
        }
        .tabnav-btn {
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
        .tabnav-btn:hover {
          color: var(--text);
        }
        .tabnav-btn.active {
          color: #667eea;
          border-bottom-color: #667eea;
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}
