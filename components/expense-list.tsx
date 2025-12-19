"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { deleteExpense } from "@/actions/expenses"
import { useToast } from "@/hooks/use-toast"
import type { Expense } from "@/lib/types"

interface ExpenseListProps {
  expenses: Expense[]
}

export function ExpenseList({ expenses }: ExpenseListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const { toast } = useToast()

  async function handleDelete(id: number) {
    setDeletingId(id)
    const result = await deleteExpense(id)

    if (result.success) {
      toast({
        title: "Expense deleted",
        description: "The expense has been removed.",
      })
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete expense",
        variant: "destructive",
      })
    }

    setDeletingId(null)
  }

  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Expenses</CardTitle>
        <CardDescription>
          Total: <span className="font-bold text-lg">${total.toFixed(2)}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No expenses recorded yet. Add your first expense above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="whitespace-nowrap">{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{expense.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">${Number(expense.amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(expense.id)}
                        disabled={deletingId === expense.id}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete expense</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
