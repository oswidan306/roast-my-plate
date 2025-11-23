import { useCallback } from 'react'

interface ShareOptions {
  roastText: string
  onFallback?: () => void
}

export function useShareRoast() {
  const share = useCallback(
    async ({ roastText, onFallback }: ShareOptions) => {
      if (navigator.share) {
        try {
          const payload: ShareData = {
            title: 'Roast My Plate',
            text: roastText,
            url: window.location.href,
          }
          await navigator.share(payload)
          return true
        } catch (err) {
          if ((err as DOMException).name === 'AbortError') {
            return false
          }
        }
      }

      try {
        await navigator.clipboard.writeText(roastText)
        onFallback?.()
        return true
      } catch (_err) {
        onFallback?.()
        return false
      }
    },
    [],
  )

  return share
}

