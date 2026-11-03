import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, CardBody } from '../components/ui/Card'
import { BrandLogo } from '../components/BrandLogo'
import { AuthFooter } from '../components/AuthFooter'
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

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
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
      <div className="brand-auth min-h-screen bg-brand-oat flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
      </div>
    )
  }

  if (!hasSession) {
    return (
      <div className="brand-auth min-h-screen bg-brand-oat flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <BrandLogo className="justify-center mb-8" />
          <Card className="!bg-brand-card !border-2 !border-brand-rose !shadow-none">
            <CardBody className="!p-8 text-center">
              <h2 className="text-xl font-manrope font-extrabold tracking-tight text-slate-900 mb-3">
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
        <AuthFooter />
      </div>
    )
  }

  return (
    <div className="brand-auth min-h-screen bg-brand-oat flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <BrandLogo className="justify-center mb-8" />

        <Card className="!bg-brand-card !border-2 !border-brand-rose !shadow-none">
          <CardBody className="!p-8">
            {success ? (
              <div className="text-center">
                <div className="w-14 h-14 bg-brand-roseLight rounded-full flex items-center justify-center mx-auto mb-5">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M8 14l4 4L20 10" stroke="#642E3D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 className="text-xl font-manrope font-extrabold tracking-tight text-slate-900 mb-2">
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
                <h2 className="text-xl font-manrope font-extrabold tracking-tight text-slate-900 mb-1">
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
      <AuthFooter />
    </div>
  )
}
