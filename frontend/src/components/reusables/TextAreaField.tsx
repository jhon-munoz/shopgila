import type { TextareaHTMLAttributes } from 'react'
import FormControl from './FormControl'
import { fieldClasses, getDescribedBy } from './fieldUtils'

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string
  label: string
  error?: string
  hint?: string
}

function TextAreaField({ id, label, error, hint, className = '', ...rest }: TextAreaFieldProps) {
  return (
    <FormControl id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={getDescribedBy(id, error, hint)}
        className={`${fieldClasses} ${className}`}
        {...rest}
      />
    </FormControl>
  )
}

export default TextAreaField
