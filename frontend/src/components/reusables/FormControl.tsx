import type { ReactNode } from 'react'

interface FormControlProps {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
}

function FormControl({ id, label, error, hint, children }: FormControlProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

export default FormControl
