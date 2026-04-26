import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTenancy } from '../../hooks/useTenancies'
import { useCreateAgreement, useSignAgreementAsLandlord } from '../../hooks/useAgreements'
import { Breadcrumb } from '../../components/Breadcrumb'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

type SignatureMode = 'draw' | 'type'

export default function CreateAgreement() {
  const { tenancyId } = useParams<{ tenancyId: string }>()
  const [searchParams] = useSearchParams()
  const docType = (searchParams.get('type') || 'tenancy_agreement') as 'tenancy_agreement' | 'inventory'
  const navigate = useNavigate()
  const { data: tenancy } = useTenancy(tenancyId)
  const createAgreement = useCreateAgreement()
  const signAsLandlord = useSignAgreementAsLandlord()

  // Form state
  const [title, setTitle] = useState(
    docType === 'inventory' ? 'Inventory & Schedule of Condition' : 'Assured Shorthold Tenancy Agreement'
  )
  const [content, setContent] = useState('')
  const [step, setStep] = useState<'edit' | 'sign' | 'done'>('edit')
  const [agreementId, setAgreementId] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Signature state
  const [signMode, setSignMode] = useState<SignatureMode>('draw')
  const [typedSignature, setTypedSignature] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // Set default content based on type
  useEffect(() => {
    if (tenancy && !content) {
      const property = (tenancy as any).properties
      const tenant = (tenancy as any).tenants

      if (docType === 'tenancy_agreement') {
        setContent(
`ASSURED SHORTHOLD TENANCY AGREEMENT

This agreement is made between:

LANDLORD: [Your name]
TENANT: ${tenant?.full_name || '[Tenant name]'}

PROPERTY: ${property ? `${property.address_line1}, ${property.town}, ${property.postcode}` : '[Property address]'}

TERM: From ${tenancy.start_date || '[Start date]'}${tenancy.end_date ? ` to ${tenancy.end_date}` : ' on a periodic basis'}

RENT: £${tenancy.monthly_rent?.toFixed(2) || '[Amount]'} per calendar month, payable in advance on the first day of each month.

DEPOSIT: [Amount] held with [Deposit scheme name], reference [Reference].

TERMS AND CONDITIONS:

1. The Tenant agrees to pay the rent on time and keep the Property in good condition.
2. The Tenant shall not cause nuisance or annoyance to neighbours.
3. The Tenant shall not make alterations to the Property without written consent.
4. The Landlord shall maintain the structure, exterior, and installations for heating and hot water.
5. The Landlord shall provide at least 24 hours' notice before visiting the Property.
6. Either party may end this agreement by giving at least two months' written notice.

This agreement is governed by the laws of England and Wales.`
        )
      } else {
        setContent(
`INVENTORY & SCHEDULE OF CONDITION

Property: ${property ? `${property.address_line1}, ${property.town}, ${property.postcode}` : '[Property address]'}
Tenant: ${tenant?.full_name || '[Tenant name]'}
Date: ${new Date().toLocaleDateString('en-GB')}

ENTRANCE / HALLWAY:
- Walls:
- Flooring:
- Lighting:
- Notes:

LIVING ROOM:
- Walls:
- Flooring:
- Curtains/Blinds:
- Furniture:
- Notes:

KITCHEN:
- Walls:
- Flooring:
- Worktops:
- Appliances:
- Notes:

BEDROOM 1:
- Walls:
- Flooring:
- Furniture:
- Notes:

BATHROOM:
- Walls:
- Flooring:
- Fixtures:
- Notes:

GARDEN / EXTERIOR:
- Condition:
- Notes:

METER READINGS:
- Electric:
- Gas:
- Water:

KEYS PROVIDED:
- Front door:
- Back door:
- Other:

Both parties agree that this inventory accurately represents the condition of the property and its contents at the start of the tenancy.`
        )
      }
    }
  }, [tenancy, docType, content])

  // Canvas drawing
  const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    }
  }, [])

  const startDraw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    isDrawing.current = true
    lastPos.current = getCanvasPos(e)
  }, [getCanvasPos])

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing.current || !lastPos.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    const pos = getCanvasPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = pos
  }, [getCanvasPos])

  const endDraw = useCallback(() => {
    isDrawing.current = false
    lastPos.current = null
  }, [])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [])

  const getSignatureData = useCallback((): string | null => {
    if (signMode === 'type') {
      return typedSignature.trim() || null
    }
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    // Check if canvas is empty
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const hasContent = imageData.data.some((val, i) => i % 4 === 3 && val > 0)
    return hasContent ? canvas.toDataURL('image/png') : null
  }, [signMode, typedSignature])

  // Step 1: Save the agreement as draft
  const handleSaveDraft = async () => {
    if (!tenancyId || !title.trim() || !content.trim()) {
      setError('Please fill in the title and content.')
      return
    }
    setError('')
    try {
      const agreement = await createAgreement.mutateAsync({
        tenancyId,
        type: docType,
        title: title.trim(),
        content: content.trim(),
      })
      setAgreementId(agreement.id)
      setStep('sign')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save agreement')
    }
  }

  // Step 2: Sign and send
  const handleSignAndSend = async () => {
    if (!agreementId) return
    const sigData = getSignatureData()
    if (!sigData) {
      setError(signMode === 'draw' ? 'Please draw your signature.' : 'Please type your name.')
      return
    }
    setError('')
    try {
      await signAsLandlord.mutateAsync({
        agreementId,
        signatureData: sigData,
        signatureType: signMode === 'draw' ? 'drawn' : 'typed',
      })
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign agreement')
    }
  }

  const property = (tenancy as any)?.properties
  const tenant = (tenancy as any)?.tenants

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Tenancies', href: '/tenancies' },
          { label: property ? `${property.address_line1}` : 'Tenancy', href: `/tenancies/${tenancyId}` },
          { label: docType === 'inventory' ? 'Create Inventory' : 'Create Agreement' },
        ]}
      />

      <h1 className="text-2xl font-fraunces font-semibold text-slate-900 mb-6">
        {docType === 'inventory' ? 'Create Inventory' : 'Create Tenancy Agreement'}
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {step === 'edit' && (
        <div className="space-y-6">
          <Card>
            <CardBody className="p-6 space-y-5">
              <Input
                label="Document Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Assured Shorthold Tenancy Agreement"
              />

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  Document Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={24}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent resize-y"
                  placeholder="Enter the agreement terms..."
                />
                <p className="mt-1 text-xs text-slate-400">
                  Edit the template above with your specific terms. This will be sent to the tenant for signing.
                </p>
              </div>
            </CardBody>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => navigate(`/tenancies/${tenancyId}`)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveDraft}
              loading={createAgreement.isPending}
            >
              Continue to Sign
            </Button>
          </div>
        </div>
      )}

      {step === 'sign' && (
        <div className="space-y-6">
          {/* Preview */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                Document Preview
              </h2>
            </CardHeader>
            <CardBody className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">{title}</h3>
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed max-h-[300px] overflow-y-auto">
                {content}
              </pre>
            </CardBody>
          </Card>

          {/* Signature */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                Your Signature (Landlord)
              </h2>
            </CardHeader>
            <CardBody className="p-6">
              {/* Mode toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setSignMode('draw')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    signMode === 'draw'
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Draw Signature
                </button>
                <button
                  type="button"
                  onClick={() => setSignMode('type')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    signMode === 'type'
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Type Name
                </button>
              </div>

              {signMode === 'draw' ? (
                <div>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg bg-white relative">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={180}
                      className="w-full cursor-crosshair touch-none"
                      style={{ height: '180px' }}
                      onMouseDown={startDraw}
                      onMouseMove={draw}
                      onMouseUp={endDraw}
                      onMouseLeave={endDraw}
                      onTouchStart={startDraw}
                      onTouchMove={draw}
                      onTouchEnd={endDraw}
                    />
                    <div className="absolute bottom-2 left-3 right-3 border-t border-slate-200" />
                    <p className="absolute bottom-1 left-3 text-[10px] text-slate-400">
                      Sign above the line
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="mt-2 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="Type your full name"
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
                    style={{ fontFamily: "'Dancing Script', cursive, serif", fontSize: '24px' }}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Your typed name will appear as your electronic signature
                  </p>
                </div>
              )}

              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">
                  By signing, you confirm that you are the landlord or an authorised agent and that the above document is accurate.
                  Your signature will be timestamped and recorded with your IP address for legal verification.
                </p>
              </div>
            </CardBody>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep('edit')}>
              Back to Edit
            </Button>
            <Button
              onClick={handleSignAndSend}
              loading={signAsLandlord.isPending}
            >
              Sign & Send to Tenant
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <Card>
          <CardBody className="p-8 text-center">
            <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-7 w-7 text-teal-700" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-fraunces font-semibold text-slate-900 mb-2">
              Agreement Signed & Sent
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              The {docType === 'inventory' ? 'inventory' : 'tenancy agreement'} has been signed by you and sent to{' '}
              <span className="font-medium text-slate-700">{tenant?.full_name || 'the tenant'}</span> for their signature.
              You'll be notified when they sign.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => navigate(`/tenancies/${tenancyId}`)}>
                Back to Tenancy
              </Button>
              <Button onClick={() => navigate('/tenancies')}>
                View All Tenancies
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
