import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { EmptyState } from '../../components/ui/EmptyState'
import { useProperties } from '../../hooks/useProperties'
import { formatDate } from 'date-fns'
import { Building2 } from 'lucide-react'

export function PropertiesList() {
  const [search, setSearch] = useState('')
  const { data: properties, isLoading } = useProperties()
  const navigate = useNavigate()

  const filtered = properties?.filter(p =>
    p.address_line1.toLowerCase().includes(search.toLowerCase()) ||
    p.town.toLowerCase().includes(search.toLowerCase()) ||
    p.postcode.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Properties' }
      ]} />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-fraunces font-bold text-slate-900">
          Properties
        </h1>
        <Button onClick={() => navigate('/properties/add')}>
          <Plus size={20} className="mr-2" />
          Add Property
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search by address, city or postcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={18} className="text-slate-400" />}
        />
      </div>

      {/* Properties Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="text-slate-500">Loading properties...</div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Properties Yet"
          description="Create your first property to get started."
          action={{ label: 'Add Property', onClick: () => navigate('/properties/add') }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((property) => (
            <Card
              key={property.id}
              onClick={() => navigate(`/properties/${property.id}`)}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent className="pt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {property.address_line1}
                  </h3>
                  {property.address_line2 && (
                    <p className="text-sm text-slate-600">{property.address_line2}</p>
                  )}
                  <p className="text-sm text-slate-500">
                    {property.town}, {property.postcode}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <span className="text-xs font-medium text-slate-500 uppercase">
                    {property.property_type}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDate(new Date(property.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
