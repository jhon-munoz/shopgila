export const fieldClasses =
  'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ' +
  'placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 ' +
  'disabled:cursor-not-allowed disabled:bg-slate-100 aria-[invalid=true]:border-red-500 ' +
  'aria-[invalid=true]:focus:ring-red-500/30'

export const getDescribedBy = (id: string, error?: string, hint?: string) => {
  if (error) {
    return `${id}-error`
  }
  return hint ? `${id}-hint` : undefined
}
