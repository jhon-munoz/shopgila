import type { ImportReport } from '../../types/importReport'
import Card from '../reusables/Card'

interface ImportReportViewProps {
  report: ImportReport
}

function ImportReportView({ report }: ImportReportViewProps) {
  const stats = [
    { label: 'Created', value: report.created, className: 'text-emerald-600' },
    { label: 'Updated', value: report.updated, className: 'text-brand-600' },
    { label: 'Failed', value: report.failed, className: report.failed > 0 ? 'text-red-600' : 'text-slate-900' },
    { label: 'Blank rows', value: report.blankRows, className: 'text-slate-900' },
    { label: 'Repeated SKUs', value: report.duplicatesInFile, className: 'text-slate-900' },
  ]

  return (
    <section aria-label="Import report" className="space-y-4">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <dt className="text-xs text-slate-500">{stat.label}</dt>
            <dd className={`text-2xl font-bold ${stat.className}`}>{stat.value}</dd>
          </Card>
        ))}
      </dl>
      {report.errors.length > 0 && (
        <Card className="overflow-x-auto p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Rows that were not imported</h2>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="py-2 pr-4 font-medium">Line</th>
                <th scope="col" className="px-4 py-2 font-medium">SKU</th>
                <th scope="col" className="py-2 pl-4 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.errors.map((error) => (
                <tr key={`${error.line}-${error.sku}`}>
                  <td className="py-2 pr-4 text-slate-600">{error.line}</td>
                  <td className="px-4 py-2 text-slate-600">{error.sku || '-'}</td>
                  <td className="py-2 pl-4 text-red-700">{error.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </section>
  )
}

export default ImportReportView
