"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DbError } from "@/components/db-error"
import { ChevronLeft, ChevronRight } from "lucide-react"
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
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchExpenses(page)
  }, [page])

  const fetchExpenses = async (p: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/expenses?page=${p}`)
      const json = await response.json()
      if (!response.ok) {
        setError(json.error ?? "Failed to load expenses.")
        return
      }
      const data = Array.isArray(json) ? json : (json.data ?? [])
      setExpenses(data)
      setTotalPages(json.pages ?? 1)
      setTotal(json.total ?? data.length)
    } catch {
      setError("Could not reach the server. Check your network connection.")
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Recent Expenses</CardTitle>
            <CardDescription className="text-base mt-1">
              {total > 0 ? `${total} total · sorted by date` : "Your latest spending activity"}
            </CardDescription>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Page {page} of {totalPages}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <DbError message={error} />
        ) : expenses.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No expenses yet. Add your first expense to get started!</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {expenses.map((expense, index) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-5 border border-border/50 rounded-2xl bg-secondary/30 hover:bg-secondary/50 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 ease-out cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  {((page - 1) * 50) + 1}–{Math.min(page * 50, total)} of {total}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
