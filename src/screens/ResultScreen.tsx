import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenShell } from '../components/ScreenShell'
import { useRoastSession } from '../context/RoastSessionContext'
import { RoastCard } from '../components/RoastCard'
import { PrimaryButton } from '../components/PrimaryButton'
import { useShareRoast } from '../hooks/useShareRoast'

export function ResultScreen() {
  const navigate = useNavigate()
  const { platePreview, roastText, resetSession, phase } = useRoastSession()
  const shareRoast = useShareRoast()
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null)

  const safeRoast =
    roastText ||
    'Placeholder roast: The stuffing looks like a beige asteroid field and that turkey slice needs CPR.'

  const handleShare = async () => {
    setFallbackMessage(null)
    const shared = await shareRoast({
      roastText: safeRoast,
      onFallback: () =>
        setFallbackMessage('Roast copied. Paste it anywhere to share the shame.'),
    })

    if (!shared && !fallbackMessage) {
      setFallbackMessage('Unable to share automatically. Copy the text manually.')
    }
  }

  const handleAnother = () => {
    resetSession()
    navigate('/upload')
  }

  useEffect(() => {
    if (!platePreview) {
      navigate('/upload', { replace: true })
    }
  }, [platePreview, navigate])

  useEffect(() => {
    if (phase === 'processing') {
      navigate('/loading', { replace: true })
    }
  }, [phase, navigate])

  if (!platePreview) {
    return null
  }

  return (
    <ScreenShell id='result'>
      <div className="result-screen">
        <div className="result-screen__plate">
          <img src={platePreview} alt="Roasted plate" />
        </div>
        <RoastCard heading="Your plate angered the chef">
          {safeRoast}
        </RoastCard>
        {fallbackMessage && (
          <p className="result-screen__status">{fallbackMessage}</p>
        )}
        <div className="result-screen__actions">
          <PrimaryButton onClick={handleShare}>Share</PrimaryButton>
          <PrimaryButton variant="ghost" onClick={handleAnother}>
            Roast another plate
          </PrimaryButton>
        </div>
      </div>
    </ScreenShell>
  )
}

