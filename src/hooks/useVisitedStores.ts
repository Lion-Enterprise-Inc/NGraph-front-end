import { useEffect, useState } from 'react'
import { getVisitedStores, type VisitedStore } from '../utils/storage'

export function useVisitedStores() {
  const [stores, setStores] = useState<VisitedStore[]>([])

  useEffect(() => {
    setStores(getVisitedStores())
  }, [])

  const refresh = () => setStores(getVisitedStores())

  return { stores, refresh }
}
