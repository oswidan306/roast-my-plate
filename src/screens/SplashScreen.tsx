import { useNavigate } from 'react-router-dom'
import { ScreenShell } from '../components/ScreenShell'

export function SplashScreen() {
  const navigate = useNavigate()

  return (
    <ScreenShell id="splash" background="splash" padded={false}>
      <div className="splash__container">
        <div className="splash__title">
          <span className="splash__title-word splash__title-word--roast">ROAST</span>
          <span className="splash__title-word splash__title-word--my">MY</span>
          <span className="splash__title-word splash__title-word--plate">PLATE</span>
        </div>
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

