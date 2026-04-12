import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export default function Settings() {
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <h1 className="text-3xl font-fraunces font-bold text-slate-900 mb-8">
        Settings
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
