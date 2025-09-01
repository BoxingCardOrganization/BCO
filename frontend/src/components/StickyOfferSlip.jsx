
import React, { useState } from 'react'
import { formatCurrency } from '../lib/format'

function StickyOfferSlip({ offers = [], onRemove, onConfirm, isVisible = true }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const totalAmount = offers.reduce((sum, offer) => sum + offer.amount, 0)
  const totalCards = offers.length

  if (!isVisible || totalCards === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Always visible */}
        <div 
          className="flex items-center justify-between py-4 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-4">
            <div className="w-3 h-3 bg-bco-primary rounded-full animate-pulse" />
            <div>
              <p className="font-medium text-gray-900">
                {totalCards} Card{totalCards !== 1 ? 's' : ''} Selected
              </p>
              <p className="text-sm text-gray-600">
                Total: {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="btn-primary">
              Confirm Offer
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <svg 
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="pb-4 border-t border-gray-100 pt-4">
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {offers.map((offer, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{offer.fighterName}</p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(offer.amount)} • {offer.quantity} card{offer.quantity !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button 
                    onClick={() => onRemove?.(index)}
                    className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Refund Disclaimer */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-800">Refund Policy</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Refunds only available for original mint price. Resale value may differ and represents demand signaling only.
                  </p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => onConfirm?.(offers)}
              className="w-full btn-primary text-center py-3"
            >
              Confirm Offer - {formatCurrency(totalAmount)}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default StickyOfferSlip
