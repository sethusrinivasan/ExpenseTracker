import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { neon } from "@neondatabase/serverless"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false

      try {
        const sql = getSql()

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
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
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
}

const getSql = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  return neon(process.env.DATABASE_URL)
}
