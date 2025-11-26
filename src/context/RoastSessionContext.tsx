import type { ReactNode } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { RoastResponse } from '../services/roastService'

type RoastPhase = 'idle' | 'ready' | 'processing' | 'complete' | 'error'

interface RoastSessionState {
  phase: RoastPhase
  plateFile: File | null
  platePreview: string | null
  roastData: RoastResponse | null
  error: string | null
}

interface RoastSessionContextValue extends RoastSessionState {
  selectPlate: (file: File, previewUrl: string) => void
  startProcessing: () => void
  completeRoast: (roast: RoastResponse) => void
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
  roastData: null,
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
        roastData: null,
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

  const completeRoast = useCallback((roast: RoastResponse) => {
    setState((prev) => ({
      ...prev,
      roastData: roast,
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

