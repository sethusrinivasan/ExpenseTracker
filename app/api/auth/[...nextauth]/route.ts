import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import type { NextAuthOptions } from "next-auth"

const getAuthOptions = (): NextAuthOptions => {
  const url =
    process.env.NEXTAUTH_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")

  console.log("[v0] Initializing NextAuth with:", {
    url,
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasAuthSecret: !!process.env.AUTH_SECRET,
  })

  return {
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id
        }
        return token
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.id as string
        }
        return session
      },
    },
    session: {
      strategy: "jwt",
    },
    pages: {
      signIn: "/auth/signin",
      error: "/auth/error",
    },
    secret: process.env.AUTH_SECRET,
    url,
  }
}

const handler = NextAuth(getAuthOptions())

export { handler as GET, handler as POST }

export const authOptions = getAuthOptions()
