import { useState, type FormEvent } from 'react'
import { ApiError } from '../../api/utils/request'
import type { Product, ProductInput } from '../../types/product'
import { toFieldErrors } from '../../utils/formErrors'
import Button from '../reusables/Button'
import Card from '../reusables/Card'
import ErrorBanner from '../reusables/ErrorBanner'
import TextAreaField from '../reusables/TextAreaField'
import TextField from '../reusables/TextField'

interface ProductFormProps {
  initialProduct?: Product
  categories: string[]
  submitLabel: string
  isSubmitting: boolean
  error: unknown
  onSubmit: (input: ProductInput) => void
  onCancel: () => void
}

interface FormValues {
  name: string
  sku: string
  description: string
  category: string
  price: string
  stock: string
  weightKg: string
}

const toFormValues = (product?: Product): FormValues => ({
  name: product?.name ?? '',
  sku: product?.sku ?? '',
  description: product?.description ?? '',
  category: product?.category ?? '',
  price: product ? String(product.price) : '',
  stock: product ? String(product.stock) : '',
  weightKg: product?.weightKg != null ? String(product.weightKg) : '',
})

const toProductInput = (values: FormValues): ProductInput => ({
  name: values.name.trim(),
  sku: values.sku.trim(),
  description: values.description.trim() || null,
  category: values.category.trim(),
  price: Number(values.price),
  stock: Number.parseInt(values.stock, 10),
  weightKg: values.weightKg.trim() ? Number(values.weightKg) : null,
})

function ProductForm({
  initialProduct,
  categories,
  submitLabel,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [values, setValues] = useState(() => toFormValues(initialProduct))

  const isValidation = error instanceof ApiError && error.status === 400 && error.details.length > 0
  const fieldErrors = isValidation ? toFieldErrors(error.details) : {}

  const bind = (field: keyof FormValues) => ({
    value: values[field],
    onChange: (event: { target: { value: string } }) =>
      setValues((current) => ({ ...current, [field]: event.target.value })),
    error: fieldErrors[field],
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit(toProductInput(values))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isValidation && <ErrorBanner error={error} title="Could not save the product" />}
      <Card className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="product-name" label="Name" required maxLength={255} {...bind('name')} />
          <TextField
            id="product-sku"
            label="SKU"
            required
            maxLength={64}
            hint="Unique code, saved in upper case."
            {...bind('sku')}
          />
        </div>
        <TextAreaField id="product-description" label="Description" rows={3} {...bind('description')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="product-category"
            label="Category"
            required
            maxLength={100}
            list="product-categories"
            {...bind('category')}
          />
          <datalist id="product-categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
          <TextField
            id="product-weight"
            label="Weight (kg)"
            type="number"
            min={0}
            step="0.001"
            hint="Optional."
            {...bind('weightKg')}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="product-price" label="Price" type="number" required min={0} step="0.01" {...bind('price')} />
          <TextField id="product-stock" label="Stock" type="number" required min={0} step="1" {...bind('stock')} />
        </div>
      </Card>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

export default ProductForm
