import { getExpenses } from "@/actions/expenses"
import { ExpenseForm } from "@/components/expense-form"
import { ExpenseList } from "@/components/expense-list"
import { LocationScenery } from "@/components/location-scenery"

export default async function Home() {
  const expenses = await getExpenses()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Expense Tracker</h1>
          <p className="text-muted-foreground">Track your daily expenses and manage your budget</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ExpenseForm />
          </div>
          <div className="lg:col-span-2">
            <ExpenseList expenses={expenses} />
          </div>
        </div>

        <div className="mt-8">
          <LocationScenery />
        </div>
      </div>
    </div>
  )
}
