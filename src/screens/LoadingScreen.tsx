import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenShell } from '../components/ScreenShell'
import { PrimaryButton } from '../components/PrimaryButton'
import { useRoastSession } from '../context/RoastSessionContext'
import { generateRoast } from '../services/roastService'

export function LoadingScreen() {
  const navigate = useNavigate()
  const {
    platePreview,
    plateFile,
    phase,
    completeRoast,
    failRoast,
    resetSession,
  } = useRoastSession()

  useEffect(() => {
    if (!platePreview) {
      navigate('/upload', { replace: true })
      return
    }

    if (phase === 'processing') {
      // Ensure we have the file
      if (!plateFile) {
        failRoast('No image file found. Please try uploading again.')
        return
      }

      // Generate roast using OpenAI
      const generateRoastAsync = async () => {
        try {
          // Minimum 4.5 seconds to let video play
          const [roastData] = await Promise.all([
            generateRoast(plateFile),
            new Promise((resolve) => setTimeout(resolve, 4500)),
          ])

          completeRoast(roastData)
          navigate('/result', { replace: true })
        } catch (error) {
          console.error('Error generating roast:', error)
          failRoast(
            error instanceof Error
              ? error.message
              : 'Failed to generate roast. Please try again.'
          )
        }
      }

      generateRoastAsync()
    }

    if (phase === 'error') {
      // stay here until user retries
      return
    }

    if (phase === 'complete') {
      navigate('/result', { replace: true })
    }
  }, [phase, platePreview, plateFile, completeRoast, failRoast, navigate])

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
        <div className="loading-screen__scrim" />
        <p className="loading-screen__text">LET'S SEE WHAT WE GOT HERE</p>
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

