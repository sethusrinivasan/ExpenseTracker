import { getUserExpenses } from "@/app/actions/expense-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { Calendar, DollarSign } from "lucide-react"
import { ExpenseActions } from "./expense-actions"

export async function ExpenseList() {
  const { expenses, error } = await getUserExpenses()

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">{error}</CardContent>
      </Card>
    )
  }

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No expenses yet. Start by adding your first expense!
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {expenses.map((expense) => (
        <Card key={expense.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{expense.category}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-xs">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(expense.date), "MMM dd, yyyy")}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-2xl font-bold">
                    <DollarSign className="h-5 w-5" />
                    {Number.parseFloat(expense.amount).toFixed(2)}
                  </div>
                </div>
                <ExpenseActions expense={expense} />
              </div>
            </div>
          </CardHeader>
          {expense.description && (
            <CardContent>
              <p className="text-sm text-muted-foreground">{expense.description}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}
