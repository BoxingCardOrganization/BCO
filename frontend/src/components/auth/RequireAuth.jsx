import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useMe } from '@/hooks/useMe'

export default function RequireAuth({ children }) {
  const { me, loading } = useMe()
  const loc = useLocation()
  if (loading) return null
  if (!me) return <Navigate to="/signin" state={{ from: loc }} replace />
  return children
}

