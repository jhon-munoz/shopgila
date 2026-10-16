import { Link, NavLink, Outlet } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import { selectCartCount } from '../store/cartSlice'
import { useStore } from '../store/store'

const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
  }`

function ShopLayout() {
  const cartCount = useStore(selectCartCount)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to={ROUTES.SHOP} className="text-xl font-bold tracking-tight text-brand-600">
            Shopgila
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1">
            <NavLink to={ROUTES.SHOP} end className={navLinkClasses}>
              Shop
            </NavLink>
            <NavLink to={ROUTES.ADMIN_PRODUCTS} className={navLinkClasses}>
              Admin
            </NavLink>
            <NavLink
              to={ROUTES.CART}
              aria-label={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
              className={navLinkClasses}
            >
              Cart
              {cartCount > 0 && (
                <span
                  data-testid="cart-count"
                  className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 py-0.5 text-xs font-semibold text-white"
                >
                  {cartCount}
                </span>
              )}
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        Shopgila technical challenge
      </footer>
    </div>
  )
}

export default ShopLayout
