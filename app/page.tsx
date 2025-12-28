"use client"

import { useState } from "react"
import { ExpenseForm } from "@/components/expense-form"
import { ExpenseList } from "@/components/expense-list"
import { ExpenseSummary } from "@/components/expense-summary"
import { ExpenseAnalytics } from "@/components/expense-analytics"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet } from "lucide-react"

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleExpenseAdded = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg shadow-primary/20">
              <Wallet className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-balance">Expenses</h1>
          </div>
          <p className="text-muted-foreground text-lg ml-[4.25rem]">Track your spending with ease</p>
        </header>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-3 h-12 p-1 bg-secondary/50 backdrop-blur-xl border border-border/50 shadow-sm">
            <TabsTrigger
              value="overview"
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-md transition-all duration-300 ease-out"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="add"
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-md transition-all duration-300 ease-out"
            >
              Add Expense
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-md transition-all duration-300 ease-out"
            >
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 animate-fade-in">
            <ExpenseSummary key={`summary-${refreshKey}`} />
            <ExpenseList key={`list-${refreshKey}`} />
          </TabsContent>

          <TabsContent value="add" className="animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <ExpenseForm onExpenseAdded={handleExpenseAdded} />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="animate-fade-in">
            <ExpenseAnalytics key={`analytics-${refreshKey}`} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
