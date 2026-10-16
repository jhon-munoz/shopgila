import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createCartSlice, type CartSlice } from './cartSlice'
import { createToastSlice, type ToastSlice } from './toastSlice'

export type StoreState = CartSlice & ToastSlice

export const CART_STORAGE_KEY = 'shopgila-cart'

export const useStore = create<StoreState>()(
  persist(
    (...args) => ({
      ...createCartSlice(...args),
      ...createToastSlice(...args),
    }),
    {
      name: CART_STORAGE_KEY,
      partialize: (state) => ({ items: state.items }),
    },
  ),
)
