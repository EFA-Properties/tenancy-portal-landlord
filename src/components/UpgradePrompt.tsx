import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardBody } from './ui/Card'
import { Button } from './ui/Button'

interface UpgradePromptProps {
  feature: string
  description?: string
}

export function UpgradePrompt({ feature, description }: UpgradePromptProps) {
  const navigate = useNavigate()

  return (
    <Card className="border-teal-200 bg-teal-50">
      <CardBody className="flex flex-col items-center text-center py-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100">
          <svg
            className="h-6 w-6 text-teal-700"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <h3 className="mb-2 text-lg font-fraunces font-semibold text-teal-900">
          {feature} is a Pro feature
        </h3>

        {description && (
          <p className="mb-6 text-sm text-teal-800">
            {description}
          </p>
        )}

        <Button
          variant="default"
          onClick={() => navigate('/settings')}
        >
          Upgrade to Pro — £29.99/mo
        </Button>
      </CardBody>
    </Card>
  )
}
