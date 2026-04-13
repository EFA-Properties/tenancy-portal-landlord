import React from 'react'
import { Link } from 'react-router-dom'
import { useProperties } from '../../hooks/useProperties'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table'
import { epcRatingColor } from '../../lib/utils'

export default function PropertiesList() {
  const { data: properties = [], isLoading } = useProperties()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-fraunces font-bold text-slate-900">
          Properties
        </h1>
        <Link to="/properties/new">
          <Button>Add Property</Button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="No properties yet"
              description="Add your first property to get started."
              action={{ label: 'Add Property', onClick: () => window.location.href = '/properties/new' }}
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Address</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>EPC Rating</TableHeader>
                <TableHeader>HMO</TableHeader>
                <TableHeader>Action</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property.id} className="cursor-pointer hover:bg-slate-50">
                  <TableCell className="font-medium">
                    <Link to={`/properties/${property.id}`} className="hover:underline">
                      {property.address_line1}{property.town ? `, ${property.town}` : ''}
                    </Link>
                    {property.postcode && (
                      <span className="text-slate-400 text-xs ml-2">{property.postcode}</span>
                    )}
                  </TableCell>
                  <TableCell className="capitalize">{property.property_type?.replace('_', ' ') || '—'}</TableCell>
                  <TableCell>
                    {property.epc_rating ? (
                      <Badge className={epcRatingColor(property.epc_rating)}>
                        {property.epc_rating}
                      </Badge>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </TableCell>
                  <TableCell>{property.is_hmo ? 'HMO' : '—'}</TableCell>
                  <TableCell>
                    <Link to={`/properties/${property.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
