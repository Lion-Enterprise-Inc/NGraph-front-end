'use client'

import { ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render: (item: T, index: number) => ReactNode
  mobileRender?: (item: T, index: number) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  emptyMessage?: string
  mobileCardRender?: (item: T, index: number) => ReactNode
}

export default function DataTable<T>({ columns, data, keyExtractor, emptyMessage = 'データがありません', mobileCardRender }: DataTableProps<T>) {
  return (
    <>
      {/* Desktop Table */}
      <div className="dt-table-wrap">
        <table className="dt-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} style={{ width: col.width, textAlign: col.align || 'left' }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : data.map((item, index) => (
              <tr key={keyExtractor(item)}>
                {columns.map(col => (
                  <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                    {col.render(item, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      {mobileCardRender && (
        <div className="dt-cards">
          {data.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
              {emptyMessage}
            </div>
          ) : data.map((item, index) => (
            <div key={keyExtractor(item)} className="dt-card">
              {mobileCardRender(item, index)}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .dt-table-wrap {
          overflow-x: auto;
          margin-bottom: 16px;
        }
        .dt-table {
          width: 100%;
          border-collapse: collapse;
        }
        .dt-table th,
        .dt-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }
        .dt-table th {
          background: var(--bg-hover);
          font-weight: 600;
          font-size: 13px;
          color: var(--muted);
        }
        .dt-table tr:hover {
          background: var(--bg-hover);
        }
        .dt-cards {
          display: none;
        }
        .dt-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 14px;
          margin-bottom: 10px;
        }
        @media (max-width: 768px) {
          .dt-table-wrap {
            display: none;
          }
          .dt-cards {
            display: block;
          }
        }
      `}</style>
    </>
  )
}
