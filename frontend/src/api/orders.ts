import { API_ENDPOINTS } from './config'
import { request } from './utils/request'
import { getOrderUrl } from './utils/urls'
import type { Order, OrderRequest } from '../types/order'

export const placeOrder = (order: OrderRequest) =>
  request<Order>(API_ENDPOINTS.ORDERS, { method: 'POST', body: order })

export const fetchOrderById = (id: string, signal?: AbortSignal) =>
  request<Order>(getOrderUrl(id), { signal })
