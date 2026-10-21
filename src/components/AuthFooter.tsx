export function AuthFooter() {
  return (
    <footer className="w-full max-w-md mt-6 text-center text-xs text-slate-400 leading-relaxed">
      <p>
        Tenancy Portal is a commercial software product by{' '}
        <strong className="text-slate-500">P3 Technologies Ltd</strong>, registered in England and Wales
        (Company No. 17180916), 107a High Street, Carrville, Durham, DH1 1BQ.
      </p>
      <p className="mt-1">Not affiliated with any government body.</p>
      <p className="mt-2 space-x-3">
        <a href="https://www.tenancy-portal.co.uk" className="hover:text-slate-600 underline">tenancy-portal.co.uk</a>
        <a href="https://www.tenancy-portal.co.uk/privacy.html" className="hover:text-slate-600 underline">Privacy</a>
        <a href="https://www.tenancy-portal.co.uk/terms.html" className="hover:text-slate-600 underline">Terms</a>
        <a href="mailto:hello@tenancy-portal.co.uk" className="hover:text-slate-600 underline">hello@tenancy-portal.co.uk</a>
      </p>
    </footer>
  )
}
