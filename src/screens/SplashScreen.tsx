import { useNavigate } from 'react-router-dom'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenShell } from '../components/ScreenShell'

export function SplashScreen() {
  const navigate = useNavigate()

  return (
    <ScreenShell id="splash" background="splash" padded={false}>
      <video
        className="splash__video"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/assets/splash.mp4" type="video/mp4" />
      </video>
      <div className="splash__container">
        <PrimaryButton
          className="splash__cta"
          onClick={() => navigate('/upload')}
        >
          Start
        </PrimaryButton>
      </div>
    </ScreenShell>
  )
}

