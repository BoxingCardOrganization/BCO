
import React from 'react'

function Loading({ text = 'Loading...', className = '' }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-bco-primary mb-4"></div>
        <p className="text-gray-600">{text}</p>
      </div>
    </div>
  )
}

export default Loading
