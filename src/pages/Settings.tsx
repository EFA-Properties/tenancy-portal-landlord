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
      <h1 className="text-3xl font-instrument font-bold text-abode-text mb-8">
        Settings
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-abode-text">
              Account Information
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-abode-text mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email ?? ''}
                  disabled
                  className="w-full px-4 py-2 rounded-lg border border-abode-border bg-abode-bg3 text-abode-text2 cursor-not-allowed"
                />
              </div>
              <p className="text-sm text-abode-text2">
                Email address cannot be changed. Contact support if you need to
                update it.
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-abode-text">
              Security
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <Button variant="secondary" className="w-full">
                Change Password
              </Button>
              <p className="text-sm text-abode-text2">
                Keep your account secure by using a strong, unique password.
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold text-abode-text">
              Preferences
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm text-abode-text">
                    Email notifications for maintenance updates
                  </span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm text-abode-text">
                    Email notifications for new documents
                  </span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm text-abode-text">
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
