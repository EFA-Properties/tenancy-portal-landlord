import React, { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Card, CardBody } from '../components/ui/Card'

type PortfolioType = 'btl' | 'hmo' | 'hybrid'
type PropertyCountRange = '1' | '2-10' | '11-25' | '25+'

interface PromoCode {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed' | 'free_forever'
  discount_value: number
  duration_months: number | null
  max_uses: number | null
  times_used: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

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

  // Promo code state
  const [promoInput, setPromoInput] = useState('')
  const [promoCode, setPromoCode] = useState<PromoCode | null>(null)
  const [promoError, setPromoError] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)

  // Everyone is on the Pro plan — 14-day free trial, then £29.99/mo via DD
  const determinedPlan = 'pro' as const

  const BASE_PRICE = 29.99

  // Calculate discounted price
  const { finalPrice, savingsText } = useMemo(() => {
    if (!promoCode) {
      return { finalPrice: BASE_PRICE, savingsText: '' }
    }

    if (promoCode.discount_type === 'free_forever') {
      return { finalPrice: 0, savingsText: 'FREE forever' }
    }

    if (promoCode.discount_type === 'percentage') {
      const discounted = BASE_PRICE * (1 - promoCode.discount_value / 100)
      const rounded = Math.round(discounted * 100) / 100
      return { finalPrice: rounded, savingsText: `${promoCode.discount_value}% off` }
    }

    if (promoCode.discount_type === 'fixed') {
      const discounted = Math.max(0, BASE_PRICE - promoCode.discount_value)
      const rounded = Math.round(discounted * 100) / 100
      return { finalPrice: rounded, savingsText: `£${promoCode.discount_value} off` }
    }

    return { finalPrice: BASE_PRICE, savingsText: '' }
  }, [promoCode])

  const planDescription = promoCode
    ? promoCode.discount_type === 'free_forever'
      ? `Pro plan — FREE with code ${promoCode.code}`
      : `Pro plan at £${finalPrice.toFixed(2)}/mo (${savingsText} with ${promoCode.code})`
    : '14-day free trial, then £29.99/mo via Direct Debit.'

  // Validate promo code against the database
  const handleApplyPromo = useCallback(async () => {
    const code = promoInput.trim().toUpperCase()
    if (!code) return

    setPromoError('')
    setPromoLoading(true)

    try {
      const { data, error: fetchError } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single()

      if (fetchError || !data) {
        setPromoError('Invalid promo code')
        setPromoCode(null)
        setPromoLoading(false)
        return
      }

      const promo = data as PromoCode

      // Check expiry
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        setPromoError('This promo code has expired')
        setPromoCode(null)
        setPromoLoading(false)
        return
      }

      // Check max uses
      if (promo.max_uses !== null && promo.times_used >= promo.max_uses) {
        setPromoError('This promo code has reached its usage limit')
        setPromoCode(null)
        setPromoLoading(false)
        return
      }

      setPromoCode(promo)
      setPromoError('')
    } catch {
      setPromoError('Failed to validate promo code')
      setPromoCode(null)
    } finally {
      setPromoLoading(false)
    }
  }, [promoInput])

  const handleRemovePromo = () => {
    setPromoCode(null)
    setPromoInput('')
    setPromoError('')
  }

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

      // Determine if this is a free_forever promo (gets comped Pro)
      const isFreeForever = promoCode?.discount_type === 'free_forever'

      // Build landlord record
      const landlordRecord: Record<string, unknown> = {
        auth_user_id: newUser.id,
        full_name: fullName,
        email: email,
        phone: phone || null,
        portfolio_type: portfolioType,
        property_count_range: propertyCount,
        plan: isFreeForever ? 'pro' : determinedPlan,
        plan_price: finalPrice,
        billing_active: isFreeForever,
        comped: isFreeForever,
        trial_ends_at: isFreeForever ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        onboarding_completed: false,
      }

      // Attach promo code details if applied
      if (promoCode) {
        landlordRecord.promo_code_id = promoCode.id
        landlordRecord.promo_applied_at = new Date().toISOString()
        if (promoCode.expires_at) {
          landlordRecord.promo_expires_at = promoCode.expires_at
        }
      }

      const { error: insertError } = await supabase
        .from('landlords')
        .insert(landlordRecord)

      if (insertError) {
        throw insertError
      }

      // Increment promo code usage
      if (promoCode) {
        await supabase
          .from('promo_codes')
          .update({ times_used: promoCode.times_used + 1 })
          .eq('id', promoCode.id)
      }

      // Route: free_forever promos skip payment, everyone else sets up DD
      if (isFreeForever) {
        navigate('/onboarding')
      } else {
        // Go to payment page for GoCardless DD setup (trial starts immediately)
        navigate('/payment')
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

                {/* Promo Code */}
                {determinedPlan === 'pro' && (
                  <div>
                    <label className="block text-sm font-medium text-textSecondary mb-1.5">
                      Promo Code (Optional)
                    </label>
                    {promoCode ? (
                      <div className="flex items-center gap-2 rounded-lg border border-teal-300 bg-teal-50 px-4 py-3">
                        <svg className="h-5 w-5 text-teal-700 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-teal-800 flex-1">
                          {promoCode.code} applied — {savingsText}
                        </span>
                        <button
                          type="button"
                          onClick={handleRemovePromo}
                          className="text-sm text-teal-600 hover:text-teal-800 font-medium transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => {
                            setPromoInput(e.target.value.toUpperCase())
                            setPromoError('')
                          }}
                          placeholder="Enter code"
                          className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-textPrimary placeholder:text-textTertiary focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleApplyPromo()
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleApplyPromo}
                          disabled={promoLoading || !promoInput.trim()}
                          className="px-5 py-2.5 rounded-lg bg-gray-100 text-sm font-medium text-textPrimary hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-border"
                        >
                          {promoLoading ? 'Checking...' : 'Apply'}
                        </button>
                      </div>
                    )}
                    {promoError && (
                      <p className="mt-1.5 text-sm text-error">{promoError}</p>
                    )}
                  </div>
                )}

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
              Pro — {planDescription}
            </div>
            {promoCode && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-textSecondary line-through">£{BASE_PRICE.toFixed(2)}/mo</span>
                <span className="text-lg font-semibold text-teal-700">
                  {finalPrice === 0 ? 'FREE' : `£${finalPrice.toFixed(2)}/mo`}
                </span>
                <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-800">
                  {savingsText}
                </span>
              </div>
            )}
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
              </ul>

            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
