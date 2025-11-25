import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoastSession } from '../context/RoastSessionContext'
import { ScreenShell } from '../components/ScreenShell'
import { CirclePlateUpload } from '../components/CirclePlateUpload'

export function UploadScreen() {
  const navigate = useNavigate()
  const { platePreview, selectPlate, startProcessing } = useRoastSession()
  const [isAnimating, setIsAnimating] = useState(false)

  const handleRoast = () => {
    setIsAnimating(true)
    // Wait for animation to complete before navigating
    setTimeout(() => {
      startProcessing()
      navigate('/loading')
    }, 500) // Match animation duration
  }

  return (
    <ScreenShell id="upload" background="upload" padded={false}>
      <div className="upload-screen">
        <div className={`upload-screen__header ${isAnimating ? 'upload-screen__header--slide-up' : ''}`}>
          <p className="upload-screen__header-text">
            <span className="upload-screen__header-word--submit">SUBMIT</span>{' '}
            <span className="upload-screen__header-word--dish">DISH</span>
          </p>
          <p className="upload-screen__subheader-text">FOR THE CHEF'S REVIEW</p>
        </div>
        <div className="upload-screen__plate">
          <CirclePlateUpload
            preview={platePreview}
            onFileSelect={(file, preview) => selectPlate(file, preview)}
          />
        </div>
        {platePreview && (
          <div className={`upload-screen__footer ${isAnimating ? 'upload-screen__footer--slide-down' : ''}`}>
            <button
              className="upload-screen__roast-button"
              onClick={handleRoast}
            >
              ROAST
            </button>
          </div>
        )}
      </div>
    </ScreenShell>
  )
}

