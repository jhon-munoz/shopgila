export const ROUTES = {
  SHOP: '/',
  CART: '/cart',
  ORDER: '/orders/:orderId',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_PRODUCT_NEW: '/admin/products/new',
  ADMIN_PRODUCT_EDIT: '/admin/products/:productId/edit',
  ADMIN_IMPORT: '/admin/import',
} as const

export const getOrderPath = (orderId: string) => `/orders/${orderId}`

export const getProductEditPath = (productId: string) => `/admin/products/${productId}/edit`
