import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenShell } from '../components/ScreenShell'
import { PrimaryButton } from '../components/PrimaryButton'
import { useRoastSession } from '../context/RoastSessionContext'
import { generateRoast } from '../services/roastService'
import { trackEvent, trackPageView } from '../lib/analytics'

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
  const [progress, setProgress] = useState(0)

  // Track page view
  useEffect(() => {
    trackPageView('/loading', 'Loading Screen')
  }, [])

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
          // Animate progress bar
          const progressInterval = setInterval(() => {
            setProgress((prev) => {
              if (prev >= 95) {
                clearInterval(progressInterval)
                return 95
              }
              return prev + 2
            })
          }, 90) // Update every 90ms for ~4.5 seconds

          // Minimum 4.5 seconds to let video play
          const [roastData] = await Promise.all([
            generateRoast(plateFile),
            new Promise((resolve) => setTimeout(resolve, 4500)),
          ])

          clearInterval(progressInterval)
          setProgress(100)
          
          // Small delay to show 100%
          setTimeout(() => {
            completeRoast(roastData)
            // Track successful roast generation
            trackEvent('roast_generated', {
              rating: roastData.rating,
              severity: roastData.severity,
            })
            navigate('/result', { replace: true })
          }, 200)
        } catch (error) {
          console.error('Error generating roast:', error)
          const errorMessage = error instanceof Error
            ? error.message
            : 'Failed to generate roast. Please try again.'
          
          // Track roast error
          trackEvent('roast_error', {
            error_message: errorMessage,
          })
          
          failRoast(errorMessage)
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
        preload="auto"
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
        {/* 8-bit style progress bar */}
        <div className="loading-screen__progress-container">
          <div className="loading-screen__progress-bar">
            <div 
              className="loading-screen__progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
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

