import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLandlord } from '../hooks/useLandlord'
import { Card, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { PLANS } from '../lib/gocardless'

export default function Payment() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: landlord, isLoading } = useLandlord()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    )
  }

  // If already on free plan or billing is active, redirect
  if (landlord?.plan === 'free' || landlord?.billing_active) {
    navigate('/onboarding')
    return null
  }

  const handleSetupDirectDebit = async () => {
    setLoading(true)
    setError('')

    try {
      // TODO: Once GoCardless is set up, this will:
      // 1. Call Supabase Edge Function to create billing request flow
      // 2. Redirect to GoCardless hosted page
      // 3. GoCardless redirects back to /payment/success
      // 4. Webhook confirms mandate → billing_active = true

      // For now, simulate success and proceed to onboarding
      // Remove this block when GoCardless is live:
      alert('GoCardless integration pending. Proceeding to onboarding for testing.')
      navigate('/onboarding')

      /* Uncomment when GoCardless is configured:
      const { authorisation_url } = await createBillingRequestFlow({
        landlordId: landlord!.id,
        email: user!.email!,
        fullName: user!.user_metadata?.full_name || '',
        successUrl: `${window.location.origin}/payment/success`,
        exitUrl: `${window.location.origin}/payment`,
      })
      window.location.href = authorisation_url
      */
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set up payment')
    } finally {
      setLoading(false)
    }
  }

  const proPlan = PLANS.pro

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-teal-700 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5">
              <path d="M2 9l7-7 7 7M4 8v7c0 .5.5 1 1 1h8c.5 0 1-.5 1-1V8" />
            </svg>
          </div>
          <h1 className="text-3xl font-fraunces font-semibold text-slate-900 mb-2">
            Set Up Your Pro Plan
          </h1>
          <p className="text-slate-500">
            One simple monthly payment by Direct Debit.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Plan summary card */}
        <Card className="mb-6">
          <CardBody className="p-6">
            <div className="flex items-baseline justify-between mb-6">
              <div>
                <h2 className="text-xl font-fraunces font-semibold text-slate-900">
                  {proPlan.name} Plan
                </h2>
                <p className="text-sm text-slate-500 mt-1">{proPlan.description}</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-teal-700">£{proPlan.price}</span>
                <span className="text-sm text-slate-400">/mo</span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {proPlan.features.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0 mt-0.5">
                    <circle cx="9" cy="9" r="9" fill="#0f766e" />
                    <path d="M5.5 9l2 2L12.5 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-sm text-slate-700">{feature}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 mb-1">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-slate-400">
                  <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Payment via Direct Debit
                </span>
              </div>
              <p className="text-xs text-slate-400 ml-6">
                Powered by GoCardless. Secure. Cancel any time.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Action buttons */}
        <Button
          onClick={handleSetupDirectDebit}
          loading={loading}
          className="w-full mb-3"
        >
          Set Up Direct Debit — £{proPlan.price}/mo
        </Button>

        <button
          onClick={() => navigate('/onboarding')}
          className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors py-2"
        >
          Skip for now — I'll upgrade later
        </button>
      </div>
    </div>
  )
}
