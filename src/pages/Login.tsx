import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardBody } from '../components/ui/Card'
import { BrandLogo } from '../components/BrandLogo'
import { AuthFooter } from '../components/AuthFooter'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { login, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const inactivityLogout = searchParams.get('reason') === 'inactivity'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)

      // Prefetch landlord data so it's cached before ProtectedRoute mounts
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        queryClient.prefetchQuery({
          queryKey: ['landlord', user.id],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('landlords')
              .select('*')
              .eq('auth_user_id', user.id)
              .single()
            if (error) throw error
            return data
          },
        })
      }

      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email address above, then click Forgot password.')
      return
    }
    setError('')
    setResetLoading(true)
    try {
      await resetPassword(email)
      setResetSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="brand-auth min-h-screen bg-brand-oat flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <BrandLogo className="justify-center mb-8" />

        <Card className="!bg-brand-card !border-2 !border-brand-rose !shadow-none">
          <CardBody className="!p-8">
            <h2 className="text-xl font-manrope font-extrabold tracking-tight text-slate-900 mb-1">
              Welcome back
            </h2>
            <p className="text-slate-400 text-sm mb-7">Sign in to your landlord account</p>

            {inactivityLogout && (
              <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                You were signed out due to inactivity. Please sign in again.
              </div>
            )}

            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {resetSent && (
              <div className="mb-5 p-3.5 bg-brand-roseLight border border-brand-rose rounded-xl text-brand text-sm">
                Password reset email sent to <strong>{email}</strong>. Check your inbox and click the link to set a new password.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
              />
              <div>
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    className="text-sm text-brand hover:text-brand-dark font-medium disabled:opacity-50"
                  >
                    {resetLoading ? 'Sending...' : 'Forgot password?'}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                Sign In
              </Button>
            </form>

            <div className="mt-7 pt-6 border-t border-slate-100">
              <p className="text-slate-400 text-sm text-center">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="text-brand hover:text-brand-dark font-medium"
                >
                  Sign up
                </button>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
      <AuthFooter />
    </div>
  )
}
