import { useNavigate } from 'react-router-dom'
import { useRoastSession } from '../context/RoastSessionContext'
import { ScreenShell } from '../components/ScreenShell'
import { CirclePlateUpload } from '../components/CirclePlateUpload'
import { PrimaryButton } from '../components/PrimaryButton'

export function UploadScreen() {
  const navigate = useNavigate()
  const { platePreview, selectPlate, startProcessing } = useRoastSession()

  const handleRoast = () => {
    startProcessing()
    navigate('/loading')
  }

  return (
    <ScreenShell id="upload" background="upload" padded={false}>
      <div className="upload-screen">
        <p className="upload-screen__header-text">
          Alright...
          <br />
          let's see that
          <br />
          disaster
        </p>
        <div className="upload-screen__plate">
          <CirclePlateUpload
            preview={platePreview}
            onFileSelect={(file, preview) => selectPlate(file, preview)}
          />
        </div>

        <PrimaryButton
          className="upload-screen__cta"
          onClick={handleRoast}
          disabled={!platePreview}
        >
          roast it
        </PrimaryButton>
      </div>
    </ScreenShell>
  )
}

