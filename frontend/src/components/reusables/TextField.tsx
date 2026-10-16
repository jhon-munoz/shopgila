import type { InputHTMLAttributes } from 'react'
import FormControl from './FormControl'
import { fieldClasses, getDescribedBy } from './fieldUtils'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  error?: string
  hint?: string
}

function TextField({ id, label, error, hint, className = '', ...rest }: TextFieldProps) {
  return (
    <FormControl id={id} label={label} error={error} hint={hint}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={getDescribedBy(id, error, hint)}
        className={`${fieldClasses} ${className}`}
        {...rest}
      />
    </FormControl>
  )
}

export default TextField
