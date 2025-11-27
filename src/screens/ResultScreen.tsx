import { useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenShell } from '../components/ScreenShell'
import { useRoastSession } from '../context/RoastSessionContext'
import { trackEvent, trackPageView } from '../lib/analytics'

const RESULT_BACKGROUNDS = {
  LOW: '/assets/result-1.png',
  MEDIUM: '/assets/result-2.png',
  HIGH: '/assets/result-3.png',
}

export function ResultScreen() {
  const navigate = useNavigate()
  const { platePreview, roastData, phase, resetSession } = useRoastSession()
  const containerRef = useRef<HTMLDivElement | null>(null)

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

  // Track page view
  useEffect(() => {
    if (platePreview && phase === 'complete') {
      trackPageView('/result', 'Result Screen')
    }
  }, [platePreview, phase])

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
      // Create a high-resolution canvas for better quality
      const scale = 2 // 2x resolution for retina/high DPI displays
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      // Set canvas size to match viewport at higher resolution
      canvas.width = window.innerWidth * scale
      canvas.height = window.innerHeight * scale
      
      // Scale context to maintain proper sizing
      ctx.scale(scale, scale)

      // Get the background image based on severity
      const bgImg = new Image()
      bgImg.crossOrigin = 'anonymous'
      bgImg.src = resultBackground

      await new Promise((resolve, reject) => {
        bgImg.onload = resolve
        bgImg.onerror = reject
      })

      // Draw background at full resolution
      ctx.drawImage(bgImg, 0, 0, window.innerWidth, window.innerHeight)

      // Draw dark scrim (darker towards bottom)
      const gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight)
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)')
      gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)

      // Draw logo centered horizontally and vertically in upper portion
      const logoImg = new Image()
      logoImg.crossOrigin = 'anonymous'
      logoImg.src = '/assets/RMP-logo.svg'
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve
        logoImg.onerror = reject
      })

      const logoWidth = 200
      const logoHeight = (logoImg.height / logoImg.width) * logoWidth
      const logoX = window.innerWidth / 2 - logoWidth / 2 // Centered horizontally
      // Position logo at 10% from top, centered vertically
      const logoY = window.innerHeight * 0.1 - logoHeight / 2 // 10% from top, centered vertically
      ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight)

      // Draw rating and roast text centered horizontally, at original higher positions
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      
      // Calculate center position for horizontal centering
      const centerX = window.innerWidth / 2
      
      // Rating (number in red, "/10" in white ultralight)
      const ratingNumber = roast.rating.toFixed(1)
      const ratingSuffix = '/10'
      ctx.font = 'bold 48px "PP Editorial New", serif'
      const ratingY = window.innerHeight * 0.25 // Position rating at 25% from top (pushed lower to avoid logo)
      
      // Measure both parts to calculate centered position
      ctx.textAlign = 'left' // Temporarily use left align for precise positioning
      const numberMetrics = ctx.measureText(ratingNumber)
      
      // Measure "/10" with ultralight font
      ctx.font = '200 48px "PP Editorial New", serif'
      const suffixMetrics = ctx.measureText(ratingSuffix)
      const totalWidth = numberMetrics.width + suffixMetrics.width
      
      // Calculate starting position to center the entire rating
      const startX = centerX - totalWidth / 2
      
      // Draw number in red with bold font
      ctx.font = 'bold 48px "PP Editorial New", serif'
      ctx.fillStyle = '#dc2626'
      ctx.fillText(ratingNumber, startX, ratingY)
      
      // Draw "/10" in white with ultralight font, right after the number
      ctx.font = '200 48px "PP Editorial New", serif'
      ctx.fillStyle = '#fff'
      ctx.fillText(ratingSuffix, startX + numberMetrics.width, ratingY)
      
      // Reset text alignment for roast text
      ctx.textAlign = 'center'

      // Roast text (white, below rating)
      ctx.font = '200 24px "PP Editorial New", serif'
      ctx.fillStyle = '#fff'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 2
      
      const roastY = window.innerHeight * 0.25 + 60 // Position roast below rating (pushed lower to avoid logo)
      const maxWidth = window.innerWidth * 0.8 // 80% of width for text wrapping
      const lineHeight = 32
      const words = roast.roast.split(' ')
      let line = ''
      let y = roastY

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' '
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line.trim(), centerX, y)
          line = words[i] + ' '
          y += lineHeight
        } else {
          line = testLine
        }
      }
      if (line.trim()) {
        ctx.fillText(line.trim(), centerX, y)
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

      const plateSize = Math.min(420, window.innerWidth * 0.7)
      const plateX = window.innerWidth / 2 - plateSize / 2
      // Position 40px above bottom CTAs + 1rem down (CTAs are 56px + padding)
      const plateY = window.innerHeight - 56 - 40 - 40 - 16 - plateSize // 40px above CTAs, 40px padding, 1rem (16px) down

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
        ctx.fillText('ROASTMYPLATE.APP', window.innerWidth / 2, window.innerHeight - 40)
      }

      return canvas
    } catch (error) {
      console.error('Error creating share image:', error)
      return null
    }
  }

  const handleReplacePlate = () => {
    resetSession()
    navigate('/upload')
  }

  const handleShare = async () => {
    // Track share attempt
    trackEvent('share_attempt')

    const canvas = await createShareImage(true)
    if (!canvas) {
      alert('Unable to create share image. Please try again.')
      return
    }

    // Canvas is already at 2x resolution, convert to blob at maximum quality
    canvas.toBlob(async (blob) => {
      if (!blob) return

      // Try Web Share API first (opens iOS bottom sheet)
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], 'roast-my-plate.jpg', { type: 'image/jpeg' })
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file] })
            // Track successful share
            trackEvent('share_success', {
              method: 'web_share_api',
            })
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

      // Fallback: Open Instagram Stories directly
      const instagramUrl = 'instagram://story-camera'
      
      // Track share success for Instagram deep link
      trackEvent('share_success', {
        method: 'instagram_deep_link',
      })
      
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
    }, 'image/jpeg', 1.0) // Maximum quality (1.0)
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
            <p className="result-screen__rating">
              <span style={{ color: '#dc2626' }}>{roast.rating.toFixed(1)}</span>
              <span style={{ color: '#fff', fontWeight: 200 }}>/10</span>
            </p>
            <p className="result-screen__roast-text">{roast.roast}</p>
          </div>

          {/* Plate */}
          <div className="result-screen__plate">
            <img src={platePreview} alt="Roasted plate" />
          </div>

          {/* Bottom CTA */}
          <div className="result-screen__bottom-ctas">
            <button
              className="result-screen__share-button"
              onClick={handleShare}
            >
              SHARE
            </button>
          </div>
        </div>
      </div>
    </ScreenShell>
  )
}
