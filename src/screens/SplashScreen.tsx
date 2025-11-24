import { useNavigate } from 'react-router-dom'
import { ScreenShell } from '../components/ScreenShell'

export function SplashScreen() {
  const navigate = useNavigate()

  return (
    <ScreenShell id="splash" background="splash" padded={false}>
      <div className="splash__container">
        <button
          className="splash__begin-button"
          onClick={() => navigate('/upload')}
        >
          BEGIN
        </button>
      </div>
    </ScreenShell>
  )
}

