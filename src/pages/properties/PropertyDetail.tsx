import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { useProperty } from '../../hooks/useProperties'
import { useDocuments } from '../../hooks/useDocuments'

export function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: property, isLoading } = useProperty(id || '')
  const { data: documents } = useDocuments(id)

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Property not found</p>
      </div>
    )
  }

  const tabs = ['overview', 'units', 'documents', 'tenancies', 'maintenance']

  return (
    <div>
      <button
        onClick={() => navigate('/properties')}
        className="flex items-center text-teal-700 hover:text-teal-800 mb-4"
      >
        <ChevronLeft size={20} />
        Back to Properties
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-fraunces font-bold text-slate-900 mb-2">
          {property.address_line1}
        </h1>
        <p className="text-slate-500">
          {property.address_line2 && `${property.address_line2}, `}
          {property.town}, {property.postcode}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-2 font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'text-teal-700 border-teal-700'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">Address</p>
                <p className="font-medium text-slate-900">
                  {property.address_line1}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Type</p>
                <p className="font-medium text-slate-900 capitalize">
                  {property.property_type}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Town</p>
                <p className="font-medium text-slate-900">{property.town}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Postcode</p>
                <p className="font-medium text-slate-900">{property.postcode}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'documents' && (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {documents && documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-md"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{doc.file_name}</p>
                      <p className="text-xs text-slate-500">{doc.document_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No documents yet</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab !== 'overview' && activeTab !== 'documents' && (
        <Card>
          <CardContent className="py-16">
            <p className="text-center text-slate-500">
              This section is under development
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
