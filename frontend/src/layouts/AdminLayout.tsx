import { Link, NavLink, Outlet } from 'react-router-dom'
import { ROUTES } from '../constants/routes'

const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
  }`

function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-slate-200 bg-white md:w-60 md:border-b-0 md:border-r">
        <div className="px-4 py-4">
          <Link to={ROUTES.ADMIN_PRODUCTS} className="text-xl font-bold tracking-tight text-brand-600">
            Shopgila
          </Link>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Administration</p>
        </div>
        <nav aria-label="Administration" className="flex gap-1 px-3 pb-4 md:flex-col">
          <NavLink to={ROUTES.ADMIN_PRODUCTS} end className={navLinkClasses}>
            Products
          </NavLink>
          <NavLink to={ROUTES.ADMIN_IMPORT} className={navLinkClasses}>
            Import CSV
          </NavLink>
          <NavLink to={ROUTES.SHOP} className={navLinkClasses}>
            Back to shop
          </NavLink>
        </nav>
      </aside>
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
