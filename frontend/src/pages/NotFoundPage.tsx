import { Link } from 'react-router-dom'
import { ROUTES } from '../constants/routes'

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
      <p className="text-sm text-slate-500">The page you are looking for does not exist.</p>
      <Link to={ROUTES.SHOP} className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700">
        Back to the shop
      </Link>
    </div>
  )
}

export default NotFoundPage
