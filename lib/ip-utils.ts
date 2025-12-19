import { headers } from "next/headers"

/**
 * Get the client IP address from request headers
 * Checks common proxy headers in order of priority
 */
export async function getClientIP(): Promise<string | null> {
  const headersList = await headers()

  // Check various headers that might contain the real IP
  const forwardedFor = headersList.get("x-forwarded-for")
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return forwardedFor.split(",")[0].trim()
  }

  const realIP = headersList.get("x-real-ip")
  if (realIP) {
    return realIP
  }

  const cfConnectingIP = headersList.get("cf-connecting-ip") // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  const trueClientIP = headersList.get("true-client-ip") // Akamai/Cloudflare
  if (trueClientIP) {
    return trueClientIP
  }

  return null
}
