import { type NextRequest, NextResponse } from "next/server"
import { CATEGORIES, today } from "@/app/api/run-tests/route"

export interface PerfMetrics {
  ops: number
  writes: number
  reads: number
  totalMs: number
  opsPerSec: number
  p50: number
  p95: number
  p99: number
  errorRate: number
  amountBreakdown: { micro: number; small: number; medium: number; large: number }
}

export interface StressResponse {
  perf: PerfMetrics
}

function percentile(sorted: number[], p: number) {
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

// Realistic transaction amount mix:
// micro  (coffee/snack):        $1–$15      — 30%
// small  (meal/transit):        $15–$60     — 35%
// medium (grocery/bill):        $60–$200    — 25%
// large  (electronics/rent):    $200–$2000  — 10%
function randAmount(): { amount: string; tier: "micro" | "small" | "medium" | "large" } {
  const r = Math.random()
  if (r < 0.30) return { amount: (1 + Math.random() * 14).toFixed(2), tier: "micro" }
  if (r < 0.65) return { amount: (15 + Math.random() * 45).toFixed(2), tier: "small" }
  if (r < 0.90) return { amount: (60 + Math.random() * 140).toFixed(2), tier: "medium" }
  return { amount: (200 + Math.random() * 1800).toFixed(2), tier: "large" }
}

export async function GET(request: NextRequest) {
  const base = new URL(request.url).origin
  const params = new URL(request.url).searchParams
  const OPS = Math.min(1000, Math.max(10, parseInt(params.get("ops") ?? "10", 10)))
  const WRITE_RATIO = 0.4
  const CONCURRENCY = Math.min(20, OPS)

  const latencies: number[] = []
  let errors = 0, writes = 0, reads = 0
  const amountBreakdown = { micro: 0, small: 0, medium: 0, large: 0 }

  const perfStart = Date.now()

  const tasks: Array<() => Promise<void>> = []
  for (let i = 0; i < OPS; i++) {
    const isWrite = Math.random() < WRITE_RATIO
    tasks.push(async () => {
      const t = Date.now()
      try {
        if (isWrite) {
          const { amount, tier } = randAmount()
          amountBreakdown[tier]++
          const res = await fetch(`${base}/api/expenses`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount,
              category: rand(CATEGORIES),
              description: `stress-${i}-${tier}`,
              date: today(),
            }),
          })
          if (!res.ok) errors++
          else writes++
        } else {
          const res = await fetch(`${base}/api/expenses`)
          if (!res.ok) errors++
          else reads++
        }
      } catch { errors++ }
      latencies.push(Date.now() - t)
    })
  }

  for (let i = 0; i < tasks.length; i += CONCURRENCY)
    await Promise.all(tasks.slice(i, i + CONCURRENCY).map(t => t()))

  const totalMs = Date.now() - perfStart
  latencies.sort((a, b) => a - b)

  const perf: PerfMetrics = {
    ops: OPS,
    writes,
    reads,
    totalMs,
    opsPerSec: Math.round((OPS / totalMs) * 1000),
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    p99: percentile(latencies, 99),
    errorRate: parseFloat(((errors / OPS) * 100).toFixed(2)),
    amountBreakdown,
  }

  return NextResponse.json({ perf } satisfies StressResponse)
}
