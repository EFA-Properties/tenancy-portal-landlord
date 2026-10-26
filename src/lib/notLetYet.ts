// A property that isn't let yet (e.g. being renovated) is flagged inside compliance_overrides,
// alongside the per document 'na' overrides, so its checklist doesn't report anything missing.
export const NOT_LET_YET_KEY = 'not_let_yet'

export function isNotLetYet(overrides: Record<string, string> | null | undefined) {
  return overrides?.[NOT_LET_YET_KEY] === 'true'
}
