import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib'

export interface ReceiptDetails {
  documentTitle: string
  fileName: string
  propertyAddress: string
  tenantName: string
  tenantEmail: string
  landlordName: string
  confirmedAt: Date
  ipAddress: string
  userAgent: string
  originalSha256: string
  reference: string
  confirmationText: string
}

// Standard PDF fonts only cover basic Latin characters
function safe(text: string): string {
  return (text || '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/£/g, 'GBP ')
    .replace(/[^\x20-\x7E]/g, '')
}

export function formatUkTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZoneName: 'short',
  }).format(date)
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = []
  for (const paragraph of safe(text).split('\n')) {
    let line = ''
    for (const word of paragraph.split(' ')) {
      const next = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
        lines.push(line)
        line = word
      } else {
        line = next
      }
    }
    lines.push(line)
  }
  return lines
}

function stampFooter(page: PDFPage, font: PDFFont, text: string) {
  const { width } = page.getSize()
  const size = 7
  const lines = wrap(text, font, size, width - 40)
  // White band so the stamp stays readable over the page content
  page.drawRectangle({ x: 16, y: 6, width: width - 32, height: lines.length * 9 + 4, color: rgb(1, 1, 1), opacity: 0.85 })
  lines.forEach((line, i) => {
    page.drawText(line, {
      x: 20, y: 10 + (lines.length - 1 - i) * 9, size, font, color: rgb(0.1, 0.35, 0.6),
    })
  })
}

async function addReceiptPage(pdf: PDFDocument, d: ReceiptDetails) {
  const page = pdf.addPage([595.28, 841.89]) // A4
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const signature = await pdf.embedFont(StandardFonts.TimesRomanItalic)
  const left = 56
  const maxWidth = 595.28 - left * 2
  let y = 780

  const write = (text: string, opts: { font?: PDFFont; size?: number; gap?: number; color?: ReturnType<typeof rgb> } = {}) => {
    const font = opts.font ?? regular
    const size = opts.size ?? 10
    for (const line of wrap(text, font, size, maxWidth)) {
      page.drawText(line, { x: left, y, size, font, color: opts.color ?? rgb(0.1, 0.1, 0.1) })
      y -= size + 4
    }
    y -= opts.gap ?? 6
  }

  write('Tenant receipt of document', { font: bold, size: 18, gap: 4 })
  write(`Receipt reference ${d.reference}`, { size: 9, color: rgb(0.4, 0.4, 0.4), gap: 18 })

  const rows: [string, string][] = [
    ['Document', d.documentTitle],
    ['File', d.fileName],
    ['Property', d.propertyAddress],
    ['Landlord', d.landlordName],
    ['Tenant', d.tenantName],
    ['Tenant email', d.tenantEmail],
    ['Confirmed at', formatUkTime(d.confirmedAt)],
    ['Confirmed at (UTC)', d.confirmedAt.toISOString()],
    ['IP address', d.ipAddress || 'Not available'],
    ['Device', d.userAgent || 'Not available'],
  ]
  for (const [label, value] of rows) {
    page.drawText(safe(label), { x: left, y, size: 9, font: bold, color: rgb(0.35, 0.35, 0.35) })
    const lines = wrap(value, regular, 10, maxWidth - 120)
    lines.forEach((line, i) => {
      page.drawText(line, { x: left + 120, y: y - i * 13, size: 10, font: regular, color: rgb(0.1, 0.1, 0.1) })
    })
    y -= Math.max(1, lines.length) * 13 + 6
  }

  y -= 10
  write('Statement', { font: bold, size: 11, gap: 2 })
  write(`"${d.confirmationText}"`, { gap: 18 })

  write('Signed', { font: bold, size: 11, gap: 4 })
  page.drawText(safe(d.tenantName), { x: left, y: y - 14, size: 26, font: signature, color: rgb(0.05, 0.15, 0.45) })
  y -= 26
  page.drawLine({ start: { x: left, y }, end: { x: left + 260, y }, thickness: 0.8, color: rgb(0.5, 0.5, 0.5) })
  y -= 14
  write(`Electronically signed by ${d.tenantName} by confirming receipt in the tenant portal on ${formatUkTime(d.confirmedAt)}.`, { size: 9, gap: 18 })

  write('Original file fingerprint (SHA-256)', { font: bold, size: 9, gap: 2 })
  write(d.originalSha256, { font: regular, size: 8, gap: 10 })
  write('This fingerprint is unique to the exact file the tenant received. Any change to the file would give a different fingerprint.', { size: 8, color: rgb(0.4, 0.4, 0.4) })
}

export async function buildSignedCopy(original: Uint8Array | null, mimeType: string | null, d: ReceiptDetails): Promise<Uint8Array> {
  const footer = `Received and read by ${d.tenantName} on ${formatUkTime(d.confirmedAt)}. Receipt reference ${d.reference}.`
  let pdf: PDFDocument | null = null

  if (original && mimeType === 'application/pdf') {
    try {
      pdf = await PDFDocument.load(original, { ignoreEncryption: true })
      const font = await pdf.embedFont(StandardFonts.Helvetica)
      for (const page of pdf.getPages()) stampFooter(page, font, footer)
    } catch {
      pdf = null // Unreadable PDF: fall back to a receipt on its own
    }
  }

  if (!pdf) {
    pdf = await PDFDocument.create()
    if (original && (mimeType === 'image/jpeg' || mimeType === 'image/png')) {
      try {
        const image = mimeType === 'image/png' ? await pdf.embedPng(original) : await pdf.embedJpg(original)
        const page = pdf.addPage([595.28, 841.89])
        const scale = Math.min((595.28 - 60) / image.width, (841.89 - 90) / image.height, 1)
        const w = image.width * scale
        const h = image.height * scale
        page.drawImage(image, { x: (595.28 - w) / 2, y: 841.89 - 30 - h, width: w, height: h })
        stampFooter(page, await pdf.embedFont(StandardFonts.Helvetica), footer)
      } catch {
        // Image could not be embedded; the receipt page still records the fingerprint
      }
    }
  }

  await addReceiptPage(pdf, d)
  const pages = pdf.getPages()
  stampFooter(pages[pages.length - 1], await pdf.embedFont(StandardFonts.Helvetica), footer)
  pdf.setTitle(safe(`${d.documentTitle} - signed receipt ${d.reference}`))
  pdf.setAuthor('Tenancy Portal')
  pdf.setCreationDate(d.confirmedAt)
  pdf.setModificationDate(d.confirmedAt)
  return await pdf.save()
}
