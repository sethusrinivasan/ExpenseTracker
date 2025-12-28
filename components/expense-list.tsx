"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"

interface Expense {
  id: number
  amount: string
  category: string
  description: string | null
  date: string
  created_at: string
}

export function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const response = await fetch("/api/expenses")
      if (!response.ok) throw new Error("Failed to fetch expenses")
      const data = await response.json()
      setExpenses(data)
    } catch (error) {
      console.error("Error fetching expenses:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="border-border/50 shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95">
        <CardHeader>
          <CardTitle className="text-2xl">Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95 animate-slide-up">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Recent Expenses</CardTitle>
        <CardDescription className="text-base">Your latest spending activity</CardDescription>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No expenses yet. Add your first expense to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense, index) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-5 border border-border/50 rounded-2xl bg-secondary/30 hover:bg-secondary/50 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 ease-out cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="secondary" className="rounded-full px-3 py-1 font-medium">
                      {expense.category}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(expense.date), { addSuffix: true })}
                    </span>
                  </div>
                  {expense.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{expense.description}</p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className="text-3xl font-bold tracking-tight">${Number.parseFloat(expense.amount).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
