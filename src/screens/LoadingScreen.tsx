import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenShell } from '../components/ScreenShell'
import { PrimaryButton } from '../components/PrimaryButton'
import { useRoastSession } from '../context/RoastSessionContext'

export function LoadingScreen() {
  const navigate = useNavigate()
  const {
    platePreview,
    phase,
    completeRoast,
    resetSession,
  } = useRoastSession()

  useEffect(() => {
    if (!platePreview) {
      navigate('/upload', { replace: true })
      return
    }

    if (phase === 'processing') {
      // Let video play entirely - approximately 10 seconds for full loop
      const timer = setTimeout(() => {
        completeRoast(
          'That turkey looks drier than my inbox after Thanksgiving. The cranberry splat? Avant-garde ketchup.',
        )
        navigate('/result', { replace: true })
      }, 10000) // Increased to 10 seconds to let video play
      return () => clearTimeout(timer)
    }

    if (phase === 'error') {
      // stay here until user retries
      return
    }

    if (phase === 'complete') {
      navigate('/result', { replace: true })
    }
  }, [phase, platePreview, completeRoast, navigate])

  const shouldShowError = phase === 'error'

  return (
    <ScreenShell id="loading" background="loading" padded={false}>
      <video
        className="loading__video"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/assets/loading.mp4" type="video/mp4" />
      </video>
      <div className="loading-screen">
        <p className="loading-screen__text">CHEF IS INSPECTING</p>
        {platePreview && (
          <div className="loading-screen__plate">
            <img src={platePreview} alt="Uploaded plate" />
          </div>
        )}
        {shouldShowError && (
          <div className="loading-screen__actions">
            <PrimaryButton onClick={() => navigate('/upload')}>Try Again</PrimaryButton>
            <PrimaryButton variant="ghost" onClick={resetSession}>
              Reset
            </PrimaryButton>
          </div>
        )}
      </div>
    </ScreenShell>
  )
}

