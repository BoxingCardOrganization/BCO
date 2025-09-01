
import React from 'react'
import { Link } from 'react-router-dom'

function PromoStrip({ type = 'info', message, actionText, actionLink, onClose }) {
  const typeStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  }

  return (
    <div className={`border-l-4 p-4 ${typeStyles[type]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <p className="text-sm font-medium">{message}</p>
          {actionText && actionLink && (
            <Link 
              to={actionLink}
              className="ml-4 text-sm underline hover:no-underline"
            >
              {actionText}
            </Link>
          )}
        </div>
        
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 hover:bg-black/10 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default PromoStrip
