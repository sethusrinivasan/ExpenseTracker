export interface Expense {
  id: number
  description: string
  amount: number
  category: string
  date: string
  user_id?: string | null // Added user_id to match database schema
  ip_address?: string | null
  created_at: string
  updated_at: string
}

export interface ExpenseFormData {
  description: string
  amount: number
  category: string
  date: string
  userId?: string // Added optional userId for form data
}
