/**
 * Assured Tenancy Agreement Template
 * Compliant with the Renters' Rights Act 2025 (effective 1 May 2026)
 *
 * Key legal changes reflected:
 * - All new tenancies are Assured Periodic Tenancies (no fixed term ASTs)
 * - Section 21 abolished — landlord must use Section 8 grounds only
 * - Tenant gives minimum 2 months' notice at any time
 * - Deposit capped at 5 weeks' rent, protected within 30 days
 * - Written Statement of Terms must be provided before tenancy begins
 * - Implied right to request a pet (landlord must respond within 28 days)
 * - Decent Homes Standard applies to PRS
 * - Landlord must be registered with the PRS Ombudsman
 */

export interface AgreementFormData {
  // Parties
  landlordName: string
  landlordAddress: string
  tenantName: string
  tenantEmail: string

  // Property
  propertyAddress: string
  propertyPostcode: string
  propertyType: string

  // Terms
  startDate: string
  monthlyRent: number
  rentDueDay: number
  paymentMethod: string

  // Deposit
  depositAmount: number
  depositScheme: 'DPS' | 'MyDeposits' | 'TDS'
  depositReference: string

  // Property details
  furnishing: 'unfurnished' | 'part_furnished' | 'furnished'
  permittedOccupants: number
  parkingIncluded: boolean
  gardenMaintenance: 'tenant' | 'landlord'
  petsConsidered: boolean

  // Utilities
  councilTaxResponsibility: 'tenant' | 'landlord'
  utilitiesResponsibility: 'tenant' | 'landlord'
}

export function getDefaultFormData(
  landlordName: string,
  landlordAddress: string,
  tenantName: string,
  tenantEmail: string,
  propertyAddress: string,
  propertyPostcode: string,
  propertyType: string,
  startDate: string,
  monthlyRent: number,
): AgreementFormData {
  // Deposit capped at 5 weeks' rent under the Tenant Fees Act 2019
  const fiveWeeksRent = Math.round((monthlyRent * 12 / 52) * 5 * 100) / 100

  return {
    landlordName,
    landlordAddress: landlordAddress || '',
    tenantName,
    tenantEmail,
    propertyAddress,
    propertyPostcode,
    propertyType: propertyType || 'Residential dwelling',
    startDate,
    monthlyRent,
    rentDueDay: 1,
    paymentMethod: 'Bank transfer',
    depositAmount: fiveWeeksRent,
    depositScheme: 'DPS',
    depositReference: '',
    furnishing: 'unfurnished',
    permittedOccupants: 2,
    parkingIncluded: false,
    gardenMaintenance: 'tenant',
    petsConsidered: true,
    councilTaxResponsibility: 'tenant',
    utilitiesResponsibility: 'tenant',
  }
}

export const DEPOSIT_SCHEMES = [
  { value: 'DPS', label: 'Deposit Protection Service (DPS)' },
  { value: 'MyDeposits', label: 'MyDeposits' },
  { value: 'TDS', label: 'Tenancy Deposit Scheme (TDS)' },
]

export const FURNISHING_OPTIONS = [
  { value: 'unfurnished', label: 'Unfurnished' },
  { value: 'part_furnished', label: 'Part-furnished' },
  { value: 'furnished', label: 'Furnished' },
]

function ordinal(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`
  switch (day % 10) {
    case 1: return `${day}st`
    case 2: return `${day}nd`
    case 3: return `${day}rd`
    default: return `${day}th`
  }
}

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export interface AgreementClause {
  number: string
  title: string
  text: string
  subclauses?: string[]
}

export function generateAgreementClauses(data: AgreementFormData): AgreementClause[] {
  const clauses: AgreementClause[] = []

  // 1. Definitions and Interpretation
  clauses.push({
    number: '1',
    title: 'Definitions and Interpretation',
    text: 'In this Agreement, the following definitions apply:',
    subclauses: [
      `"the Landlord" means ${data.landlordName} of ${data.landlordAddress || '[address to be confirmed]'}.`,
      `"the Tenant" means ${data.tenantName}.`,
      `"the Property" means ${data.propertyAddress}, ${data.propertyPostcode}, including all fixtures, fittings and contents as listed in any accompanying Inventory and Schedule of Condition.`,
      '"the Tenancy" means the assured tenancy created by this Agreement, which is a periodic tenancy running from month to month.',
      '"the Act" means the Housing Act 1988 as amended by the Renters\' Rights Act 2025.',
      '"the Rent" means the sum specified in clause 3.',
      '"the Deposit" means the sum specified in clause 4.',
    ],
  })

  // 2. Grant of Tenancy
  clauses.push({
    number: '2',
    title: 'Grant of Tenancy',
    text: '',
    subclauses: [
      `The Landlord lets the Property to the Tenant as an assured tenancy within the meaning of the Housing Act 1988 (as amended). This is a periodic tenancy and does not have a fixed term end date.`,
      `The Tenancy commences on ${formatDateLong(data.startDate)} and continues on a monthly periodic basis until lawfully terminated in accordance with this Agreement and the Act.`,
      `The maximum number of permitted occupants is ${data.permittedOccupants}. The Tenant must not allow more than this number to reside at the Property without the Landlord's prior written consent.`,
      `The Property is let as ${data.furnishing === 'unfurnished' ? 'an unfurnished' : data.furnishing === 'part_furnished' ? 'a part-furnished' : 'a furnished'} ${data.propertyType.toLowerCase()}.`,
    ],
  })

  // 3. Rent
  clauses.push({
    number: '3',
    title: 'Rent',
    text: '',
    subclauses: [
      `The Rent is £${data.monthlyRent.toLocaleString('en-GB', { minimumFractionDigits: 2 })} per calendar month, payable in advance on or before the ${ordinal(data.rentDueDay)} day of each month.`,
      `Payment shall be made by ${data.paymentMethod.toLowerCase()} to the account details provided separately by the Landlord.`,
      'The Landlord may increase the Rent by serving a notice under section 13 of the Housing Act 1988, giving at least two months\' written notice. A rent increase may not take effect within the first 12 months of the Tenancy, and no more than once in any subsequent 12-month period.',
      'If any Rent payment is more than 14 days overdue, the Tenant may be liable for reasonable costs incurred by the Landlord in recovering the arrears, in accordance with the Tenant Fees Act 2019.',
    ],
  })

  // 4. Deposit
  clauses.push({
    number: '4',
    title: 'Deposit',
    text: '',
    subclauses: [
      `The Tenant shall pay a deposit of £${data.depositAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })} ("the Deposit") prior to the commencement of the Tenancy. This does not exceed five weeks' rent as required by the Tenant Fees Act 2019.`,
      `The Deposit will be protected by the ${data.depositScheme === 'DPS' ? 'Deposit Protection Service (DPS)' : data.depositScheme === 'MyDeposits' ? 'MyDeposits' : 'Tenancy Deposit Scheme (TDS)'}${data.depositReference ? ` under reference ${data.depositReference}` : ''}. The Landlord will protect the Deposit within 30 days of receiving it and provide the Tenant with the prescribed information within the same period.`,
      'The Deposit is held as security for the performance of the Tenant\'s obligations under this Agreement and to cover any damage to the Property beyond fair wear and tear, any unpaid rent or other charges, and the reasonable costs of cleaning where the Property is not returned in the condition recorded in the Inventory.',
      'At the end of the Tenancy, the Deposit (or the balance after any agreed deductions) will be returned to the Tenant within 10 days of both parties agreeing the deductions, or in accordance with the rules of the relevant deposit protection scheme.',
    ],
  })

  // 5. Tenant's Obligations
  clauses.push({
    number: '5',
    title: 'Tenant\'s Obligations',
    text: 'The Tenant agrees:',
    subclauses: [
      'To pay the Rent on time and in full on the due date each month.',
      'To keep the interior of the Property in a clean and reasonable condition, and not to cause or permit any damage beyond fair wear and tear.',
      'Not to make any structural or significant alterations or additions to the Property without the prior written consent of the Landlord.',
      'Not to cause or permit any nuisance, annoyance, or disturbance to neighbours or other occupiers in the vicinity.',
      'Not to use the Property for any illegal, immoral, or commercial purpose. The Property is let for residential use only.',
      'Not to assign, sublet, or part with possession of the Property or any part of it without the Landlord\'s prior written consent.',
      'To allow the Landlord or the Landlord\'s agents access to the Property for inspection, repair, or maintenance upon receiving at least 24 hours\' written notice, at reasonable times of day.',
      'To promptly report to the Landlord any disrepair, damage, or defect in the Property or its fixtures and fittings.',
      'To comply with all obligations imposed on a tenant under the Environmental Protection Act 1990 and any other relevant legislation.',
      'To test smoke alarms and carbon monoxide detectors regularly and inform the Landlord immediately if any are not functioning.',
      'To return all keys to the Property at the end of the Tenancy. If any keys are lost, the Tenant will bear the reasonable cost of replacement.',
      `${data.gardenMaintenance === 'tenant' ? 'To maintain any garden or outside areas in a neat and tidy condition, keeping lawns mowed and borders weeded.' : 'The Landlord will arrange maintenance of the garden and outside areas.'}`,
      `${data.councilTaxResponsibility === 'tenant' ? 'To pay Council Tax and register with the local authority for Council Tax purposes.' : 'Council Tax is included and payable by the Landlord.'}`,
      `${data.utilitiesResponsibility === 'tenant' ? 'To pay all charges for gas, electricity, water, sewerage, telephone, internet, and any other services supplied to the Property, and to register with the relevant utility suppliers.' : 'Utility charges are included and payable by the Landlord.'}`,
      'To notify the Landlord in writing of any intended absence from the Property exceeding 14 consecutive days and to take reasonable security measures during any such absence.',
    ],
  })

  // 6. Landlord's Obligations
  clauses.push({
    number: '6',
    title: 'Landlord\'s Obligations',
    text: 'The Landlord agrees:',
    subclauses: [
      'To allow the Tenant quiet enjoyment of the Property without interference, provided the Tenant complies with the terms of this Agreement.',
      'To keep in repair the structure and exterior of the Property, including drains, gutters, and external pipes, in accordance with section 11 of the Landlord and Tenant Act 1985.',
      'To keep in repair and proper working order the installations in the Property for the supply of water, gas, electricity, sanitation, and for space heating and heating water.',
      'To ensure the Property meets the Decent Homes Standard as required by the Renters\' Rights Act 2025 and associated regulations.',
      'To ensure that a valid Energy Performance Certificate (EPC) with a minimum rating of E is available for the Property, and to comply with the Minimum Energy Efficiency Standards (MEES) Regulations.',
      'To ensure the Property has working smoke alarms on each storey and a carbon monoxide alarm in any room with a fixed combustion appliance, in compliance with the Smoke and Carbon Monoxide Alarm (Amendment) Regulations 2022.',
      'To ensure a valid Gas Safety Certificate (CP12) is obtained annually by a Gas Safe registered engineer (where applicable) and to provide a copy to the Tenant within 28 days of each check.',
      'To ensure that the electrical installation is inspected by a qualified person at least every five years and to provide a copy of the Electrical Installation Condition Report (EICR) to the Tenant before the start of the Tenancy.',
      'To protect the Deposit in an authorised tenancy deposit protection scheme within 30 days and provide the prescribed information to the Tenant.',
      'To give at least 24 hours\' written notice before visiting the Property, except in the case of a genuine emergency.',
      'To be registered with the Private Rented Sector Ombudsman as required by the Renters\' Rights Act 2025 and to comply with any orders made by the Ombudsman.',
      'To provide the Tenant with the Government\'s "How to Rent" guide before the Tenancy begins or at the start of the Tenancy.',
      'To carry out repairs notified by the Tenant within a reasonable timeframe, having regard to the nature and urgency of the repair.',
    ],
  })

  // 7. Ending the Tenancy
  clauses.push({
    number: '7',
    title: 'Ending the Tenancy',
    text: '',
    subclauses: [
      'The Tenant may end this Tenancy by giving the Landlord at least two months\' written notice, expiring at the end of a period of the Tenancy. Notice may be given at any time.',
      'The Landlord may only end this Tenancy by obtaining a court order for possession on one of the grounds set out in Schedule 2 of the Housing Act 1988 (as amended by the Renters\' Rights Act 2025). The Landlord cannot serve a section 21 notice as this has been abolished.',
      'For most grounds, the Landlord must give the Tenant at least two months\' notice, and in some cases four months\' notice, in writing before commencing possession proceedings. The required notice period depends on the ground relied upon.',
      'If the Landlord wishes to sell the Property or move into it as their own home, the Landlord may seek possession under the relevant mandatory grounds, subject to the notice periods and conditions set out in the Act. These grounds may not be relied upon within the first 12 months of the Tenancy.',
      'At the end of the Tenancy, the Tenant must return the Property in the same condition as at the start (allowing for fair wear and tear), return all keys, remove all personal belongings, and leave the Property clean and tidy.',
    ],
  })

  // 8. Pets
  clauses.push({
    number: '8',
    title: 'Pets',
    text: '',
    subclauses: data.petsConsidered
      ? [
          'The Tenant has the right to request consent to keep a pet at the Property. Any such request must be made in writing.',
          'The Landlord will respond to a pet request within 28 days. Consent will not be unreasonably withheld, in accordance with the Renters\' Rights Act 2025.',
          'If consent is granted, it may be subject to reasonable conditions, including a requirement that the Tenant obtains pet damage insurance to cover any damage caused by the pet.',
          'The Tenant must ensure that any permitted pet does not cause nuisance, annoyance, or damage to the Property or neighbouring properties.',
        ]
      : [
          'The Tenant has the right to request consent to keep a pet at the Property in accordance with the Renters\' Rights Act 2025. Any such request must be made in writing, and the Landlord will respond within 28 days.',
          'Consent will not be unreasonably withheld.',
        ],
  })

  // 9. Parking & Garden (if applicable)
  if (data.parkingIncluded) {
    clauses.push({
      number: '9',
      title: 'Parking',
      text: '',
      subclauses: [
        'A parking space is provided with the Property for the Tenant\'s use. The Tenant must not obstruct access for other residents or neighbours.',
        'The Landlord accepts no responsibility for vehicles or their contents parked at the Property.',
      ],
    })
  }

  // General provisions
  const generalNum = data.parkingIncluded ? '10' : '9'
  clauses.push({
    number: generalNum,
    title: 'General Provisions',
    text: '',
    subclauses: [
      'This Agreement constitutes the entire agreement between the parties and supersedes all prior discussions, negotiations, and agreements.',
      'Any notice required under this Agreement must be given in writing and may be served by hand delivery, first-class post, or email to the addresses provided.',
      'If any clause or part of this Agreement is found to be unenforceable, the remaining clauses shall continue in full force and effect.',
      'This Agreement is governed by and shall be construed in accordance with the laws of England and Wales.',
      'Nothing in this Agreement is intended to or shall confer any rights on any third party.',
      'The Landlord confirms that the "How to Rent" guide published by the Ministry of Housing, Communities and Local Government has been provided to the Tenant.',
    ],
  })

  // Prescribed Information
  const prescribedNum = String(Number(generalNum) + 1)
  clauses.push({
    number: prescribedNum,
    title: 'Prescribed Information (Deposit)',
    text: `In accordance with the Housing Act 2004 and the Housing (Tenancy Deposits) (Prescribed Information) Order 2007 (as amended):`,
    subclauses: [
      `The Deposit of £${data.depositAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })} is held with the ${data.depositScheme === 'DPS' ? 'Deposit Protection Service (DPS)' : data.depositScheme === 'MyDeposits' ? 'MyDeposits' : 'Tenancy Deposit Scheme (TDS)'}.`,
      `The scheme contact details are: ${data.depositScheme === 'DPS' ? 'Deposit Protection Service, The Pavilions, Bridgwater Road, Bristol, BS13 8AE. Tel: 0330 303 0030. www.depositprotection.com' : data.depositScheme === 'MyDeposits' ? 'MyDeposits, Premiere House, 1st Floor, Elstree Way, Borehamwood, WD6 1JH. Tel: 0333 321 9401. www.mydeposits.co.uk' : 'Tenancy Deposit Scheme, PO Box 1255, Hemel Hempstead, HP1 9GN. Tel: 0300 037 1000. www.tenancydepositscheme.com'}.`,
      'The Tenant has the right to apply to the scheme for repayment of the Deposit at the end of the Tenancy. If a dispute arises, the relevant scheme operates a free alternative dispute resolution (ADR) service.',
      'The Landlord is required to protect the Deposit within 30 days of receipt and provide this prescribed information. Failure to do so may result in the Landlord being ordered to pay the Tenant compensation of between one and three times the Deposit amount.',
    ],
  })

  return clauses
}

/**
 * Generate a full plain-text version of the agreement for storage/display
 */
export function renderAgreementText(data: AgreementFormData): string {
  const clauses = generateAgreementClauses(data)
  const lines: string[] = []

  lines.push('═══════════════════════════════════════════════════════')
  lines.push('')
  lines.push('          WRITTEN STATEMENT OF TERMS')
  lines.push('         FOR AN ASSURED TENANCY')
  lines.push('')
  lines.push('     Under the Housing Act 1988 (as amended')
  lines.push('       by the Renters\' Rights Act 2025)')
  lines.push('')
  lines.push('═══════════════════════════════════════════════════════')
  lines.push('')
  lines.push(`Date: ${formatDateLong(data.startDate)}`)
  lines.push('')

  for (const clause of clauses) {
    lines.push('')
    lines.push(`${clause.number}. ${clause.title.toUpperCase()}`)
    lines.push('─'.repeat(50))
    if (clause.text) {
      lines.push(clause.text)
    }
    if (clause.subclauses) {
      for (let i = 0; i < clause.subclauses.length; i++) {
        lines.push(`  ${clause.number}.${i + 1}  ${clause.subclauses[i]}`)
        lines.push('')
      }
    }
  }

  lines.push('')
  lines.push('═══════════════════════════════════════════════════════')
  lines.push('SIGNATURES')
  lines.push('═══════════════════════════════════════════════════════')
  lines.push('')
  lines.push('Signed by the Landlord:')
  lines.push('')
  lines.push(`Name: ${data.landlordName}`)
  lines.push('Signature: ________________________')
  lines.push('Date: ________________________')
  lines.push('')
  lines.push('Signed by the Tenant:')
  lines.push('')
  lines.push(`Name: ${data.tenantName}`)
  lines.push('Signature: ________________________')
  lines.push('Date: ________________________')
  lines.push('')

  return lines.join('\n')
}
