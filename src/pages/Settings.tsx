import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useLandlord } from '../hooks/useLandlord'
import { supabase } from '../lib/supabase'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-teal-700">
      <path d="M3 8l3 3L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-slate-400">
      <path d="M4 7V5a4 4 0 018 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export default function Settings() {
  const { user } = useAuth()
  const { data: landlord } = useLandlord()
  const [saved, setSaved] = useState(false)

  const isPro = landlord?.comped || (landlord?.plan === 'pro' && landlord?.billing_active)
  const isComped = landlord?.comped

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const [upgrading, setUpgrading] = useState(false)

  const handleUpgrade = async () => {
    if (!landlord) return
    setUpgrading(true)
    try {
      const { data, error } = await supabase.functions.invoke('gocardless-create-billing-request', {
        body: {
          landlordId: landlord.id,
          email: landlord.email,
          fullName: landlord.full_name,
          successUrl: `${window.location.origin}/settings?upgraded=true`,
          exitUrl: `${window.location.origin}/settings`,
        },
      })
      if (error) throw error
      if (data?.authorisation_url) {
        window.location.href = data.authorisation_url
      } else {
        throw new Error('No authorisation URL returned')
      }
    } catch (err) {
      console.error('Upgrade error:', err)
      alert('Payment setup is not yet available. Contact hello@tenancy-portal.co.uk to upgrade.')
    } finally {
      setUpgrading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-fraunces font-bold text-slate-900 mb-8">
        Settings
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plan & Billing */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Plan & Billing
              </h2>
              <Badge variant={isPro ? 'default' : 'secondary'} size="sm">
                {isComped ? 'Pro (Comped)' : isPro ? 'Pro' : 'Free'}
              </Badge>
            </div>
          </CardHeader>
          <CardBody>
            {isPro ? (
              <div>
                <p className="text-textSecondary mb-4">
                  You're on the <span className="font-semibold text-teal-700">Pro plan</span>
                  {isComped ? ' (complimentary access)' : ` at £${landlord?.plan_price || '29.99'}/month`}.
                  Full access to all features.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    'Unlimited properties',
                    'Document upload & vault',
                    'Compliance alerts',
                    'Audit report download',
                    'Inventory management',
                    'HMO room management',
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-textSecondary">
                      <CheckIcon />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Free tier */}
                  <div className="rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-textPrimary">Free</h3>
                        <p className="text-2xl font-fraunces font-bold text-textPrimary mt-1">£0<span className="text-sm font-normal text-textMuted">/month</span></p>
                      </div>
                      <Badge variant="outline" size="sm">Current</Badge>
                    </div>
                    <div className="space-y-2">
                      {[
                        { text: '1 BTL property', included: true },
                        { text: 'View compliance checklist', included: true },
                        { text: 'Tenant portal access', included: true },
                        { text: 'Document upload', included: false },
                        { text: 'Compliance alerts', included: false },
                        { text: 'Audit reports', included: false },
                        { text: 'Inventory management', included: false },
                        { text: 'HMO support', included: false },
                      ].map((item) => (
                        <div key={item.text} className="flex items-center gap-2 text-sm">
                          {item.included ? <CheckIcon /> : <LockIcon />}
                          <span className={item.included ? 'text-textSecondary' : 'text-textMuted'}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pro tier */}
                  <div className="rounded-xl border-2 border-teal-700 p-6 relative">
                    <div className="absolute -top-3 left-6">
                      <span className="bg-teal-700 text-white text-xs font-mono uppercase tracking-wider px-3 py-1 rounded-pill">
                        Recommended
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-textPrimary">Pro</h3>
                        <p className="text-2xl font-fraunces font-bold text-teal-700 mt-1">£29.99<span className="text-sm font-normal text-textMuted">/month</span></p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-6">
                      {[
                        '2+ properties (BTL, HMO, Hybrid)',
                        'Document upload & vault',
                        'Compliance alerts & reminders',
                        'Audit report download',
                        'Inventory management',
                        'HMO room management',
                        'Full tenant portal',
                        'Priority support',
                      ].map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm text-textSecondary">
                          <CheckIcon />
                          {feature}
                        </div>
                      ))}
                    </div>
                    <Button className="w-full" onClick={handleUpgrade} loading={upgrading}>
                      Upgrade to Pro
                    </Button>
                    <p className="text-xs text-textMuted text-center mt-3">
                      Direct Debit via GoCardless · Cancel anytime
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Account Information
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email ?? ''}
                  disabled
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed"
                />
              </div>
              <p className="text-sm text-slate-600">
                Email address cannot be changed. Contact support if you need to
                update it.
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Security
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <Button variant="secondary" className="w-full">
                Change Password
              </Button>
              <p className="text-sm text-slate-600">
                Keep your account secure by using a strong, unique password.
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Preferences
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm text-slate-900">
                    Email notifications for maintenance updates
                  </span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm text-slate-900">
                    Email notifications for new documents
                  </span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm text-slate-900">
                    Email notifications for compliance alerts
                  </span>
                </label>
              </div>
              <Button onClick={handleSave}>
                {saved ? 'Saved!' : 'Save Preferences'}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
