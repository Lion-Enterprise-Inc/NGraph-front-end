const VISITED_STORES_KEY = 'ngraph_visited_stores'
const THREADS_PREFIX = 'ngraph_threads_'

export type VisitedStore = {
  slug: string
  name: string
  threadCount: number
  lastVisited: string
}

export type ThreadEntry = {
  thread_uid: string
  title: string
  preview: string
  updatedAt: string
}

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function safeSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('localStorage write failed', e)
  }
}

export function getVisitedStores(): VisitedStore[] {
  return safeGet<VisitedStore[]>(VISITED_STORES_KEY, [])
}

export function recordVisit(slug: string, name: string) {
  const stores = getVisitedStores()
  const idx = stores.findIndex(s => s.slug === slug)
  if (idx >= 0) {
    stores[idx].lastVisited = new Date().toISOString()
    stores[idx].name = name
  } else {
    stores.push({ slug, name, threadCount: 0, lastVisited: new Date().toISOString() })
  }
  safeSet(VISITED_STORES_KEY, stores)
}

export function incrementThreadCount(slug: string) {
  const stores = getVisitedStores()
  const store = stores.find(s => s.slug === slug)
  if (store) {
    store.threadCount += 1
    safeSet(VISITED_STORES_KEY, stores)
  }
}

export function getThreads(slug: string): ThreadEntry[] {
  return safeGet<ThreadEntry[]>(`${THREADS_PREFIX}${slug}`, [])
}

export function saveThread(slug: string, entry: ThreadEntry) {
  const threads = getThreads(slug)
  const idx = threads.findIndex(t => t.thread_uid === entry.thread_uid)
  if (idx >= 0) {
    threads[idx] = entry
  } else {
    threads.unshift(entry)
  }
  safeSet(`${THREADS_PREFIX}${slug}`, threads)
}
