import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useLandlord } from '../hooks/useLandlord'
import { Card, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

/**
 * PaymentSuccess — shown after GoCardless redirects back.
 *
 * The mandate may not be active yet (GoCardless sends a webhook when it is).
 * We poll the landlord record to detect when billing_active flips to true,
 * but also let the user continue to onboarding regardless — the webhook will
 * activate billing in the background.
 */
export default function PaymentSuccess() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: landlord, refetch } = useLandlord()
  const [pollCount, setPollCount] = useState(0)
  const isActive = landlord?.billing_active || landlord?.comped

  // Poll for mandate activation (webhook may take a few seconds)
  useEffect(() => {
    if (isActive || pollCount >= 15) return

    const timer = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['landlord'] })
      refetch()
      setPollCount((c) => c + 1)
    }, 2000)

    return () => clearTimeout(timer)
  }, [isActive, pollCount, queryClient, refetch])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Success icon */}
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#0f766e" strokeWidth="2.5" />
            <path
              d="M10 16l4 4L22 12"
              stroke="#0f766e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-fraunces font-semibold text-slate-900 mb-3">
          Direct Debit Set Up
        </h1>

        {isActive ? (
          <p className="text-slate-500 mb-8">
            Your Pro subscription is active. Your 14-day free trial starts now —
            you won't be charged until it ends.
          </p>
        ) : (
          <div className="mb-8">
            <p className="text-slate-500 mb-3">
              Your Direct Debit mandate is being confirmed. This usually takes a
              few seconds.
            </p>
            {pollCount < 15 && (
              <div className="flex items-center justify-center gap-2 text-sm text-teal-700">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600" />
                Confirming mandate...
              </div>
            )}
            {pollCount >= 15 && (
              <Card className="mt-4">
                <CardBody className="p-4">
                  <p className="text-sm text-slate-600">
                    Your mandate is still being processed by your bank. This can
                    take up to 3 working days for Bacs Direct Debits. You can
                    continue setting up your account — your Pro features will
                    activate automatically once confirmed.
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        )}

        <Button onClick={() => navigate('/onboarding')} className="w-full mb-3">
          {isActive ? 'Continue to Setup' : 'Continue to Setup'}
        </Button>

        <p className="text-xs text-slate-400 mt-4">
          Your first payment of £{landlord?.plan_price?.toFixed(2) || '29.99'} will be collected 14 days from today.
          Cancel any time from Settings.
        </p>
      </div>
    </div>
  )
}
