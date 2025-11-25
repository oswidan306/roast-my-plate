import type { ChangeEvent } from 'react'
import { useRef, useState } from 'react'
import clsx from 'clsx'
import { CameraCaptureModal } from './CameraCaptureModal'

interface CirclePlateUploadProps {
  preview?: string | null
  onFileSelect: (file: File, previewUrl: string) => void
  onCameraStateChange?: (isOpen: boolean) => void
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif']

export function CirclePlateUpload({
  preview,
  onFileSelect,
  onCameraStateChange,
}: CirclePlateUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [showCamera, setShowCamera] = useState(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('Please upload a JPG, PNG, or HEIC image.')
      return
    }

    const url = URL.createObjectURL(file)
    onFileSelect(file, url)
  }

  const handleSurfaceClick = () => {
    // Check if camera is available
    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    ) {
      setShowCamera(true)
      onCameraStateChange?.(true)
    } else {
      // Fallback to file picker if camera API not available
      inputRef.current?.click()
    }
  }

  const handleCameraCapture = (file: File, previewUrl: string) => {
    onFileSelect(file, previewUrl)
  }

  const handleCameraClose = () => {
    setShowCamera(false)
    onCameraStateChange?.(false)
  }

  const handleChooseFile = () => {
    inputRef.current?.click()
  }

  return (
    <div className="plate-upload">
      <button
        type="button"
        className={clsx('plate-upload__surface', preview && 'plate-upload__surface--filled')}
        onClick={handleSurfaceClick}
      >
        {preview ? (
          <div className="plate-upload__preview">
            <img
              src={preview}
              alt="Selected plate"
              className="plate-upload__image"
            />
          </div>
        ) : (
          <div className="plate-upload__empty">
            <svg
              className="plate-upload__camera-icon"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="plate-upload__prompt">upload your plate</span>
          </div>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="plate-upload__input"
        onChange={handleChange}
      />
      <CameraCaptureModal
        isOpen={showCamera}
        onClose={handleCameraClose}
        onCapture={handleCameraCapture}
        onChooseFile={handleChooseFile}
        guideSize={420}
      />
    </div>
  )
}

