// Supabase Storage only accepts plain characters in file keys, so names copied
// from websites (with curly dashes, brackets or accents) are tidied first.
// The original name is still saved on the document record.
export function safeFileName(name: string): string {
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot + 1).replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : ''
  const cleanBase = base
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 80) || 'document'
  return ext ? `${cleanBase}.${ext}` : cleanBase
}
