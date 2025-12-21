import { neon } from "@neondatabase/serverless"

export const sql = neon(process.env.DATABASE_URL!)

export interface Expense {
  id: string
  user_id: string
  amount: string
  category: string
  description: string | null
  date: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  email_verified: string | null
  created_at: string
  updated_at: string
}
