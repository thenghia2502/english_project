"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ReactNode, useState } from 'react'

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors except 408 (timeout)
              if (error instanceof Error && 'status' in error) {
                const status = (error as { status: number }).status
                if (status >= 400 && status < 500 && status !== 408) {
                  return false
                }
              }
              return failureCount < 3
            },
            refetchOnWindowFocus: false,
            refetchOnMount: true,
            refetchOnReconnect: 'always',
          },
          mutations: {
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
