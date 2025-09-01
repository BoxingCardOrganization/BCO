import React from 'react'
import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import OfferBuilder from './pages/OfferBuilder'
import FighterPage from './pages/FighterPage'
import TradingRing from './pages/TradingRing'
import Wallet from './pages/Wallet'
import Onboarding from './pages/Onboarding'
import AdminValuations from './pages/AdminValuations'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/offer-builder" element={<OfferBuilder />} />
          <Route path="/fighter/:id" element={<FighterPage />} />
          <Route path="/trading-ring" element={<TradingRing />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/admin/valuations" element={<AdminValuations />} />
        </Routes>
      </main>
    </div>
  )
}

export default App