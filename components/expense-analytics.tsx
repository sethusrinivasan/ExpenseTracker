"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

interface Expense {
  id: number
  amount: string
  category: string
  date: string
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export function ExpenseAnalytics() {
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

  const getCategoryData = () => {
    const categoryTotals: Record<string, number> = {}

    expenses.forEach((expense) => {
      const amount = Number.parseFloat(expense.amount)
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + amount
    })

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    }))
  }

  const getMonthlyData = () => {
    const monthlyTotals: Record<string, number> = {}

    expenses.forEach((expense) => {
      const date = new Date(expense.date)
      const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
      const amount = Number.parseFloat(expense.amount)
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + amount
    })

    return Object.entries(monthlyTotals)
      .map(([month, total]) => ({
        month,
        total: Number(total.toFixed(2)),
      }))
      .slice(-6) // Last 6 months
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 shadow-xl shadow-black/5">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full rounded-xl" />
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-xl shadow-black/5">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full rounded-xl" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <Card className="border-border/50 shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95">
        <CardContent className="pt-6">
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No data available yet. Add some expenses to see analytics!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const categoryData = getCategoryData()
  const monthlyData = getMonthlyData()

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-border/50 shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95 animate-scale-in">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Spending by Category</CardTitle>
          <CardDescription className="text-base">Distribution of expenses across categories</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              value: {
                label: "Amount",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-80"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card
        className="border-border/50 shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95 animate-scale-in"
        style={{ animationDelay: "100ms" }}
      >
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Monthly Spending Trend</CardTitle>
          <CardDescription className="text-base">Your spending over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              total: {
                label: "Total",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-80"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="hsl(var(--chart-2))" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 border-border/50 shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95 animate-slide-up">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Category Breakdown</CardTitle>
          <CardDescription className="text-base">Detailed spending by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {categoryData
              .sort((a, b) => b.value - a.value)
              .map((category, index) => {
                const total = categoryData.reduce((sum, cat) => sum + cat.value, 0)
                const percentage = ((category.value / total) * 100).toFixed(1)

                return (
                  <div
                    key={category.name}
                    className="flex items-center gap-4 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0 shadow-lg"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-base">{category.name}</span>
                        <span className="text-sm text-muted-foreground font-medium">{percentage}%</span>
                      </div>
                      <div className="h-3 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-700 ease-out"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                    <span className="font-bold text-xl tracking-tight">${category.value.toFixed(2)}</span>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
