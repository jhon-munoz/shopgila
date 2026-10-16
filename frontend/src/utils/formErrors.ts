export function toFieldErrors(details: string[]): Record<string, string> {
  const errors: Record<string, string> = {}
  details.forEach((detail) => {
    const separator = detail.indexOf(': ')
    if (separator > 0) {
      const field = detail.slice(0, separator)
      if (!(field in errors)) {
        errors[field] = detail.slice(separator + 2)
      }
    }
  })
  return errors
}
