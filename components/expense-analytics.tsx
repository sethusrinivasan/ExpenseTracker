"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DbError } from "@/components/db-error"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend,
  AreaChart, Area
} from "recharts"

interface Expense {
  id: number
  amount: string
  category: string
  date: string
}

// Vivid, accessible palette — distinct hues, works in light + dark
const PALETTE = [
  "#6366f1", // indigo
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#f97316", // orange
]

const CATEGORY_ICONS: Record<string, string> = {
  Food: "🍔", Transportation: "🚗", Entertainment: "🎬",
  Utilities: "💡", Healthcare: "🏥", Shopping: "🛍️",
  Education: "📚", Other: "📦",
}

export function ExpenseAnalytics() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { fetchExpenses() }, [])

  const fetchExpenses = async () => {
    try {
      const response = await fetch("/api/expenses?all=true")
      const json = await response.json()
      if (!response.ok) { setError(json.error ?? "Failed to load analytics."); return }
      setExpenses(Array.isArray(json) ? json : [])
    } catch {
      setError("Could not reach the server. Check your network connection.")
    } finally { setIsLoading(false) }
  }

  const getCategoryData = () => {
    const totals: Record<string, number> = {}
    expenses.forEach(e => { totals[e.category] = (totals[e.category] || 0) + Number.parseFloat(e.amount) })
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)), icon: CATEGORY_ICONS[name] ?? "📦" }))
      .sort((a, b) => b.value - a.value)
  }

  const getMonthlyData = () => {
    const totals: Record<string, number> = {}
    expenses.forEach(e => {
      const key = new Date(e.date).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
      totals[key] = (totals[key] || 0) + Number.parseFloat(e.amount)
    })
    return Object.entries(totals)
      .map(([month, total]) => ({ month, total: Number(total.toFixed(2)) }))
      .slice(-6)
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className={`border-border/50 shadow-xl shadow-black/5 ${i === 2 ? "md:col-span-2" : ""}`}>
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent><Skeleton className="h-72 w-full rounded-xl" /></CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return <Card className="border-border/50"><CardContent className="pt-6"><DbError message={error} /></CardContent></Card>
  }

  if (expenses.length === 0) {
    return (
      <Card className="border-border/50 shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95">
        <CardContent className="pt-6">
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-4">📊</p>
            <p className="text-lg font-medium">No data yet</p>
            <p className="text-sm mt-1">Add some expenses to see your analytics</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const categoryData = getCategoryData()
  const monthlyData = getMonthlyData()
  const grandTotal = categoryData.reduce((s, c) => s + c.value, 0)

  // Custom pie label
  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: {
    cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number; name: string
  }) => {
    if (percent < 0.05) return null
    const RADIAN = Math.PI / 180
    const r = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + r * Math.cos(-midAngle * RADIAN)
    const y = cy + r * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">

      {/* Donut chart */}
      <Card className="border-border/50 shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95 animate-scale-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Spending by Category</CardTitle>
          <CardDescription>Where your money goes</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ value: { label: "Amount" } }} className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={renderPieLabel}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [`$${val.toFixed(2)}`, "Amount"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {categoryData.map((c, i) => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                <span className="truncate text-muted-foreground">{c.icon} {c.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Area chart — monthly trend */}
      <Card className="border-border/50 shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95 animate-scale-in" style={{ animationDelay: "100ms" }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Monthly Trend</CardTitle>
          <CardDescription>Spending over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ total: { label: "Total", color: PALETTE[0] } }} className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PALETTE[0]} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={PALETTE[0]} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip
                  formatter={(val: number) => [`$${val.toFixed(2)}`, "Total"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                />
                <Area type="monotone" dataKey="total" stroke={PALETTE[0]} strokeWidth={2.5} fill="url(#areaGrad)" dot={{ fill: PALETTE[0], r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Horizontal bar breakdown */}
      <Card className="md:col-span-2 border-border/50 shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95 animate-slide-up">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Category Breakdown</CardTitle>
          <CardDescription>Ranked by total spend · ${grandTotal.toFixed(2)} overall</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categoryData.map((cat, i) => {
              const pct = (cat.value / grandTotal) * 100
              const color = PALETTE[i % PALETTE.length]
              return (
                <div key={cat.name} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold flex items-center gap-1.5">
                      <span>{cat.icon}</span>{cat.name}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
                      <span className="text-sm font-bold" style={{ color }}>${cat.value.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
