import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import UploadPage from './pages/UploadPage'
import ReportPage from './pages/ReportPage'
import AnomalyPage from './pages/AnomalyPage'
import RiskPage from './pages/RiskPage'
import PredictPage from './pages/PredictPage'
import ExplainPage from './pages/ExplainPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-background text-on-surface">
        <div className="scanline" />
        <Sidebar />
        <main className="ml-[200px] flex-1 min-h-screen">
          <Routes>
            <Route path="/" element={<Navigate to="/upload" replace />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/anomalies" element={<AnomalyPage />} />
            <Route path="/risk" element={<RiskPage />} />
            <Route path="/prediction" element={<PredictPage />} />
            <Route path="/explanation" element={<ExplainPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
