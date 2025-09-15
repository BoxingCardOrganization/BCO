import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthModal from '@/components/auth/AuthModal'

export default function SignIn() {
  const nav = useNavigate()
  const loc = useLocation()
  const [open, setOpen] = useState(true)

  const from = loc.state?.from?.pathname || '/'

  useEffect(() => {
    setOpen(true)
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Sign in</h1>
      <p className="text-sm text-gray-600 mb-6">Log in to access your Fightfolio.</p>
      <button className="btn-primary" onClick={()=>setOpen(true)}>Open sign-in</button>
      <AuthModal
        open={open}
        onClose={() => { setOpen(false); nav('/') }}
        onAuthed={() => { setOpen(false); nav(from, { replace: true }) }}
      />
    </div>
  )
}

