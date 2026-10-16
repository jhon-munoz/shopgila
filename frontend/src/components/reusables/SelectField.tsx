import type { SelectHTMLAttributes } from 'react'
import FormControl from './FormControl'
import { fieldClasses, getDescribedBy } from './fieldUtils'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string
  label: string
  error?: string
  hint?: string
}

function SelectField({ id, label, error, hint, className = '', children, ...rest }: SelectFieldProps) {
  return (
    <FormControl id={id} label={label} error={error} hint={hint}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={getDescribedBy(id, error, hint)}
        className={`${fieldClasses} ${className}`}
        {...rest}
      >
        {children}
      </select>
    </FormControl>
  )
}

export default SelectField
