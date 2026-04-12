import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useTenancy } from '../../hooks/useTenancies'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { formatDate } from 'date-fns'

export function TenancyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: tenancy, isLoading } = useTenancy(id || '')

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  if (!tenancy) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Tenancy not found</p>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => navigate('/tenancies')}
        className="flex items-center text-teal-700 hover:text-teal-800 mb-4"
      >
        <ChevronLeft size={20} />
        Back to Tenancies
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-fraunces font-bold text-slate-900 mb-2">
          Tenancy Details
        </h1>
        <p className="text-slate-500">#{tenancy.id.slice(0, 8)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tenancy Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Status</p>
              <StatusBadge status={tenancy.status} />
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Start Date</p>
              <p className="font-medium text-slate-900">
                {formatDate(new Date(tenancy.start_date), 'MMMM d, yyyy')}
              </p>
            </div>
            {tenancy.end_date && (
              <div>
                <p className="text-sm text-slate-500 mb-1">End Date</p>
                <p className="font-medium text-slate-900">
                  {formatDate(new Date(tenancy.end_date), 'MMMM d, yyyy')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rent & Deposit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Monthly Rent</p>
              <p className="text-2xl font-bold text-slate-900">
                £{tenancy.monthly_rent}
              </p>
              <p className="text-xs text-slate-500">per month, due on day {tenancy.rent_due_day}</p>
            </div>
            {tenancy.deposit_amount && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Deposit Amount</p>
                <p className="font-medium text-slate-900">
                  £{tenancy.deposit_amount}
                </p>
              </div>
            )}
            {tenancy.deposit_scheme && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Deposit Scheme</p>
                <p className="font-medium text-slate-900">
                  {tenancy.deposit_scheme}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
