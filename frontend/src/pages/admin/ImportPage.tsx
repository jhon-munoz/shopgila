import { useState, type FormEvent } from 'react'
import ImportReportView from '../../components/import/ImportReportView'
import Button from '../../components/reusables/Button'
import Card from '../../components/reusables/Card'
import ErrorBanner from '../../components/reusables/ErrorBanner'
import PageHeader from '../../components/reusables/PageHeader'
import { useImportProducts } from '../../hooks'

function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const importProducts = useImportProducts()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (file) {
      importProducts.mutate(file)
    }
  }

  return (
    <>
      <PageHeader
        title="Import products"
        description="Upload a CSV with the columns name, sku, description, category, price, stock and weight_kg."
      />
      <Card className="mb-6 p-6">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
          <div className="flex-1">
            <label htmlFor="import-file" className="mb-1.5 block text-sm font-medium text-slate-700">
              CSV file
            </label>
            <input
              id="import-file"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>
          <Button type="submit" disabled={!file} loading={importProducts.isPending}>
            Import
          </Button>
        </form>
        <p className="mt-3 text-xs text-slate-500">
          Existing SKUs are updated, new ones are created and invalid rows are reported without stopping the import.
        </p>
      </Card>
      <div className="space-y-4">
        <ErrorBanner error={importProducts.error} title="Could not import the file" />
        {importProducts.data && <ImportReportView report={importProducts.data} />}
      </div>
    </>
  )
}

export default ImportPage
