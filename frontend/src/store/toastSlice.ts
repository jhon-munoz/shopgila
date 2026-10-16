import type { StateCreator } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
}

export interface ToastSlice {
  toasts: Toast[]
  showToast: (type: ToastType, message: string) => void
  dismissToast: (id: string) => void
}

let nextToastId = 0

export const createToastSlice: StateCreator<ToastSlice, [], [], ToastSlice> = (set) => ({
  toasts: [],

  showToast: (type, message) =>
    set((state) => ({ toasts: [...state.toasts, { id: String(++nextToastId), type, message }] })),

  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
})
