import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLandlord } from '../hooks/useLandlord'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const { data: landlord, isLoading: landlordLoading } = useLandlord()

  // Only block on auth loading — this is fast (checks existing session)
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Redirect to onboarding if landlord exists but hasn't completed it
  // Don't redirect if already on the onboarding page, and don't block while loading
  if (!landlordLoading && landlord && !landlord.onboarding_completed && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  // Render children immediately — don't wait for landlord data
  // Individual pages can show their own loading states via useLandlord()
  return <>{children}</>
}
