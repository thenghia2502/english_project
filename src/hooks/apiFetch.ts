let isRefreshing = false
type QueueItem = {
  input: RequestInfo
  init?: RequestInit
  resolve: (response: Response) => void
  reject: (error: unknown) => void
}
let queue: QueueItem[] = []

export async function apiFetch(
  input: RequestInfo,
  init?: RequestInit
) {
  const response = await fetch(input, {
    ...init,
    credentials: 'include', // 🔥 BẮT BUỘC
  })

  if (response.status !== 401) {
    return response
  }

  // ---- 401 ----
  return new Promise<Response>((resolve, reject) => {
    queue.push({ input, init, resolve, reject })

    if (!isRefreshing) {
      isRefreshing = true
      ;(async () => {
        try {
          const refreshRes = await fetch('/api/proxy/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          })
          if (!refreshRes.ok) {
            throw new Error(`Refresh failed: ${refreshRes.status}`)
          }

          isRefreshing = false
          const queued = [...queue]
          queue = []

          queued.forEach(async (item) => {
            try {
              const retryRes = await fetch(item.input, {
                ...item.init,
                credentials: 'include',
              })
              item.resolve(retryRes)
            } catch (err) {
              item.reject(err)
            }
          })
        } catch (e) {
          isRefreshing = false
          const queued = [...queue]
          queue = []
          queued.forEach((item) => item.reject(e))
          window.location.href = '/'
        }
      })()
    }
  })
}
