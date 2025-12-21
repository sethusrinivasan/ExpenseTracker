import { getSession } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserNav } from "@/components/user-nav"
import { getExpensesByUserId, getExpenseSummaryByCategory } from "@/lib/expenses"
import { DollarSign, List, PieChart, Plus } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const expenses = await getExpensesByUserId(session.user.id)
  const summary = await getExpenseSummaryByCategory(session.user.id)

  const totalExpenses = expenses.reduce((sum, expense) => sum + Number.parseFloat(expense.amount), 0)
  const expenseCount = expenses.length

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <UserNav />
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Welcome back, {session.user.name?.split(" ")[0] || "User"}!</h2>
          <p className="text-muted-foreground mt-1">Here's an overview of your expenses</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <List className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expenseCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Recorded expenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active categories</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your expenses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full justify-start">
                <Link href="/expenses">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Expense
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                <Link href="/expenses">
                  <List className="mr-2 h-4 w-4" />
                  View All Expenses
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>Your top expense categories</CardDescription>
            </CardHeader>
            <CardContent>
              {summary.length === 0 ? (
                <p className="text-sm text-muted-foreground">No expenses recorded yet</p>
              ) : (
                <div className="space-y-4">
                  {summary.slice(0, 5).map((item: any) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.category}</span>
                        <span className="text-xs text-muted-foreground">{item.count} transactions</span>
                      </div>
                      <span className="text-sm font-bold">${Number.parseFloat(item.total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
