import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTenancy } from '../../hooks/useTenancies'
import { useAgreement } from '../../hooks/useAgreements'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import {
  type AgreementFormData,
  generateAgreementClauses,
} from '../../lib/agreementTemplate'
import { downloadAgreementPdf } from '../../lib/generateAgreementPdf'

const statusVariant: Record<string, 'secondary' | 'warning' | 'success' | 'outline'> = {
  draft: 'secondary',
  sent: 'warning',
  viewed: 'outline',
  signed: 'success',
  countersigned: 'success',
}

const statusLabel: Record<string, string> = {
  draft: 'Draft',
  sent: 'Awaiting Tenant Signature',
  viewed: 'Viewed by Tenant',
  signed: 'Tenant Signed — Awaiting Countersignature',
  countersigned: 'Fully Executed',
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AgreementView() {
  const { tenancyId, agreementId } = useParams<{ tenancyId: string; agreementId: string }>()
  const navigate = useNavigate()
  const { data: tenancy } = useTenancy(tenancyId)
  const { data: agreement, isLoading } = useAgreement(agreementId)

  const property = (tenancy as any)?.properties

  // Try to parse structured data from content
  let formData: AgreementFormData | null = null
  let clauses: ReturnType<typeof generateAgreementClauses> = []
  let isStructured = false

  if (agreement?.content) {
    try {
      const parsed = JSON.parse(agreement.content)
      if (parsed.landlordName && parsed.tenantName) {
        formData = parsed as AgreementFormData
        clauses = generateAgreementClauses(formData)
        isStructured = true
      }
    } catch {
      // Legacy plain-text agreement
    }
  }

  const handleDownloadPdf = () => {
    if (!formData) return
    downloadAgreementPdf(
      formData,
      agreement?.landlord_signature_data
        ? {
            data: agreement.landlord_signature_data,
            type: agreement.landlord_signature_type || 'typed',
            date: agreement.landlord_signed_at || new Date().toISOString(),
          }
        : undefined,
      agreement?.tenant_signature_data
        ? {
            data: agreement.tenant_signature_data,
            type: agreement.tenant_signature_type || 'typed',
            date: agreement.tenant_signed_at || new Date().toISOString(),
          }
        : undefined,
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
      </div>
    )
  }

  if (!agreement) {
    return (
      <Card>
        <CardBody className="p-8 text-center">
          <p className="text-sm text-slate-500">Agreement not found.</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Tenancies', href: '/tenancies' },
          {
            label: property ? property.address_line1 : 'Tenancy',
            href: `/tenancies/${tenancyId}`,
          },
          { label: 'Agreements', href: `/tenancies/${tenancyId}/agreements` },
          { label: agreement.title },
        ]}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-fraunces font-semibold text-slate-900">
              {agreement.title}
            </h1>
            <Badge size="sm" variant={statusVariant[agreement.status] || 'secondary'}>
              {statusLabel[agreement.status] || agreement.status}
            </Badge>
          </div>
          <p className="text-sm text-slate-400">Created {formatDate(agreement.created_at)}</p>
        </div>
        <div className="flex gap-2">
          {isStructured && (
            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
              Download PDF
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/tenancies/${tenancyId}/agreements`)}
          >
            Back
          </Button>
        </div>
      </div>

      {/* Signature Status */}
      <Card className="mb-5">
        <CardBody className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Landlord Signature */}
            <div className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  agreement.landlord_signed_at ? 'bg-green-100' : 'bg-slate-100'
                }`}
              >
                {agreement.landlord_signed_at ? (
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-slate-400"
                    fill="none"
                    viewBox="0 0 20 20"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="10" cy="10" r="7" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Landlord Signature</p>
                {agreement.landlord_signed_at ? (
                  <>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Signed {formatDate(agreement.landlord_signed_at)}
                    </p>
                    {agreement.landlord_signature_type === 'typed' &&
                      agreement.landlord_signature_data && (
                        <p
                          className="text-lg text-slate-800 mt-1"
                          style={{
                            fontFamily: "'Georgia', serif",
                            fontStyle: 'italic',
                          }}
                        >
                          {agreement.landlord_signature_data}
                        </p>
                      )}
                    {agreement.landlord_signature_type === 'drawn' &&
                      agreement.landlord_signature_data?.startsWith('data:image') && (
                        <img
                          src={agreement.landlord_signature_data}
                          alt="Landlord signature"
                          className="h-12 mt-1"
                        />
                      )}
                  </>
                ) : (
                  <p className="text-xs text-slate-400 mt-0.5">Not yet signed</p>
                )}
              </div>
            </div>

            {/* Tenant Signature */}
            <div className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  agreement.tenant_signed_at ? 'bg-green-100' : 'bg-slate-100'
                }`}
              >
                {agreement.tenant_signed_at ? (
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-slate-400"
                    fill="none"
                    viewBox="0 0 20 20"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="10" cy="10" r="7" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Tenant Signature</p>
                {agreement.tenant_signed_at ? (
                  <>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Signed {formatDate(agreement.tenant_signed_at)}
                    </p>
                    {agreement.tenant_signature_type === 'typed' &&
                      agreement.tenant_signature_data && (
                        <p
                          className="text-lg text-slate-800 mt-1"
                          style={{
                            fontFamily: "'Georgia', serif",
                            fontStyle: 'italic',
                          }}
                        >
                          {agreement.tenant_signature_data}
                        </p>
                      )}
                  </>
                ) : (
                  <p className="text-xs text-amber-600 mt-0.5">Awaiting tenant signature</p>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Agreement Content */}
      {isStructured && formData ? (
        <>
          {/* Structured view */}
          <Card className="mb-4">
            <CardHeader className="bg-gradient-to-r from-teal-700 to-teal-600 text-white border-0">
              <h2 className="font-fraunces text-lg font-semibold">Written Statement of Terms</h2>
              <p className="text-sm text-teal-100 mt-1">
                Assured Tenancy — Housing Act 1988 (as amended by the Renters' Rights Act 2025)
              </p>
            </CardHeader>
            <CardBody className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-1">
                    Landlord
                  </p>
                  <p className="font-medium text-slate-900">{formData.landlordName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-1">
                    Tenant
                  </p>
                  <p className="font-medium text-slate-900">{formData.tenantName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-1">
                    Monthly Rent
                  </p>
                  <p className="font-medium text-slate-900">
                    £{formData.monthlyRent.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-1">
                    Deposit
                  </p>
                  <p className="font-medium text-slate-900">
                    £{formData.depositAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="space-y-3 mb-6">
            {clauses.map((clause) => (
              <Card key={clause.number}>
                <CardBody className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-teal-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{clause.number}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 pt-1">{clause.title}</h3>
                  </div>
                  {clause.text && (
                    <p className="text-sm text-slate-600 mb-3 ml-10">{clause.text}</p>
                  )}
                  {clause.subclauses && (
                    <div className="space-y-2 ml-10">
                      {clause.subclauses.map((sub, idx) => (
                        <div key={idx} className="flex gap-3">
                          <span className="text-xs font-mono text-teal-600 flex-shrink-0 pt-0.5">
                            {clause.number}.{idx + 1}
                          </span>
                          <p className="text-sm text-slate-700 leading-relaxed">{sub}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      ) : (
        /* Legacy plain-text view */
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900">Agreement Content</h2>
          </CardHeader>
          <CardBody className="p-6">
            <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">
              {agreement.content}
            </pre>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
