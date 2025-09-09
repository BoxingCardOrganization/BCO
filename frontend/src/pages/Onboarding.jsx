
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function Onboarding() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  
  const steps = [
    {
      title: "Welcome to BCO",
      content: (
        <div className="text-center">
          <div className="w-24 h-24 bg-bco-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-lg text-gray-600 mb-6">
            Boxing Card Organization lets you invest in fighters based on real attendance data. 
            Build your Fightfolio and participate in the Trading Ring community.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Key Features</h4>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• Fighter cards with attendance-based supply caps</li>
              <li>• Dynamic pricing based on demand</li>
              <li>• Fan tier system with scoring multipliers</li>
              <li>• Trading Ring for community discussion</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "How Supply Works",
      content: (
        <div>
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">The 50% Rule</h4>
              <p className="text-sm text-yellow-800">
                Each fighter's card supply is capped at 50% of their highest headlined attendance. 
                If Lightning Lopez headlined a 10,000-person event, only 5,000 cards can ever be minted.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Caps Can Only Increase</h4>
              <p className="text-sm text-green-800">
                When a fighter headlines a bigger event, their cap increases. But caps never decrease, 
                protecting existing cardholders from dilution.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Scarcity Creates Value</h4>
              <p className="text-sm text-blue-800">
                Once a cap is reached, no new cards can be minted. This creates natural scarcity 
                for fighters who may never headline larger events.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Building Your Fightfolio",
      content: (
        <div>
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="space-y-4">
            <div className="text-center mb-6">
              <p className="text-gray-600">
                Your Fightfolio value determines your fan tier and scoring power in the Trading Ring.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="w-6 h-6 bg-gray-200 rounded-full mx-auto mb-2"></div>
                <h5 className="font-medium text-gray-900">Casual</h5>
                <p className="text-xs text-gray-600">1.0x multiplier</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="w-6 h-6 bg-blue-200 rounded-full mx-auto mb-2"></div>
                <h5 className="font-medium text-blue-900">Analyst</h5>
                <p className="text-xs text-blue-600">1.2x multiplier</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="w-6 h-6 bg-purple-200 rounded-full mx-auto mb-2"></div>
                <h5 className="font-medium text-purple-900">Historian</h5>
                <p className="text-xs text-purple-600">1.5x multiplier</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="w-6 h-6 bg-orange-200 rounded-full mx-auto mb-2"></div>
                <h5 className="font-medium text-orange-900">Purist</h5>
                <p className="text-xs text-orange-600">2.0x multiplier</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Refund Policy:</strong> Cards can be refunded for their original mint price only. 
                Resale value represents demand signaling and may differ from mint price.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      navigate('/offer-builder')
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {steps.length}
            </span>
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
              Skip tour
            </Link>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-bco-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {steps[currentStep].title}
          </h1>
          
          <div className="mb-8">
            {steps[currentStep].content}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <button
              onClick={nextStep}
              className="btn-primary"
            >
              {currentStep === steps.length - 1 ? 'Build Your First Offer' : 'Next'}
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Ready to jump in?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/offer-builder" className="btn-primary">
              Start Building Offers
            </Link>
            <Link to="/trading-ring" className="btn-secondary">
              Join Trading Ring
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Onboarding
