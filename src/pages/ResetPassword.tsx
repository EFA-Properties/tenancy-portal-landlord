import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

/**
 * ResetPassword — handles two flows:
 *
 * 1. User arrives from the reset email link (Supabase sets the session via the
 *    hash fragment). They see a form to enter a new password.
 *
 * 2. If there's no session (someone navigates here directly), redirect to login.
 */
export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    // Supabase injects the recovery token into the URL hash.
    // The onAuthStateChange listener in AuthContext will pick it up
    // and create a session. We wait briefly for that to happen.
    const checkSession = async () => {
      // Give Supabase a moment to process the hash token
      await new Promise((r) => setTimeout(r, 500))

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        setHasSession(true)
      }
      setChecking(false)
    }
    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })
      if (updateError) throw updateError
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafb' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    )
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f8fafb' }}>
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2.5 justify-center mb-8">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 9l7-7 7 7M4 8v7c0 .5.5 1 1 1h8c.5 0 1-.5 1-1V8" />
              </svg>
            </div>
            <span className="text-xl font-fraunces font-semibold text-slate-900">
              TenancyPortal
            </span>
          </div>
          <Card>
            <CardBody className="!p-8 text-center">
              <h2 className="text-xl font-fraunces font-semibold text-slate-900 mb-3">
                Invalid or expired link
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                This password reset link has expired or is invalid. Please request a new one.
              </p>
              <Button onClick={() => navigate('/login')} className="w-full">
                Back to Sign In
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f8fafb' }}>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 9l7-7 7 7M4 8v7c0 .5.5 1 1 1h8c.5 0 1-.5 1-1V8" />
            </svg>
          </div>
          <span className="text-xl font-fraunces font-semibold text-slate-900">
            TenancyPortal
          </span>
        </div>

        <Card>
          <CardBody className="!p-8">
            {success ? (
              <div className="text-center">
                <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M8 14l4 4L20 10" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 className="text-xl font-fraunces font-semibold text-slate-900 mb-2">
                  Password updated
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                  Your password has been changed successfully.
                </p>
                <Button onClick={() => navigate('/dashboard')} className="w-full">
                  Continue to Dashboard
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-fraunces font-semibold text-slate-900 mb-1">
                  Set new password
                </h2>
                <p className="text-slate-400 text-sm mb-7">
                  Enter your new password below.
                </p>

                {error && (
                  <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <Input
                    label="New password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="At least 6 characters"
                  />
                  <Input
                    label="Confirm new password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Enter password again"
                  />
                  <Button type="submit" loading={loading} className="w-full" size="lg">
                    Update Password
                  </Button>
                </form>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
