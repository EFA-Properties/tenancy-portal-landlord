import React from 'react'
import { useLandlord } from '../hooks/useLandlord'
import { UpgradePrompt } from './UpgradePrompt'

interface FeatureGateProps {
  feature: string
  description?: string
  children: React.ReactNode
}

export function FeatureGate({ feature, description, children }: FeatureGateProps) {
  const { data: landlord, isLoading, error } = useLandlord()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-r-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Error loading plan information
      </div>
    )
  }

  // Comped accounts get full Pro access regardless of billing status
  const isPro = landlord?.comped || (landlord?.plan === 'pro' && landlord?.billing_active)

  if (!isPro) {
    return <UpgradePrompt feature={feature} description={description} />
  }

  return <>{children}</>
}
