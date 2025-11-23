import type { ReactNode } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

type RoastPhase = 'idle' | 'ready' | 'processing' | 'complete' | 'error'

interface RoastSessionState {
  phase: RoastPhase
  plateFile: File | null
  platePreview: string | null
  roastText: string
  error: string | null
}

interface RoastSessionContextValue extends RoastSessionState {
  selectPlate: (file: File, previewUrl: string) => void
  startProcessing: () => void
  completeRoast: (roast: string) => void
  failRoast: (message: string) => void
  resetSession: () => void
}

const RoastSessionContext = createContext<RoastSessionContextValue | undefined>(
  undefined,
)

const initialState: RoastSessionState = {
  phase: 'idle',
  plateFile: null,
  platePreview: null,
  roastText: '',
  error: null,
}

export function RoastSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RoastSessionState>(initialState)

  const selectPlate = useCallback((file: File, previewUrl: string) => {
    setState((prev) => {
      if (prev.platePreview && prev.platePreview !== previewUrl) {
        URL.revokeObjectURL(prev.platePreview)
      }

      return {
        phase: 'ready',
        plateFile: file,
        platePreview: previewUrl,
        roastText: '',
        error: null,
      }
    })
  }, [])

  const startProcessing = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: 'processing',
      error: null,
    }))
  }, [])

  const completeRoast = useCallback((roast: string) => {
    setState((prev) => ({
      ...prev,
      roastText: roast,
      phase: 'complete',
      error: null,
    }))
  }, [])

  const failRoast = useCallback((message: string) => {
    setState((prev) => ({
      ...prev,
      phase: 'error',
      error: message,
    }))
  }, [])

  const resetSession = useCallback(() => {
    setState((prev) => {
      if (prev.platePreview) {
        URL.revokeObjectURL(prev.platePreview)
      }
      return initialState
    })
  }, [])

  const value = useMemo<RoastSessionContextValue>(
    () => ({
      ...state,
      selectPlate,
      startProcessing,
      completeRoast,
      failRoast,
      resetSession,
    }),
    [state, selectPlate, startProcessing, completeRoast, failRoast, resetSession],
  )

  return (
    <RoastSessionContext.Provider value={value}>
      {children}
    </RoastSessionContext.Provider>
  )
}

export function useRoastSession() {
  const context = useContext(RoastSessionContext)
  if (!context) {
    throw new Error('useRoastSession must be used within RoastSessionProvider')
  }
  return context
}

