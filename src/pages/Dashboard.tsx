import React from 'react'
import { Link } from 'react-router-dom'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { Card, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats()

  const statCards = [
    { label: 'Active Tenancies', value: stats?.activeTenancies ?? 0 },
    { label: 'Total Tenancies', value: stats?.totalTenancies ?? 0 },
    { label: 'Pending Requests', value: stats?.pendingRequests ?? 0 },
    { label: 'Overdue Alerts', value: stats?.overdueAlerts ?? 0 },
  ]

  return (
    <div>
      <h1 className="text-3xl font-fraunces font-semibold text-slate-900 mb-8">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardBody>
              <p className="text-slate-400 text-xs font-mono uppercase tracking-[0.5px] mb-2">
                {stat.label}
              </p>
              <p className="text-4xl font-bold text-slate-900">
                {isLoading ? '-' : stat.value}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link to="/properties/new">
                <Button variant="outline" className="w-full justify-start">
                  Add Property
                </Button>
              </Link>
              <Link to="/tenancies/new">
                <Button variant="outline" className="w-full justify-start">
                  Add Tenancy
                </Button>
              </Link>
              <Link to="/tenants/invite">
                <Button variant="outline" className="w-full justify-start">
                  Invite Tenant
                </Button>
              </Link>
              <Link to="/documents/upload">
                <Button variant="outline" className="w-full justify-start">
                  Upload Document
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>

        <Card className="md:col-span-2">
          <CardBody>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Getting Started
            </h3>
            <p className="text-slate-600 mb-4">
              Welcome to the Landlord Portal. Here you can manage your properties, tenants,
              view documents, review maintenance requests, and more.
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• View and manage your active tenancies</li>
              <li>• Access important documents and agreements</li>
              <li>• Report and track maintenance requests</li>
              <li>• Stay updated with compliance alerts</li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
