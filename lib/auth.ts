import { getServerSession } from "next-auth/next"

export async function getSession() {
  // Note: This won't work without authOptions, but we're debugging the main error first
  return await getServerSession()
}

export async function getCurrentUser() {
  const session = await getServerSession()
  return session?.user
}
