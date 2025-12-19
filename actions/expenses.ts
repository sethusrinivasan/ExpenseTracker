"use server"

import { revalidatePath } from "next/cache"
import { sql } from "@/lib/db"
import { getClientIP } from "@/lib/ip-utils"
import type { Expense, ExpenseFormData } from "@/lib/types"

export async function createExpense(data: ExpenseFormData) {
  try {
    const ipAddress = await getClientIP()
    console.log("[v0] Creating expense with data:", data)
    console.log("[v0] Captured IP address:", ipAddress)

    const result = await sql`
      INSERT INTO expenses (description, amount, category, date, user_id, ip_address)
      VALUES (${data.description}, ${data.amount}, ${data.category}, ${data.date}, ${data.userId || "demo-user"}, ${ipAddress})
      RETURNING *
    `

    console.log("[v0] Expense created successfully:", result[0])
    revalidatePath("/")

    return { success: true, data: result[0] }
  } catch (error) {
    console.error("[v0] Error creating expense:", error)
    return { success: false, error: "Failed to create expense" }
  }
}

export async function getExpenses(): Promise<Expense[]> {
  try {
    const result = await sql`
      SELECT * FROM expenses
      ORDER BY date DESC, created_at DESC
      LIMIT 100
    `

    return result as Expense[]
  } catch (error) {
    console.error("[v0] Error fetching expenses:", error)
    return []
  }
}

export async function deleteExpense(id: number) {
  try {
    await sql`
      DELETE FROM expenses WHERE id = ${id}
    `

    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("[v0] Error deleting expense:", error)
    return { success: false, error: "Failed to delete expense" }
  }
}

export async function getLatestExpenseLocation() {
  try {
    const result = await sql`
      SELECT ip_address FROM expenses
      WHERE ip_address IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (result.length === 0) {
      return null
    }

    return result[0].ip_address
  } catch (error) {
    console.error("[v0] Error fetching latest expense location:", error)
    return null
  }
}
