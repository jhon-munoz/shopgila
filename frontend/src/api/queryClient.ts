import { MutationCache, QueryClient } from '@tanstack/react-query'
import { useStore } from '../store/store'
import { ApiError } from './utils/request'

const STALE_TIME_MS = 30_000
const MAX_RETRIES = 2

const isClientError = (error: unknown) =>
  error instanceof ApiError && error.status >= 400 && error.status < 500

const isServerFailure = (error: unknown): error is ApiError =>
  error instanceof ApiError && (error.status === 0 || error.status >= 500)

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => !isClientError(error) && failureCount < MAX_RETRIES,
      },
    },
    mutationCache: new MutationCache({
      onError: (error) => {
        if (isServerFailure(error)) {
          useStore.getState().showToast('error', error.message)
        }
      },
    }),
  })

export const queryClient = createQueryClient()
