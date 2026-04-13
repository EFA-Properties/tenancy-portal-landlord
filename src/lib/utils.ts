export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function epcRatingColor(rating: string | null | undefined): string {
  if (!rating) return 'bg-gray-100 text-gray-600'
  const r = rating.toUpperCase()
  if (r === 'A' || r === 'B') return 'bg-green-100 text-green-700'
  if (r === 'C') return 'bg-yellow-100 text-yellow-700'
  if (r === 'D') return 'bg-orange-100 text-orange-700'
  return 'bg-red-100 text-red-700'
}
