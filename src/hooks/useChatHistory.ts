import { useEffect, useState } from 'react'
import { getThreads, saveThread, type ThreadEntry } from '../utils/storage'

export function useChatHistory(slug: string | null) {
  const [threads, setThreads] = useState<ThreadEntry[]>([])

  useEffect(() => {
    if (slug) setThreads(getThreads(slug))
  }, [slug])

  const save = (entry: ThreadEntry) => {
    if (!slug) return
    saveThread(slug, entry)
    setThreads(getThreads(slug))
  }

  const refresh = () => {
    if (slug) setThreads(getThreads(slug))
  }

  return { threads, save, refresh }
}
