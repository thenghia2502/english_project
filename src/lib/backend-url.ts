export function getBackendBaseUrl(): string {
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? process.env.BACKEND_API_URL
      : "http://localhost:4000"

  if (!baseUrl) {
    throw new Error("Missing BACKEND_API_URL in production environment")
  }

  return baseUrl.replace(/\/+$/, "")
}
