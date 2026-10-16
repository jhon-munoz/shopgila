export interface RowError {
  line: number
  sku: string
  message: string
}

export interface ImportReport {
  totalRows: number
  created: number
  updated: number
  failed: number
  blankRows: number
  duplicatesInFile: number
  errors: RowError[]
}
