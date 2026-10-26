import { supabase } from './supabase'

// Opens the stamped and signed copy made when a tenant confirmed receipt of a document
export async function openSignedCopy(receiptPath: string) {
  const tab = window.open('', '_blank')
  const { data, error } = await supabase.storage.from('document-receipts').createSignedUrl(receiptPath, 3600)
  if (error || !data?.signedUrl) {
    tab?.close()
    return
  }
  if (tab) tab.location.href = data.signedUrl
  else window.open(data.signedUrl, '_blank')
}
