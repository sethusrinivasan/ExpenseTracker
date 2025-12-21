import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { neon } from "@neondatabase/serverless"

console.log("[v0] Initializing auth config")
console.log("[v0] DATABASE_URL exists:", !!process.env.DATABASE_URL)
console.log("[v0] GOOGLE_CLIENT_ID exists:", !!process.env.GOOGLE_CLIENT_ID)

const sql = neon(process.env.DATABASE_URL!)

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      console.log("[v0] SignIn callback triggered", { email: user.email })

      if (!user.email) return false

      try {
        const existingUser = await sql`
          SELECT id FROM users WHERE email = ${user.email}
        `

        if (existingUser.length === 0) {
          const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`
          await sql`
            INSERT INTO users (id, name, email, image)
            VALUES (${userId}, ${user.name}, ${user.email}, ${user.image})
          `
          user.id = userId
        } else {
          await sql`
            UPDATE users 
            SET name = ${user.name}, image = ${user.image}, updated_at = CURRENT_TIMESTAMP
            WHERE email = ${user.email}
          `
          user.id = existingUser[0].id
        }

        if (account) {
          await sql`
            INSERT INTO accounts (user_id, type, provider, provider_account_id, access_token, expires_at, token_type, scope, id_token)
            VALUES (${user.id}, ${account.type}, ${account.provider}, ${account.providerAccountId}, ${account.access_token}, ${account.expires_at}, ${account.token_type}, ${account.scope}, ${account.id_token})
            ON CONFLICT (provider, provider_account_id) 
            DO UPDATE SET access_token = ${account.access_token}, expires_at = ${account.expires_at}
          `
        }

        return true
      } catch (error) {
        console.error("[v0] Sign in error:", error)
        return false
      }
    },
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
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.AUTH_SECRET,
}

console.log("[v0] Auth config created successfully")
