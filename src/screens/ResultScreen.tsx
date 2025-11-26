import { useEffect, useRef, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenShell } from '../components/ScreenShell'
import { useRoastSession } from '../context/RoastSessionContext'

const RESULT_BACKGROUNDS = {
  LOW: '/assets/result-1.png',
  MEDIUM: '/assets/result-2.png',
  HIGH: '/assets/result-3.png',
}

export function ResultScreen() {
  const navigate = useNavigate()
  const { platePreview, roastData, phase, resetSession } = useRoastSession()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isSaved, setIsSaved] = useState(false)

  const defaultRoast = {
    target: 'plate',
    roast: 'This plate looks like the ingredients filed for divorce.',
    rating: 2.1,
    severity: 'MEDIUM' as const,
  }

  const roast = roastData || defaultRoast

  // Get background based on severity
  const resultBackground = useMemo(() => {
    return RESULT_BACKGROUNDS[roast.severity] || RESULT_BACKGROUNDS.MEDIUM
  }, [roast.severity])

  useEffect(() => {
    if (!platePreview) {
      navigate('/upload', { replace: true })
      return
    }

    if (phase === 'processing') {
      navigate('/loading', { replace: true })
      return
    }
  }, [platePreview, phase, navigate])

  const createShareImage = async (includeUrl: boolean = false) => {
    if (!containerRef.current || !platePreview) return null

    try {
      // Create a canvas to capture the image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      // Set canvas size to match viewport
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      // Get the background image based on severity
      const bgImg = new Image()
      bgImg.crossOrigin = 'anonymous'
      bgImg.src = resultBackground

      await new Promise((resolve, reject) => {
        bgImg.onload = resolve
        bgImg.onerror = reject
      })

      // Draw background
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height)

      // Draw dark scrim (darker towards bottom)
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)')
      gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw rating and roast text above plate
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      
      // Rating (large, red number)
      const ratingText = `${roast.rating.toFixed(1)}/10`
      ctx.font = 'bold 48px "PP Editorial New", serif'
      ctx.fillStyle = '#dc2626'
      const ratingX = canvas.width * 0.1 // Left side
      const ratingY = canvas.height * 0.15 // Above plate
      ctx.fillText(ratingText, ratingX, ratingY)

      // Roast text (white, below rating)
      ctx.font = '200 24px "PP Editorial New", serif'
      ctx.fillStyle = '#fff'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 2
      
      const roastX = ratingX
      const roastY = ratingY + 60
      const maxWidth = canvas.width - roastX * 2
      const lineHeight = 32
      const words = roast.roast.split(' ')
      let line = ''
      let y = roastY

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' '
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line.trim(), roastX, y)
          line = words[i] + ' '
          y += lineHeight
        } else {
          line = testLine
        }
      }
      if (line.trim()) {
        ctx.fillText(line.trim(), roastX, y)
      }

      // Reset shadow
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      // Draw plate image (positioned 40px above bottom CTAs)
      const plateImg = new Image()
      plateImg.crossOrigin = 'anonymous'
      plateImg.src = platePreview
      await new Promise((resolve, reject) => {
        plateImg.onload = resolve
        plateImg.onerror = reject
      })

      const plateSize = Math.min(420, canvas.width * 0.7)
      const plateX = canvas.width / 2 - plateSize / 2
      // Position 40px above bottom CTAs (CTAs are 56px + padding)
      const plateY = canvas.height - 56 - 40 - 40 - plateSize // 40px above CTAs, 40px padding

      // Create circular clipping for plate
      ctx.save()
      ctx.beginPath()
      ctx.arc(plateX + plateSize / 2, plateY + plateSize / 2, plateSize / 2, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(plateImg, plateX, plateY, plateSize, plateSize)
      ctx.restore()

      // Draw URL at bottom if sharing
      if (includeUrl) {
        ctx.fillStyle = '#fff'
        ctx.font = '200 16px "PP Editorial New", serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText('ROASTMYPLATE.APP', canvas.width / 2, canvas.height - 20)
      }

      return canvas
    } catch (error) {
      console.error('Error creating share image:', error)
      return null
    }
  }

  const handleSave = async () => {
    // If already saved, don't do anything
    if (isSaved) return

    const canvas = await createShareImage(false)
    if (!canvas) {
      alert('Unable to save image. Please try again.')
      return
    }

    canvas.toBlob(async (blob) => {
      if (!blob) return

      // Try to save to photos using Web Share API
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], 'roast-my-plate.jpg', { type: 'image/jpeg' })
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file] })
            setIsSaved(true)
            return
          } catch (err) {
            // User cancelled or dismissed - don't do anything
            if ((err as DOMException).name === 'AbortError') {
              return
            }
            // If share failed for other reason, mark as saved anyway
            setIsSaved(true)
            return
          }
        }
      }

      // If Web Share API not available, mark as saved (user can use share to story)
      setIsSaved(true)
    }, 'image/jpeg', 0.9)
  }

  const handleReplacePlate = () => {
    resetSession()
    navigate('/upload')
  }

  const handleShareToStory = async () => {
    const canvas = await createShareImage(true)
    if (!canvas) {
      alert('Unable to create share image. Please try again.')
      return
    }

    canvas.toBlob(async (blob) => {
      if (!blob) return

      // Try Web Share API first
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], 'roast-my-plate.jpg', { type: 'image/jpeg' })
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file] })
            return
          } catch (err) {
            // User cancelled - don't do anything
            if ((err as DOMException).name === 'AbortError') {
              return
            }
            // Fall through to Instagram deep link
          }
        }
      }

      // Open Instagram Stories directly (no download)
      const instagramUrl = 'instagram://story-camera'
      
      // For iOS
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        window.location.href = instagramUrl
        // Fallback to web if app doesn't open
        setTimeout(() => {
          window.location.href = 'https://www.instagram.com/'
        }, 1000)
      } else {
        // For Android
        window.location.href = instagramUrl
        setTimeout(() => {
          window.open('https://www.instagram.com/', '_blank')
        }, 1000)
      }
    }, 'image/jpeg', 0.9)
  }

  if (!platePreview) {
    return null
  }

  return (
    <ScreenShell id="result" background="result" padded={false}>
      <div
        className="result-screen"
        style={{
          backgroundImage: `url(${resultBackground})`,
        }}
      >
        <div className="result-screen__scrim" />
        <div className="result-screen__content" ref={containerRef}>
          {/* Top bar with logo and reset button */}
          <div className="result-screen__top-bar">
            <img
              src="/assets/RMP-logo.svg"
              alt="Roast My Plate"
              className="result-screen__logo"
            />

            <button
              className="result-screen__new-button"
              onClick={handleReplacePlate}
              aria-label="New"
            >
              NEW
            </button>
          </div>

          {/* Rating and roast text above plate */}
          <div className="result-screen__roast-section">
            <p className="result-screen__rating">{roast.rating.toFixed(1)}/10</p>
            <p className="result-screen__roast-text">{roast.roast}</p>
          </div>

          {/* Plate */}
          <div className="result-screen__plate">
            <img src={platePreview} alt="Roasted plate" />
          </div>

          {/* Bottom CTAs */}
          <div className="result-screen__bottom-ctas">
            <button
              className={`result-screen__save-button-bottom ${isSaved ? 'result-screen__save-button-bottom--saved' : ''}`}
              onClick={handleSave}
            >
              {isSaved ? 'SAVED' : 'SAVE'}
            </button>
            <button
              className="result-screen__share-button"
              onClick={handleShareToStory}
            >
              SHARE TO STORY
            </button>
          </div>
        </div>
      </div>
    </ScreenShell>
  )
}
