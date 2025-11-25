import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenShell } from '../components/ScreenShell'
import { useRoastSession } from '../context/RoastSessionContext'

// Chef background images - will be added to public/assets
const CHEF_BACKGROUNDS = [
  '/assets/chef-1.png',
  '/assets/chef-2.png',
  '/assets/chef-3.png',
]

const CHEF_INDEX_KEY = 'roast-my-plate-chef-index'

export function ResultScreen() {
  const navigate = useNavigate()
  const { platePreview, roastText, phase } = useRoastSession()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [selectedChef, setSelectedChef] = useState(0)

  const safeRoast =
    roastText ||
    'Placeholder roast: The stuffing looks like a beige asteroid field and that turkey slice needs CPR.'

  useEffect(() => {
    if (!platePreview) {
      navigate('/upload', { replace: true })
      return
    }

    if (phase === 'processing') {
      navigate('/loading', { replace: true })
      return
    }

    // Cycle through chef backgrounds
    const currentIndex = parseInt(localStorage.getItem(CHEF_INDEX_KEY) || '0', 10)
    const nextIndex = (currentIndex + 1) % CHEF_BACKGROUNDS.length
    localStorage.setItem(CHEF_INDEX_KEY, nextIndex.toString())
    setSelectedChef(nextIndex)
  }, [platePreview, phase, navigate])

  const handleSave = async () => {
    if (!containerRef.current || !platePreview) return

    try {
      // Create a canvas to capture the image (without buttons)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Set canvas size to match viewport
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      // Get the background image
      const bgImg = new Image()
      bgImg.crossOrigin = 'anonymous'
      bgImg.src = CHEF_BACKGROUNDS[selectedChef]

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

      // Draw logo at top
      try {
        const logoImg = new Image()
        logoImg.crossOrigin = 'anonymous'
        logoImg.src = '/assets/RMP-logo.svg'
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve
          logoImg.onerror = () => {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.src = '/assets/RMP-logo.svg'
            img.onload = resolve
            img.onerror = reject
          }
        })
        const logoSize = 300
        const logoX = canvas.width / 2 - logoSize / 2
        const logoY = 40
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
      } catch (err) {
        console.warn('Could not load logo:', err)
      }

      // Draw plate image
      const plateImg = new Image()
      plateImg.crossOrigin = 'anonymous'
      plateImg.src = platePreview
      await new Promise((resolve, reject) => {
        plateImg.onload = resolve
        plateImg.onerror = reject
      })

      const plateSize = Math.min(420, canvas.width * 0.7)
      const plateX = canvas.width / 2 - plateSize / 2
      const plateY = canvas.height * 0.4

      // Create circular clipping for plate
      ctx.save()
      ctx.beginPath()
      ctx.arc(plateX + plateSize / 2, plateY + plateSize / 2, plateSize / 2, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(plateImg, plateX, plateY, plateSize, plateSize)
      ctx.restore()

      // Draw roast text with word wrapping
      ctx.fillStyle = '#fff'
      ctx.font = '200 28px "PP Editorial New", serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      const textX = canvas.width / 2
      const textY = plateY + plateSize + 30
      const maxWidth = canvas.width - 80
      const lineHeight = 36
      const words = safeRoast.toUpperCase().split(' ')
      let line = ''
      let y = textY

      // Add text shadow effect
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 2

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' '
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line.trim(), textX, y)
          line = words[i] + ' '
          y += lineHeight
        } else {
          line = testLine
        }
      }
      if (line.trim()) {
        ctx.fillText(line.trim(), textX, y)
      }

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'roast-my-plate.jpg'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 'image/jpeg', 0.9)
    } catch (error) {
      console.error('Error creating save image:', error)
      alert('Unable to save image. Please try again.')
    }
  }

  const handleReplacePlate = () => {
    navigate('/upload')
  }

  const handleShareToStory = async () => {
    if (!containerRef.current || !platePreview) return

    try {
      // Create a canvas to capture the image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Set canvas size to match viewport
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      // Get the background image
      const bgImg = new Image()
      bgImg.crossOrigin = 'anonymous'
      bgImg.src = CHEF_BACKGROUNDS[selectedChef]

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

      // Draw logo at top
      try {
        const logoImg = new Image()
        logoImg.crossOrigin = 'anonymous'
        logoImg.src = '/assets/RMP-logo.svg'
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve
          logoImg.onerror = () => {
            // If SVG fails, try to load as image
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.src = '/assets/RMP-logo.svg'
            img.onload = resolve
            img.onerror = reject
          }
        })
        const logoSize = 300
        const logoX = canvas.width / 2 - logoSize / 2
        const logoY = 40
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
      } catch (err) {
        console.warn('Could not load logo:', err)
        // Continue without logo
      }

      // Draw plate image
      const plateImg = new Image()
      plateImg.crossOrigin = 'anonymous'
      plateImg.src = platePreview
      await new Promise((resolve, reject) => {
        plateImg.onload = resolve
        plateImg.onerror = reject
      })

      const plateSize = Math.min(420, canvas.width * 0.7)
      const plateX = canvas.width / 2 - plateSize / 2
      const plateY = canvas.height * 0.4 // Halfway down

      // Create circular clipping for plate
      ctx.save()
      ctx.beginPath()
      ctx.arc(plateX + plateSize / 2, plateY + plateSize / 2, plateSize / 2, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(plateImg, plateX, plateY, plateSize, plateSize)
      ctx.restore()

      // Draw roast text with word wrapping
      ctx.fillStyle = '#fff'
      ctx.font = '200 28px "PP Editorial New", serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      const textX = canvas.width / 2
      const textY = plateY + plateSize + 30
      const maxWidth = canvas.width - 80
      const lineHeight = 36
      const words = safeRoast.toUpperCase().split(' ')
      let line = ''
      let y = textY

      // Add text shadow effect
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 2

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' '
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line.trim(), textX, y)
          line = words[i] + ' '
          y += lineHeight
        } else {
          line = testLine
        }
      }
      if (line.trim()) {
        ctx.fillText(line.trim(), textX, y)
      }

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'roast-my-plate.jpg'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        // Try to open Instagram Stories
        // On iOS, try the deep link
        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
          // Try Instagram app deep link
          window.location.href = 'instagram://story-camera'
          // Fallback after a short delay
          setTimeout(() => {
            // If deep link didn't work, try opening Instagram web
            window.open('https://www.instagram.com/', '_blank')
          }, 1000)
        } else {
          // For Android or other platforms
          window.open('instagram://story-camera', '_blank')
          setTimeout(() => {
            window.open('https://www.instagram.com/', '_blank')
          }, 500)
        }
      }, 'image/jpeg', 0.9)
    } catch (error) {
      console.error('Error creating share image:', error)
      alert('Unable to create share image. Please try again.')
    }
  }

  if (!platePreview) {
    return null
  }

  return (
    <ScreenShell id="result" background="result" padded={false}>
      <div
        className="result-screen"
        style={{
          backgroundImage: `url(${CHEF_BACKGROUNDS[selectedChef]})`,
        }}
      >
        <div className="result-screen__scrim" />
        <div className="result-screen__content" ref={containerRef}>
          {/* Top left save button */}
          <button
            className="result-screen__save-button"
            onClick={handleSave}
            aria-label="Save image"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12v7H5v-7M12 3v12M7 8l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          {/* Top right reset button */}
          <button
            className="result-screen__replace-button"
            onClick={handleReplacePlate}
            aria-label="Reset"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 3v6m0 6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <img
            src="/assets/RMP-logo.svg"
            alt="Roast My Plate"
            className="result-screen__logo"
          />
          <div className="result-screen__plate">
            <img src={platePreview} alt="Roasted plate" />
          </div>
          <p className="result-screen__roast">{safeRoast.toUpperCase()}</p>
          <button
            className="result-screen__share-button"
            onClick={handleShareToStory}
          >
            SHARE TO STORY
          </button>
        </div>
      </div>
    </ScreenShell>
  )
}
