import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { sql } from "@/lib/db"
import { nanoid } from "nanoid"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false

      try {
        const existingUser = await sql`
          SELECT * FROM users WHERE email = ${user.email} LIMIT 1
        `

        if (existingUser.length === 0) {
          const userId = nanoid()
          await sql`
            INSERT INTO users (id, email, name, image, email_verified)
            VALUES (
              ${userId},
              ${user.email},
              ${user.name || null},
              ${user.image || null},
              ${new Date().toISOString()}
            )
          `
          user.id = userId
        } else {
          user.id = existingUser[0].id
          await sql`
            UPDATE users 
            SET name = ${user.name || null}, 
                image = ${user.image || null},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${user.id}
          `
        }

        if (account) {
          const accountExists = await sql`
            SELECT * FROM accounts 
            WHERE provider = ${account.provider} 
            AND provider_account_id = ${account.providerAccountId}
            LIMIT 1
          `

          if (accountExists.length === 0) {
            await sql`
              INSERT INTO accounts (
                id, user_id, type, provider, provider_account_id,
                access_token, refresh_token, expires_at, token_type, scope, id_token
              )
              VALUES (
                ${nanoid()},
                ${user.id},
                ${account.type},
                ${account.provider},
                ${account.providerAccountId},
                ${account.access_token || null},
                ${account.refresh_token || null},
                ${account.expires_at || null},
                ${account.token_type || null},
                ${account.scope || null},
                ${account.id_token || null}
              )
            `
          }
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
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
      }
      return session
    },
  },
})
