import { ApiError } from '../../api/utils/request'

interface ErrorBannerProps {
  error: unknown
  title?: string
}

function ErrorBanner({ error, title = 'Something went wrong' }: ErrorBannerProps) {
  if (!error) {
    return null
  }

  const message = error instanceof Error ? error.message : String(error)
  const details = error instanceof ApiError ? error.details : []

  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4">
      <h2 className="text-sm font-semibold text-red-800">{title}</h2>
      <p className="mt-1 text-sm text-red-700">{message}</p>
      {details.length > 0 && (
        <ul className="mt-2 list-inside list-disc space-y-0.5 text-sm text-red-700">
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ErrorBanner
