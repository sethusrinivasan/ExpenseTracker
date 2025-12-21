import { AddExpenseDialog } from "@/components/add-expense-dialog"
import { ExpenseList } from "@/components/expense-list"
import { UserNav } from "@/components/user-nav"
import { Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

function ExpenseListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="py-6">
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function ExpensesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">My Expenses</h1>
          </div>
          <div className="flex items-center gap-4">
            <AddExpenseDialog />
            <UserNav />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <Suspense fallback={<ExpenseListSkeleton />}>
          <ExpenseList />
        </Suspense>
      </main>
    </div>
  )
}
