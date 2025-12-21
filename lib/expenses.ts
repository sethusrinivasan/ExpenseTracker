import { sql, type Expense } from "./db"
import { nanoid } from "nanoid"

export async function getExpensesByUserId(userId: string): Promise<Expense[]> {
  const expenses = await sql`
    SELECT * FROM expenses
    WHERE user_id = ${userId}
    ORDER BY date DESC, created_at DESC
  `
  return expenses as Expense[]
}

export async function getExpenseById(expenseId: string, userId: string): Promise<Expense | null> {
  const result = await sql`
    SELECT * FROM expenses
    WHERE id = ${expenseId} AND user_id = ${userId}
    LIMIT 1
  `
  return result[0] as Expense | null
}

export async function createExpense(
  userId: string,
  data: {
    amount: number
    category: string
    description?: string
    date: string
  },
): Promise<Expense> {
  const id = nanoid()
  const result = await sql`
    INSERT INTO expenses (id, user_id, amount, category, description, date)
    VALUES (
      ${id},
      ${userId},
      ${data.amount},
      ${data.category},
      ${data.description || null},
      ${data.date}
    )
    RETURNING *
  `
  return result[0] as Expense
}

export async function updateExpense(
  expenseId: string,
  userId: string,
  data: {
    amount?: number
    category?: string
    description?: string
    date?: string
  },
): Promise<Expense | null> {
  const updates: string[] = []
  const values: any[] = []

  if (data.amount !== undefined) {
    updates.push("amount = $" + (values.length + 1))
    values.push(data.amount)
  }
  if (data.category !== undefined) {
    updates.push("category = $" + (values.length + 1))
    values.push(data.category)
  }
  if (data.description !== undefined) {
    updates.push("description = $" + (values.length + 1))
    values.push(data.description)
  }
  if (data.date !== undefined) {
    updates.push("date = $" + (values.length + 1))
    values.push(data.date)
  }

  if (updates.length === 0) return null

  updates.push("updated_at = CURRENT_TIMESTAMP")

  const result = await sql`
    UPDATE expenses
    SET ${sql(updates.join(", "))}
    WHERE id = ${expenseId} AND user_id = ${userId}
    RETURNING *
  `
  return result[0] as Expense | null
}

export async function deleteExpense(expenseId: string, userId: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM expenses
    WHERE id = ${expenseId} AND user_id = ${userId}
    RETURNING id
  `
  return result.length > 0
}

export async function getExpenseSummaryByCategory(userId: string) {
  const summary = await sql`
    SELECT 
      category,
      COUNT(*)::int as count,
      SUM(amount)::decimal as total
    FROM expenses
    WHERE user_id = ${userId}
    GROUP BY category
    ORDER BY total DESC
  `
  return summary
}

export async function getMonthlyExpenses(userId: string, year: number) {
  const summary = await sql`
    SELECT 
      EXTRACT(MONTH FROM date)::int as month,
      SUM(amount)::decimal as total
    FROM expenses
    WHERE user_id = ${userId} AND EXTRACT(YEAR FROM date) = ${year}
    GROUP BY EXTRACT(MONTH FROM date)
    ORDER BY month
  `
  return summary
}
