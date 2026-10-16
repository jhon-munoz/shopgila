import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout'
import ShopLayout from '../layouts/ShopLayout'
import { ROUTES } from '../constants/routes'
import NotFoundPage from '../pages/NotFoundPage'
import AdminProductsPage from '../pages/admin/AdminProductsPage'
import ImportPage from '../pages/admin/ImportPage'
import ProductFormPage from '../pages/admin/ProductFormPage'
import CartPage from '../pages/shop/CartPage'
import OrderConfirmationPage from '../pages/shop/OrderConfirmationPage'
import ShopPage from '../pages/shop/ShopPage'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ShopLayout />}>
        <Route index element={<ShopPage />} />
        <Route path={ROUTES.CART} element={<CartPage />} />
        <Route path={ROUTES.ORDER} element={<OrderConfirmationPage />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to={ROUTES.ADMIN_PRODUCTS} replace />} />
        <Route path={ROUTES.ADMIN_PRODUCTS} element={<AdminProductsPage />} />
        <Route path={ROUTES.ADMIN_PRODUCT_NEW} element={<ProductFormPage />} />
        <Route path={ROUTES.ADMIN_PRODUCT_EDIT} element={<ProductFormPage />} />
        <Route path={ROUTES.ADMIN_IMPORT} element={<ImportPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes
