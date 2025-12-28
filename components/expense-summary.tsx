"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"

interface Expense {
  amount: string
  date: string
}

export function ExpenseSummary() {
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

  const calculateTotal = () => {
    return expenses.reduce((sum, expense) => sum + Number.parseFloat(expense.amount), 0)
  }

  const calculateMonthTotal = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    return expenses
      .filter((expense) => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
      })
      .reduce((sum, expense) => sum + Number.parseFloat(expense.amount), 0)
  }

  const calculateAverage = () => {
    if (expenses.length === 0) return 0
    return calculateTotal() / expenses.length
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border-border/50 shadow-xl shadow-black/5">
            <CardHeader>
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="border-border/50 shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 ease-out animate-scale-in">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground">Total Expenses</CardTitle>
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold tracking-tight">${calculateTotal().toFixed(2)}</div>
          <p className="text-sm text-muted-foreground mt-2">All time</p>
        </CardContent>
      </Card>

      <Card
        className="border-border/50 shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 ease-out animate-scale-in"
        style={{ animationDelay: "100ms" }}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground">This Month</CardTitle>
          <div className="p-2.5 bg-chart-2/10 rounded-xl">
            <TrendingUp className="h-5 w-5 text-chart-2" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold tracking-tight">${calculateMonthTotal().toFixed(2)}</div>
          <p className="text-sm text-muted-foreground mt-2">
            {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </CardContent>
      </Card>

      <Card
        className="border-border/50 shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 ease-out animate-scale-in"
        style={{ animationDelay: "200ms" }}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground">Average Expense</CardTitle>
          <div className="p-2.5 bg-chart-3/10 rounded-xl">
            <TrendingDown className="h-5 w-5 text-chart-3" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold tracking-tight">${calculateAverage().toFixed(2)}</div>
          <p className="text-sm text-muted-foreground mt-2">Per transaction</p>
        </CardContent>
      </Card>
    </div>
  )
}
