import React from 'react'
import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import OfferBuilder from './pages/OfferBuilder'
import FighterPage from './pages/FighterPage'
import FighterProfile from './pages/FighterProfile'
import TradingRing from './pages/TradingRing'
// Wallet route replaced by FightfolioPage (alias kept)
import FightfolioPage from './pages/FightfolioPage'
import Onboarding from './pages/Onboarding'
import AdminValuations from './pages/AdminValuations'
import Preview from './pages/Preview'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/offer-builder" element={<OfferBuilder />} />
          <Route path="/buy" element={<OfferBuilder />} />
          <Route path="/fighter/:id" element={<FighterPage />} />
          <Route path="/fighters/:id" element={<FighterProfile />} />
          <Route path="/trading-ring" element={<TradingRing />} />
          <Route path="/fightfolio" element={<FightfolioPage />} />
          <Route path="/wallet" element={<FightfolioPage />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/admin/valuations" element={<AdminValuations />} />
          <Route path="/preview" element={<Preview />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
