import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Card, CardBody } from '../components/ui/Card'

type PortfolioType = 'btl' | 'hmo' | 'hybrid'
type PropertyCountRange = '1' | '2-10' | '11-25' | '25+'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [portfolioType, setPortfolioType] = useState<PortfolioType | ''>('')
  const [propertyCount, setPropertyCount] = useState<PropertyCountRange | ''>('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Determine plan based on portfolio type and property count
  const determinedPlan = useMemo((): 'free' | 'pro' => {
    if (portfolioType === 'btl' && propertyCount === '1') {
      return 'free'
    }
    return 'pro'
  }, [portfolioType, propertyCount])

  const planPrice = determinedPlan === 'free' ? 0 : 29.99
  const planDescription = determinedPlan === 'free'
    ? 'Free forever. Perfect for single BTL properties.'
    : 'Pro plan at £29.99/mo. Includes all features.'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!fullName.trim()) {
      setError('Full name is required')
      return
    }

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (!password) {
      setError('Password is required')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!portfolioType) {
      setError('Portfolio type is required')
      return
    }

    if (!propertyCount) {
      setError('Number of properties is required')
      return
    }

    setLoading(true)

    try {
      // Register with auth
      await register(email, password, fullName)

      // Get the newly created user
      const { data: { user: newUser } } = await supabase.auth.getUser()
      if (!newUser) {
        throw new Error('Failed to get user after registration')
      }

      // Create landlord record with plan routing
      const { error: insertError } = await supabase.from('landlords').insert({
        auth_user_id: newUser.id,
        full_name: fullName,
        email: email,
        phone: phone || null,
        portfolio_type: portfolioType,
        property_count_range: propertyCount,
        plan: determinedPlan,
        plan_price: planPrice,
        billing_active: determinedPlan === 'free',
        onboarding_completed: false,
      })

      if (insertError) {
        throw insertError
      }

      // Route based on plan
      if (determinedPlan === 'free') {
        navigate('/onboarding')
      } else {
        // Pro tier - for now navigate to onboarding with a note
        // TODO: integrate GoCardless payment flow
        navigate('/onboarding')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form Column */}
        <div>
          <Card>
            <CardBody className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-teal-700 rounded-md flex items-center justify-center shrink-0">
                  <svg width="22" height="22" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5">
                    <path d="M2 9l7-7 7 7M4 8v7c0 .5.5 1 1 1h8c.5 0 1-.5 1-1V8" />
                  </svg>
                </div>
                <h1 className="text-2xl font-fraunces font-semibold text-textPrimary">
                  Create Account
                </h1>
              </div>
              <p className="text-textSecondary text-sm mb-8">
                Sign up to manage your rental properties
              </p>

              {error && (
                <div className="mb-6 p-4 bg-errorLight border border-error/30 rounded-lg text-error text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <Input
                  label="Full Name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="John Doe"
                />

                {/* Email */}
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                />

                {/* Password */}
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />

                {/* Confirm Password */}
                <Input
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />

                {/* Portfolio Type */}
                <Select
                  label="Portfolio Type"
                  value={portfolioType}
                  onChange={(e) => setPortfolioType(e.target.value as PortfolioType)}
                  required
                  options={[
                    { value: 'btl', label: 'Buy-to-Let (BTL)' },
                    { value: 'hmo', label: 'House in Multiple Occupation (HMO)' },
                    { value: 'hybrid', label: 'Hybrid (Mix of BTL and HMO)' },
                  ]}
                />

                {/* Number of Properties */}
                <Select
                  label="Number of Properties"
                  value={propertyCount}
                  onChange={(e) => setPropertyCount(e.target.value as PropertyCountRange)}
                  required
                  options={[
                    { value: '1', label: '1' },
                    { value: '2-10', label: '2-10' },
                    { value: '11-25', label: '11-25' },
                    { value: '25+', label: '25+' },
                  ]}
                />

                {/* Phone (Optional) */}
                <Input
                  label="Phone Number (Optional)"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+44 123 456 7890"
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                >
                  Create Account
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-textSecondary text-sm text-center">
                  Already have an account?{' '}
                  <button
                    onClick={() => navigate('/login')}
                    className="text-teal-700 hover:text-teal-600 font-medium transition-colors"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Benefits Panel */}
        <div className="flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-xl font-fraunces font-semibold text-textPrimary mb-2">
              Your Plan
            </h2>
            <div className="inline-block rounded-pill bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700 border border-teal-200">
              {determinedPlan === 'free' ? 'Free' : 'Pro'} — {planDescription}
            </div>
          </div>

          <Card className="border-teal-200 bg-teal-50">
            <CardBody className="p-8">
              <h3 className="text-lg font-fraunces font-semibold text-textPrimary mb-6">
                What you get:
              </h3>

              <ul className="space-y-4">
                <li className="flex gap-3">
                  <svg className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-textSecondary text-sm">Manage all your rental properties</span>
                </li>

                <li className="flex gap-3">
                  <svg className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-textSecondary text-sm">Track tenancies and lease dates</span>
                </li>

                <li className="flex gap-3">
                  <svg className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-textSecondary text-sm">Invite tenants to the portal</span>
                </li>

                {determinedPlan === 'pro' && (
                  <>
                    <li className="flex gap-3">
                      <svg className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-textSecondary text-sm">Upload & share documents</span>
                    </li>

                    <li className="flex gap-3">
                      <svg className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-textSecondary text-sm">Maintenance request tracking</span>
                    </li>

                    <li className="flex gap-3">
                      <svg className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-textSecondary text-sm">Compliance alerts & reminders</span>
                    </li>
                  </>
                )}
              </ul>

              {determinedPlan === 'free' && (
                <div className="mt-8 pt-6 border-t border-teal-200">
                  <p className="text-sm text-textSecondary mb-3">
                    Want more features? Upgrade to Pro anytime for just <span className="font-semibold text-textPrimary">£29.99/month</span>
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
