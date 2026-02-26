'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import { SearchLogsApi } from '../../../services/api'

type SearchLogItem = {
  id: number
  query_text: string | null
  filters: Record<string, string> | null
  result_count: number | null
  created_at: string | null
}

export default function SearchLogsPage() {
  const [logs, setLogs] = useState<SearchLogItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchLogs = async (p: number) => {
    setLoading(true)
    try {
      const res = await SearchLogsApi.getAll(p, 50)
      setLogs(res.result.items)
      setTotal(res.result.total)
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs(page) }, [page])

  return (
    <AdminLayout title="検索ログ">
      <div style={{ padding: 24 }}>
        <p style={{ color: '#888', marginBottom: 16 }}>
          トップページの検索で入力されたテキストとフィルタの履歴（{total}件）
        </p>

        {loading ? (
          <p>読み込み中...</p>
        ) : logs.length === 0 ? (
          <p>まだ検索ログがありません</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px' }}>日時</th>
                <th style={{ padding: '8px 12px' }}>テキスト</th>
                <th style={{ padding: '8px 12px' }}>フィルタ</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>結果件数</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', color: '#888' }}>
                    {log.created_at ? new Date(log.created_at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: log.query_text ? 600 : 400, color: log.query_text ? '#fff' : '#666' }}>
                    {log.query_text || '-'}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#aaa' }}>
                    {log.filters ? Object.entries(log.filters).map(([k, v]) => `${k}=${v}`).join(', ') : '-'}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: log.result_count === 0 ? '#f44' : '#8f8' }}>
                    {log.result_count ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {total > 50 && (
          <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 16px' }}>前へ</button>
            <span style={{ padding: '6px 12px', color: '#888' }}>{page} / {Math.ceil(total / 50)}</span>
            <button disabled={page >= Math.ceil(total / 50)} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 16px' }}>次へ</button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
