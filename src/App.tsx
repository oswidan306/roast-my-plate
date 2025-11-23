import { Navigate, Route, Routes } from 'react-router-dom'
import { SplashScreen } from './screens/SplashScreen'
import { UploadScreen } from './screens/UploadScreen'
import { LoadingScreen } from './screens/LoadingScreen'
import { ResultScreen } from './screens/ResultScreen'

function App() {
  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/upload" element={<UploadScreen />} />
      <Route path="/loading" element={<LoadingScreen />} />
      <Route path="/result" element={<ResultScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
