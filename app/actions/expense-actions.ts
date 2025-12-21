"use server"

import { auth } from "@/auth"
import { createExpense, deleteExpense, getExpensesByUserId, updateExpense } from "@/lib/expenses"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const expenseSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
})

export async function addExpense(formData: FormData) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    const data = {
      amount: Number(formData.get("amount")),
      category: formData.get("category") as string,
      description: formData.get("description") as string | undefined,
      date: formData.get("date") as string,
    }

    const validated = expenseSchema.parse(data)
    await createExpense(session.user.id, validated)

    revalidatePath("/expenses")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: "Failed to add expense" }
  }
}

export async function editExpense(expenseId: string, formData: FormData) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    const data = {
      amount: Number(formData.get("amount")),
      category: formData.get("category") as string,
      description: formData.get("description") as string | undefined,
      date: formData.get("date") as string,
    }

    const validated = expenseSchema.parse(data)
    const result = await updateExpense(expenseId, session.user.id, validated)

    if (!result) {
      return { error: "Expense not found or unauthorized" }
    }

    revalidatePath("/expenses")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: "Failed to update expense" }
  }
}

export async function removeExpense(expenseId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    const result = await deleteExpense(expenseId, session.user.id)

    if (!result) {
      return { error: "Expense not found or unauthorized" }
    }

    revalidatePath("/expenses")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    return { error: "Failed to delete expense" }
  }
}

export async function getUserExpenses() {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Unauthorized", expenses: [] }
  }

  try {
    const expenses = await getExpensesByUserId(session.user.id)
    return { expenses, error: null }
  } catch (error) {
    return { error: "Failed to fetch expenses", expenses: [] }
  }
}
