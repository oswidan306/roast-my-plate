import { useEffect, useRef, useState } from 'react'

interface CameraCaptureModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File, previewUrl: string) => void
  onChooseFile?: () => void
  guideSize?: number // Size of the circular guide in pixels
}

export function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  onChooseFile,
  guideSize = 280,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Use back camera on mobile
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        })

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setError(null)
      } catch (err) {
        console.error('Error accessing camera:', err)
        setError('Unable to access camera. Please use file upload instead.')
        // Fallback to file picker after a delay
        setTimeout(() => {
          onClose()
        }, 2000)
      }
    }

    startCamera()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [isOpen, onClose])

  const handleCapture = () => {
    if (!videoRef.current || isCapturing) return

    setIsCapturing(true)
    const video = videoRef.current

    // Get actual video dimensions
    const videoWidth = video.videoWidth
    const videoHeight = video.videoHeight

    // Get displayed video dimensions (video element with object-fit: cover)
    const videoRect = video.getBoundingClientRect()
    const displayWidth = videoRect.width
    const displayHeight = videoRect.height

    // Calculate how video is displayed (object-fit: cover behavior)
    const videoAspect = videoWidth / videoHeight
    const displayAspect = displayWidth / displayHeight

    let sourceWidth = videoWidth
    let sourceHeight = videoHeight
    let sourceX = 0
    let sourceY = 0

    // Calculate the actual displayed portion of the video
    if (videoAspect > displayAspect) {
      // Video is wider than display - crop sides
      sourceWidth = videoHeight * displayAspect
      sourceX = (videoWidth - sourceWidth) / 2
    } else {
      // Video is taller than display - crop top/bottom
      sourceHeight = videoWidth / displayAspect
      sourceY = (videoHeight - sourceHeight) / 2
    }

    // Calculate guide position in video coordinates
    // Guide is centered on screen, so center of displayed video area
    const guideRadiusPx = guideSize / 2
    const scaleX = sourceWidth / displayWidth
    const guideRadiusVideo = guideRadiusPx * scaleX

    // Center of the displayed video area in video coordinates
    const centerX = sourceX + sourceWidth / 2
    const centerY = sourceY + sourceHeight / 2

    // Create canvas for circular crop
    const cropSize = Math.round(guideRadiusVideo * 2)
    const cropCanvas = document.createElement('canvas')
    cropCanvas.width = cropSize
    cropCanvas.height = cropSize
    const cropCtx = cropCanvas.getContext('2d')

    if (!cropCtx) {
      setIsCapturing(false)
      return
    }

    // Create circular clipping path
    const cropRadius = cropSize / 2
    cropCtx.beginPath()
    cropCtx.arc(cropRadius, cropRadius, cropRadius, 0, Math.PI * 2)
    cropCtx.clip()

    // Draw the cropped area directly from video
    cropCtx.drawImage(
      video,
      centerX - guideRadiusVideo,
      centerY - guideRadiusVideo,
      guideRadiusVideo * 2,
      guideRadiusVideo * 2,
      0,
      0,
      cropSize,
      cropSize,
    )

    // Convert to blob and create file
    cropCanvas.toBlob(
      (blob) => {
        if (!blob) {
          setIsCapturing(false)
          return
        }

        const file = new File([blob], 'plate-photo.jpg', { type: 'image/jpeg' })
        const previewUrl = URL.createObjectURL(blob)

        // Stop camera
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }

        onCapture(file, previewUrl)
        onClose()
        setIsCapturing(false)
      },
      'image/jpeg',
      0.9,
    )
  }

  const handleChooseFile = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    onClose()
    // Trigger file picker if callback provided
    if (onChooseFile) {
      setTimeout(() => {
        onChooseFile()
      }, 100)
    }
  }

  if (!isOpen) return null

  return (
    <div className="camera-modal">
      <div className="camera-modal__overlay" onClick={onClose} />
      <div className="camera-modal__container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="camera-modal__video"
        />

        {/* Circular guide overlay */}
        <div className="camera-modal__guide">
          <div
            className="camera-modal__guide-circle"
            style={{
              width: `${guideSize}px`,
              height: `${guideSize}px`,
            }}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="camera-modal__error">
            <p>{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="camera-modal__controls">
          <button
            type="button"
            className="camera-modal__button camera-modal__button--secondary"
            onClick={handleChooseFile}
          >
            Choose File
          </button>
          <button
            type="button"
            className="camera-modal__button camera-modal__button--primary"
            onClick={handleCapture}
            disabled={!!error || isCapturing}
          >
            {isCapturing ? 'Capturing...' : 'Capture'}
          </button>
        </div>

        {/* Close button */}
        <button
          type="button"
          className="camera-modal__close"
          onClick={onClose}
          aria-label="Close camera"
        >
          ×
        </button>
      </div>
    </div>
  )
}

