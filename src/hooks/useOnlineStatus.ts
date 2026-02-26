import { useState, useEffect } from 'react'

/**
 * Tracks browser online/offline state.
 * Returns { online, lastOnline } so the UI can show
 * how long ago the data was last refreshed while online.
 */
export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  const [lastOnline, setLastOnline] = useState<Date | null>(
    navigator.onLine ? new Date() : null
  )

  useEffect(() => {
    function handleOnline() {
      setOnline(true)
      setLastOnline(new Date())
    }
    function handleOffline() {
      setOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { online, lastOnline }
}
