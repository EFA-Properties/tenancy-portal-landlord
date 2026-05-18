/**
 * HMO Room Licence Agreement Template
 * Compliant with the Renters' Rights Act 2025 (effective 1 May 2026)
 *
 * An HMO room licence is NOT an Assured Tenancy — the occupier is a
 * licensee with exclusive use of their room but shared use of common areas.
 * However, post-RRA 2025 many HMO occupancies are now treated as assured
 * tenancies. This template covers both scenarios with appropriate clauses.
 *
 * Key provisions:
 * - Exclusive use of a specific room within a licensed HMO
 * - Shared use of common facilities (kitchen, bathroom, living areas)
 * - House rules for communal living
 * - HMO licence conditions compliance
 * - Fire safety and emergency procedures
 */

import type { AgreementClause } from './agreementTemplate'

export interface RoomLicenceFormData {
  // Parties
  landlordName: string
  landlordAddress: string
  tenantName: string
  tenantEmail: string

  // Property
  propertyAddress: string
  propertyPostcode: string
  hmoLicenceNumber: string

  // Room
  roomNumber: string
  roomDescription: string

  // Terms
  startDate: string
  monthlyRent: number
  rentDueDay: number
  paymentMethod: string
  rentIncludes: string // e.g. 'all bills included' or 'exclusive of bills'

  // Deposit
  depositAmount: number
  depositScheme: 'DPS' | 'MyDeposits' | 'TDS'
  depositReference: string

  // Property details
  furnishing: 'unfurnished' | 'part_furnished' | 'furnished'
  permittedOccupants: number // for the room
  petsConsidered: boolean

  // Shared areas
  sharedAreas: string // e.g. 'kitchen, bathroom, living room'

  // Utilities
  councilTaxResponsibility: 'tenant' | 'landlord'
  utilitiesResponsibility: 'tenant' | 'landlord'
}

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

export function getDefaultRoomLicenceData(
  landlordName: string,
  landlordAddress: string,
  tenantName: string,
  tenantEmail: string,
  propertyAddress: string,
  propertyPostcode: string,
  roomNumber: string,
  startDate: string,
  monthlyRent: number,
): RoomLicenceFormData {
  const fiveWeeksRent = Math.round((monthlyRent * 12 / 52) * 5 * 100) / 100

  return {
    landlordName,
    landlordAddress: landlordAddress || '',
    tenantName,
    tenantEmail,
    propertyAddress,
    propertyPostcode,
    hmoLicenceNumber: '',
    roomNumber: roomNumber || '',
    roomDescription: '',
    startDate,
    monthlyRent,
    rentDueDay: 1,
    paymentMethod: 'Bank transfer',
    rentIncludes: 'All bills included (gas, electric, water, council tax, broadband)',
    depositAmount: fiveWeeksRent,
    depositScheme: 'DPS',
    depositReference: '',
    furnishing: 'furnished',
    permittedOccupants: 1,
    petsConsidered: false,
    sharedAreas: 'Kitchen, bathroom, living room, hallway',
    councilTaxResponsibility: 'landlord',
    utilitiesResponsibility: 'landlord',
  }
}

export function generateRoomLicenceClauses(data: RoomLicenceFormData): AgreementClause[] {
  const clauses: AgreementClause[] = []

  // 1. Definitions
  clauses.push({
    number: '1',
    title: 'Definitions and Interpretation',
    text: 'In this Agreement, the following definitions apply:',
    subclauses: [
      `"the Landlord" means ${data.landlordName} of ${data.landlordAddress || '[address to be confirmed]'}.`,
      `"the Licensee" means ${data.tenantName}.`,
      `"the Property" means ${data.propertyAddress}, ${data.propertyPostcode}, which is a House in Multiple Occupation${data.hmoLicenceNumber ? ` (HMO Licence No: ${data.hmoLicenceNumber})` : ''}.`,
      `"the Room" means Room ${data.roomNumber}${data.roomDescription ? ` (${data.roomDescription})` : ''} at the Property.`,
      `"the Shared Areas" means the ${data.sharedAreas.toLowerCase()}, and any other communal parts of the Property.`,
      '"the Licence Fee" means the sum specified in clause 3.',
      '"the Deposit" means the sum specified in clause 4.',
      '"the Act" means the Housing Act 1988 as amended by the Renters\' Rights Act 2025.',
    ],
  })

  // 2. Grant of Licence
  clauses.push({
    number: '2',
    title: 'Grant of Licence',
    text: '',
    subclauses: [
      `The Landlord grants the Licensee the right to occupy the Room at the Property as a periodic tenancy within the meaning of the Housing Act 1988 (as amended by the Renters' Rights Act 2025). This agreement does not have a fixed term end date.`,
      `The licence commences on ${formatDateLong(data.startDate)} and continues on a monthly periodic basis until lawfully terminated in accordance with this Agreement and the Act.`,
      `The Licensee has exclusive use of the Room and the right to use the Shared Areas in common with the Landlord and other licensees or tenants of the Property.`,
      `The maximum number of persons permitted to occupy the Room is ${data.permittedOccupants}. The Licensee must not allow any other person to reside in the Room without the Landlord's prior written consent.`,
      `The Room is let as ${data.furnishing === 'unfurnished' ? 'unfurnished' : data.furnishing === 'part_furnished' ? 'part-furnished' : 'furnished'}.`,
    ],
  })

  // 3. Licence Fee (Rent)
  clauses.push({
    number: '3',
    title: 'Licence Fee',
    text: '',
    subclauses: [
      `The Licence Fee is £${data.monthlyRent.toLocaleString('en-GB', { minimumFractionDigits: 2 })} per calendar month, payable in advance on or before the ${ordinal(data.rentDueDay)} day of each month.`,
      `The Licence Fee ${data.rentIncludes ? `includes: ${data.rentIncludes}.` : 'is exclusive of all bills and utilities.'}`,
      `Payment shall be made by ${data.paymentMethod.toLowerCase()} to the account details provided separately by the Landlord.`,
      'The Landlord may increase the Licence Fee by serving a notice under section 13 of the Housing Act 1988, giving at least two months\' written notice. A fee increase may not take effect within the first 12 months, and no more than once in any subsequent 12-month period.',
      'If any payment is more than 14 days overdue, the Licensee may be liable for reasonable costs incurred by the Landlord in recovering the arrears, in accordance with the Tenant Fees Act 2019.',
    ],
  })

  // 4. Deposit
  clauses.push({
    number: '4',
    title: 'Deposit',
    text: '',
    subclauses: [
      `The Licensee shall pay a deposit of £${data.depositAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })} ("the Deposit") prior to the commencement of the licence. This does not exceed five weeks' Licence Fee as required by the Tenant Fees Act 2019.`,
      `The Deposit will be protected by the ${data.depositScheme === 'DPS' ? 'Deposit Protection Service (DPS)' : data.depositScheme === 'MyDeposits' ? 'MyDeposits' : 'Tenancy Deposit Scheme (TDS)'}${data.depositReference ? ` under reference ${data.depositReference}` : ''}. The Landlord will protect the Deposit within 30 days of receiving it and provide the Licensee with the prescribed information within the same period.`,
      'The Deposit is held as security for the performance of the Licensee\'s obligations under this Agreement and to cover any damage to the Room or its contents beyond fair wear and tear, unpaid Licence Fees, and reasonable cleaning costs where the Room is not returned in the condition recorded at check-in.',
      'At the end of the licence, the Deposit (or the balance after any agreed deductions) will be returned to the Licensee within 10 days of both parties agreeing the deductions, or in accordance with the rules of the relevant deposit protection scheme.',
    ],
  })

  // 5. Licensee's Obligations
  clauses.push({
    number: '5',
    title: 'Licensee\'s Obligations',
    text: 'The Licensee agrees:',
    subclauses: [
      'To pay the Licence Fee on time and in full on the due date each month.',
      'To keep the Room in a clean, tidy, and reasonable condition, and not to cause or permit any damage beyond fair wear and tear.',
      'To keep the Shared Areas clean and tidy after use, and to share responsibility for their upkeep with other occupants.',
      'Not to make any alterations to the Room, including decorating, without the prior written consent of the Landlord.',
      'Not to cause or permit any nuisance, annoyance, or disturbance to other occupants, neighbours, or persons in the vicinity.',
      'Not to use the Room for any illegal, immoral, or commercial purpose. The Room is provided for residential use only.',
      'Not to assign, sublet, or share the Room with any other person without the Landlord\'s prior written consent.',
      'To allow the Landlord or the Landlord\'s agents access to the Room for inspection, repair, or maintenance upon receiving at least 24 hours\' written notice, at reasonable times of day.',
      'To promptly report to the Landlord any disrepair, damage, or defect in the Room, Shared Areas, or their fixtures and fittings.',
      'To comply with the House Rules set out in clause 7 and any reasonable amendments notified in writing by the Landlord.',
      'Not to smoke inside the Property, including the Room and Shared Areas.',
      'Not to tamper with, disable, or obstruct any fire safety equipment, smoke alarms, carbon monoxide detectors, or fire doors.',
      'To ensure fire escape routes are kept clear at all times.',
      'To dispose of rubbish and recycling in the designated bins and on the correct collection days.',
      'To return all keys (including room key and front door key) at the end of the licence. If any keys are lost, the Licensee will bear the reasonable cost of replacement.',
    ],
  })

  // 6. Landlord's Obligations
  clauses.push({
    number: '6',
    title: 'Landlord\'s Obligations',
    text: 'The Landlord agrees:',
    subclauses: [
      'To allow the Licensee quiet enjoyment of the Room without interference, provided the Licensee complies with the terms of this Agreement.',
      'To keep in repair the structure and exterior of the Property, including drains, gutters, and external pipes, in accordance with section 11 of the Landlord and Tenant Act 1985.',
      'To keep in repair and proper working order the installations for the supply of water, gas, electricity, sanitation, space heating, and heating water.',
      'To ensure the Property meets the Decent Homes Standard as required by the Renters\' Rights Act 2025.',
      'To maintain the Shared Areas in a clean, safe, and functional condition, and to arrange cleaning of common areas at reasonable intervals.',
      'To ensure the Property complies with all conditions of the HMO licence at all times.',
      'To ensure working smoke alarms on each storey and carbon monoxide alarms in rooms with fixed combustion appliances, in compliance with the Smoke and Carbon Monoxide Alarm (Amendment) Regulations 2022.',
      'To ensure a valid Gas Safety Certificate (CP12) is obtained annually by a Gas Safe registered engineer and a copy provided to all occupants within 28 days.',
      'To ensure the electrical installation is inspected at least every five years and to provide a copy of the EICR to the Licensee.',
      'To ensure all fire safety measures are in place as required by the HMO licence conditions, including fire doors, fire extinguishers, fire blankets, and emergency lighting where required.',
      'To provide and maintain the Room furniture and contents in safe, working condition (where the Room is let furnished).',
      'To protect the Deposit in an authorised scheme within 30 days and provide the prescribed information.',
      'To give at least 24 hours\' written notice before visiting the Room, except in an emergency.',
      'To be registered with the Private Rented Sector Ombudsman as required by the Renters\' Rights Act 2025.',
      'To provide the "How to Rent" guide before the start of the licence.',
    ],
  })

  // 7. House Rules
  clauses.push({
    number: '7',
    title: 'House Rules',
    text: 'The following House Rules apply to all occupants of the Property and are intended to ensure comfortable and safe communal living:',
    subclauses: [
      'Quiet hours are between 11:00 PM and 7:00 AM. During these hours, noise should be kept to a minimum.',
      'The kitchen must be left clean and tidy after each use. All dishes, pots, and utensils must be washed and put away.',
      'Food must be stored in designated cupboards or shelves. Shared fridge space must be labelled and kept clean. Expired food will be disposed of.',
      'Bathroom and shower areas must be left clean after use. Personal toiletries should be stored in the Licensee\'s own room or designated space.',
      'Washing machines and tumble dryers (if provided) must not be used during quiet hours.',
      'Communal living areas must be kept tidy. Personal belongings should not be left in shared spaces.',
      'Bins and recycling must be emptied on the designated collection days. All occupants share responsibility for putting bins out and bringing them back.',
      'Guests may visit during reasonable hours but may not stay overnight for more than two consecutive nights without the Landlord\'s written permission, and no more than three nights in any seven-day period.',
      'No additional locks may be fitted to any door without the Landlord\'s written consent.',
      'Bicycles must be stored in designated areas only, not inside the Property or blocking communal spaces.',
      'The Landlord may update these House Rules from time to time by giving all occupants at least 14 days\' written notice.',
    ],
  })

  // 8. Ending the Licence
  clauses.push({
    number: '8',
    title: 'Ending the Licence',
    text: '',
    subclauses: [
      'The Licensee may end this licence by giving the Landlord at least two months\' written notice, expiring at the end of a period of the licence.',
      'The Landlord may only end this licence by obtaining a court order for possession on one of the grounds set out in Schedule 2 of the Housing Act 1988 (as amended). Section 21 notices have been abolished.',
      'For most grounds, the Landlord must give at least two months\' notice in writing before commencing possession proceedings.',
      'At the end of the licence, the Licensee must vacate the Room, remove all personal belongings, leave the Room clean and tidy, and return all keys.',
    ],
  })

  // 9. Pets
  clauses.push({
    number: '9',
    title: 'Pets',
    text: '',
    subclauses: data.petsConsidered
      ? [
          'The Licensee has the right to request consent to keep a pet in the Room. Any such request must be made in writing.',
          'The Landlord will respond to a pet request within 28 days. Consent will not be unreasonably withheld, in accordance with the Renters\' Rights Act 2025.',
          'Due to the communal nature of the Property, any pet consent may be conditional on the agreement of all other occupants.',
          'If consent is granted, it may be subject to reasonable conditions, including pet damage insurance.',
        ]
      : [
          'Due to the communal nature of the Property, pets are not ordinarily permitted. However, the Licensee retains the right to request consent under the Renters\' Rights Act 2025. Any request must be in writing, and the Landlord will respond within 28 days.',
        ],
  })

  // 10. General Provisions
  clauses.push({
    number: '10',
    title: 'General Provisions',
    text: '',
    subclauses: [
      'This Agreement constitutes the entire agreement between the parties and supersedes all prior discussions, negotiations, and agreements.',
      'Any notice required under this Agreement must be given in writing and may be served by hand delivery, first-class post, or email to the addresses provided.',
      'If any clause or part of this Agreement is found to be unenforceable, the remaining clauses shall continue in full force and effect.',
      'This Agreement is governed by the laws of England and Wales.',
      'Nothing in this Agreement is intended to or shall confer any rights on any third party.',
      'The Landlord confirms that the "How to Rent" guide has been provided to the Licensee.',
    ],
  })

  // 11. Prescribed Information (Deposit)
  clauses.push({
    number: '11',
    title: 'Prescribed Information (Deposit)',
    text: 'In accordance with the Housing Act 2004 and the Housing (Tenancy Deposits) (Prescribed Information) Order 2007 (as amended):',
    subclauses: [
      `The Deposit of £${data.depositAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })} is held with the ${data.depositScheme === 'DPS' ? 'Deposit Protection Service (DPS)' : data.depositScheme === 'MyDeposits' ? 'MyDeposits' : 'Tenancy Deposit Scheme (TDS)'}.`,
      `The scheme contact details are: ${data.depositScheme === 'DPS' ? 'Deposit Protection Service, The Pavilions, Bridgwater Road, Bristol, BS13 8AE. Tel: 0330 303 0030. www.depositprotection.com' : data.depositScheme === 'MyDeposits' ? 'MyDeposits, Premiere House, 1st Floor, Elstree Way, Borehamwood, WD6 1JH. Tel: 0333 321 9401. www.mydeposits.co.uk' : 'Tenancy Deposit Scheme, PO Box 1255, Hemel Hempstead, HP1 9GN. Tel: 0300 037 1000. www.tenancydepositscheme.com'}.`,
      'The Licensee has the right to apply to the scheme for repayment of the Deposit at the end of the licence.',
      'The Landlord is required to protect the Deposit within 30 days of receipt and provide this prescribed information. Failure to do so may result in compensation of between one and three times the Deposit amount.',
    ],
  })

  return clauses
}
