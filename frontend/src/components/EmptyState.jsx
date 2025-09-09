
import React from 'react'
import { Link } from 'react-router-dom'

function EmptyState({ 
  title, 
  description, 
  actionText, 
  actionLink, 
  onAction,
  icon 
}) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        {icon || (
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-sm mx-auto">{description}</p>
      
      {(actionText && (actionLink || onAction)) && (
        <div>
          {actionLink ? (
            <Link to={actionLink} className="btn-primary">
              {actionText}
            </Link>
          ) : (
            <button onClick={onAction} className="btn-primary">
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default EmptyState
