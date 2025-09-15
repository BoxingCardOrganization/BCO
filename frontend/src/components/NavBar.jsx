
import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '@/assets/logo.png'
import FightfolioButton from './fightfolio/FightfolioButton'
import { useMe } from '@/hooks/useMe'

function NavBar() {
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { me } = useMe()

  const baseItems = [
    { path: '/', label: 'Home' },
    { path: '/offer-builder', label: 'Buy Cards' },
    { path: '/trading-ring', label: 'Trading Ring' },
    { path: '/preview', label: 'Preview' }
  ]
  const navItems = me ? [...baseItems, { path: '/fightfolio', label: 'Fightfolio' }] : baseItems

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src={logo} alt="BCO" className="h-14 md:h-16 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'text-bco-primary border-b-2 border-bco-primary pb-4'
                    : 'text-gray-600 hover:text-bco-primary'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Fightfolio Button */}
          <div className="hidden md:flex items-center space-x-4">
            <FightfolioButton />
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'text-bco-primary bg-bco-primary/10'
                      : 'text-gray-600 hover:text-bco-primary hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-4">
                <FightfolioButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default NavBar
