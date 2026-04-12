import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardBody } from '../components/ui/Card'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardBody className="p-8">
          <div className="flex items-center gap-2 mb-4">
            {/* Logo - blue square with house icon */}
            <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center shrink-0">
              <svg width="22" height="22" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5">
                <path d="M2 9l7-7 7 7M4 8v7c0 .5.5 1 1 1h8c.5 0 1-.5 1-1V8" />
              </svg>
            </div>
            <h1 className="text-2xl font-fraunces font-semibold text-slate-900">
              Landlord Portal
            </h1>
          </div>
          <p className="text-slate-600 mb-8">Sign in to your account</p>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-600 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
            <Button
              type="submit"
              loading={loading}
              className="w-full"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-slate-600 text-sm text-center">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-blue-600 hover:text-slate-900 font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
