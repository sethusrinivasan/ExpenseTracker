"use client"

import { useEffect, useState, useRef } from "react"
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

// Each row is ~72px tall. Calculate how many fit in the remaining viewport.
function calcPageSize(): number {
  const ROW_HEIGHT = 72
  const CHROME = 420 // header + tabs + summary cards + card header + pagination
  const available = Math.max(window.innerHeight - CHROME, ROW_HEIGHT * 3)
  return Math.max(3, Math.floor(available / ROW_HEIGHT))
}

export function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(8)

  // Calculate page size on mount and resize
  useEffect(() => {
    const update = () => setPageSize(calcPageSize())
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  // Reset to page 1 when page size changes
  useEffect(() => {
    setPage(1)
  }, [pageSize])

  useEffect(() => {
    fetchExpenses(page, pageSize)
  }, [page, pageSize])

  const fetchExpenses = async (p: number, limit: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/expenses?page=${p}&limit=${limit}`)
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
      <Card className="border-border/50 shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95 mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(pageSize)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95 mt-4 animate-slide-up">
      <CardHeader className="pb-3 space-y-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Recent Expenses</CardTitle>
            <CardDescription className="text-sm mt-0.5">
              {total > 0 ? `${total} total · sorted by date` : "Your latest spending activity"}
            </CardDescription>
          </div>
          {totalPages > 1 && (
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {error ? (
          <DbError message={error} />
        ) : expenses.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <p>No expenses yet. Add your first expense to get started!</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {expenses.map((expense, index) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between px-4 py-3 border border-border/50 rounded-xl bg-secondary/30 hover:bg-secondary/50 hover:shadow-md transition-all duration-200 cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-medium">
                        {expense.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">
                        {formatDistanceToNow(new Date(expense.date), { addSuffix: true })}
                        {expense.description && ` · ${expense.description}`}
                      </span>
                    </div>
                  </div>
                  <p className="text-xl font-bold tracking-tight ml-4 flex-shrink-0">
                    ${Number.parseFloat(expense.amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="gap-1 h-8">
                  <ChevronLeft className="h-3 w-3" />Prev
                </Button>
                <span className="text-xs text-muted-foreground">
                  {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}
                </span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="gap-1 h-8">
                  Next<ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
