export const getApiBase = () => {
  // Use NEXT_PUBLIC_API_PROXY if provided (e.g. http://localhost:5000) else fallback to relative
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_PROXY) {
    return process.env.NEXT_PUBLIC_API_PROXY.replace(/\/$/, '')
  }
  return ''
}
