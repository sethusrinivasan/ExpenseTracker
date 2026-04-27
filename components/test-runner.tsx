"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Loader2, FlaskConical, Clock, TrendingUp, TrendingDown, Trash2, Zap } from "lucide-react"
import type { TestResult } from "@/app/api/run-tests/route"
import type { PerfMetrics } from "@/app/api/stress-test/route"

interface Summary { passed: number; failed: number; total: number }
interface RunRecord { ts: number; results: TestResult[]; summary: Summary }

const STORAGE_KEY = "expense-tracker-test-history"
const MAX_HISTORY = 10
const MAX_STRESS_RUNS = 10

function loadHistory(): RunRecord[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") } catch { return [] }
}
function saveRun(run: RunRecord) {
  const h = loadHistory(); h.unshift(run)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(h.slice(0, MAX_HISTORY)))
}
function fmt(ms: number) { return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms` }

function DeltaBadge({ current, prev }: { current: number; prev?: number }) {
  if (prev === undefined) return null
  const diff = current - prev
  if (Math.abs(diff) < 5) return <span className="text-xs text-muted-foreground">~same</span>
  const faster = diff < 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${faster ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
      {faster ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
      {faster ? "" : "+"}{fmt(diff)}
    </span>
  )
}

function StatusDelta({ current, prev }: { current: string; prev?: string }) {
  if (!prev || current === prev) return null
  if (current === "pass" && prev === "fail") return <span className="text-xs font-semibold text-green-600 dark:text-green-400">↑ fixed</span>
  if (current === "fail" && prev === "pass") return <span className="text-xs font-semibold text-destructive">↓ broke</span>
  return null
}

function Sparkline({ values, color = "#6366f1", height = 36 }: { values: number[]; color?: string; height?: number }) {
  if (values.length < 2) return <div style={{ width: 120, height }} />
  const w = 120
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = height - ((v - min) / range) * (height - 6) - 3
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(" ")
  const last = values[values.length - 1]
  const lx = w
  const ly = height - ((last - min) / range) * (height - 6) - 3
  return (
    <svg width={w} height={height} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.7" />
      <circle cx={lx} cy={ly} r="3" fill={color} />
    </svg>
  )
}

interface MetricRow { label: string; key: keyof PerfMetrics; fmt: (v: number) => string; color: string; lowerIsBetter: boolean }
const METRIC_ROWS: MetricRow[] = [
  { label: "Ops/sec",     key: "opsPerSec", fmt: v => String(v),  color: "#6366f1", lowerIsBetter: false },
  { label: "p50 latency", key: "p50",       fmt: v => `${v}ms`,   color: "#22c55e", lowerIsBetter: true  },
  { label: "p95 latency", key: "p95",       fmt: v => `${v}ms`,   color: "#f59e0b", lowerIsBetter: true  },
  { label: "p99 latency", key: "p99",       fmt: v => `${v}ms`,   color: "#ef4444", lowerIsBetter: true  },
  { label: "Error rate",  key: "errorRate", fmt: v => `${v}%`,    color: "#ec4899", lowerIsBetter: true  },
  { label: "Total time",  key: "totalMs",   fmt: v => fmt(v),     color: "#8b5cf6", lowerIsBetter: true  },
]

export function TestRunner() {
  const [running, setRunning] = useState(false)
  const [current, setCurrent] = useState<RunRecord | null>(null)
  const [prevRun, setPrevRun] = useState<RunRecord | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [stressOps, setStressOps] = useState(10)
  const [stressRunning, setStressRunning] = useState(false)
  const [stressRuns, setStressRuns] = useState<PerfMetrics[]>([])
  const [stressError, setStressError] = useState<string | null>(null)

  const [clearing, setClearing] = useState(false)
  const [clearMsg, setClearMsg] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    const h = loadHistory()
    if (h.length > 0) setPrevRun(h[0])
  }, [])

  const runTests = async () => {
    setRunning(true); setError(null)
    try {
      const res = await fetch("/api/run-tests")
      if (!res.ok) throw new Error(`Test runner returned ${res.status}`)
      const data = await res.json()
      const run: RunRecord = { ts: Date.now(), results: data.results, summary: data.summary }
      const h = loadHistory()
      if (h.length > 0) setPrevRun(h[0])
      saveRun(run); setCurrent(run)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run tests")
    } finally { setRunning(false) }
  }

  const runStress = async () => {
    setStressRunning(true); setStressError(null)
    try {
      const res = await fetch(`/api/stress-test?ops=${stressOps}`)
      if (!res.ok) throw new Error(`Stress test returned ${res.status}`)
      const data = await res.json()
      setStressRuns(prev => [...prev.slice(-(MAX_STRESS_RUNS - 1)), data.perf])
    } catch (err) {
      setStressError(err instanceof Error ? err.message : "Stress test failed")
    } finally { setStressRunning(false) }
  }

  const clearTestData = async () => {
    setClearing(true); setClearMsg(null)
    try {
      const res = await fetch("/api/clear-test-data", { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to clear")
      setClearMsg({ text: `Deleted ${data.deleted} test record${data.deleted !== 1 ? "s" : ""}`, ok: true })
    } catch (err) {
      setClearMsg({ text: err instanceof Error ? err.message : "Failed to clear test data", ok: false })
    } finally { setClearing(false) }
  }

  const allPassed = current && current.summary.failed === 0
  const prevByName = Object.fromEntries((prevRun?.results ?? []).map(r => [r.name, r]))
  const prevTotal = prevRun ? prevRun.results.reduce((s, r) => s + r.duration, 0) : undefined
  const currTotal = current ? current.results.reduce((s, r) => s + r.duration, 0) : undefined
  const latestStress = stressRuns[stressRuns.length - 1] ?? null
  const prevStress = stressRuns[stressRuns.length - 2] ?? null

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">

      {/* Integration Tests */}
      <Card className="border-border/50 shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <FlaskConical className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Integration Tests</CardTitle>
                <CardDescription className="text-base mt-1">Live tests against the app and database</CardDescription>
              </div>
            </div>
            {prevRun && !current && (
              <span className="text-xs text-muted-foreground">
                Last: {new Date(prevRun.ts).toLocaleTimeString()} — {prevRun.summary.passed}/{prevRun.summary.total} passed
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <Button onClick={runTests} disabled={running}
            className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
            {running ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Running tests...</> : <><FlaskConical className="mr-2 h-5 w-5" />Run Integration Tests</>}
          </Button>

          {error && (
            <div className="flex gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-destructive">
              <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" /><p className="text-sm">{error}</p>
            </div>
          )}

          {current && (
            <div className={`rounded-2xl p-4 border ${allPassed ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400" : "bg-destructive/10 border-destructive/30 text-destructive"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    {allPassed ? "All tests passed" : `${current.summary.failed} test${current.summary.failed > 1 ? "s" : ""} failed`}
                  </span>
                  {prevRun && current.summary.passed !== prevRun.summary.passed && (
                    <span className="text-xs opacity-70">(was {prevRun.summary.passed}/{prevRun.summary.total})</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>{current.summary.passed} / {current.summary.total}</span>
                  {currTotal !== undefined && (
                    <span className="text-xs opacity-70 flex items-center gap-1">
                      <Clock className="h-3 w-3" />{fmt(currTotal)}
                      <DeltaBadge current={currTotal} prev={prevTotal} />
                    </span>
                  )}
                </div>
              </div>
              {allPassed && (
                <p className="text-xs mt-1 opacity-60">
                  at {new Date(current.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} on {new Date(current.ts).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {current && current.results.length > 0 && (
            <div className="space-y-2">
              {current.results.map((result, i) => {
                const prev = prevByName[result.name]
                return (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-2xl border border-border/50 bg-secondary/20 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                    {result.status === "pass"
                      ? <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      : <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{result.name}</p>
                      {result.status === "fail" && <p className="text-xs text-destructive mt-1 break-words">{result.message}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />{fmt(result.duration)}
                      </span>
                      <DeltaBadge current={result.duration} prev={prev?.duration} />
                      <StatusDelta current={result.status} prev={prev?.status} />
                      <Badge variant={result.status === "pass" ? "secondary" : "destructive"} className="text-xs">{result.status}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scale Test */}
      <Card className="border-border/50 shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl"><Zap className="h-5 w-5 text-amber-500" /></div>
            <div>
              <CardTitle className="text-2xl">Scale Test</CardTitle>
              <CardDescription className="text-base mt-1">
                Mixed read/write load · run multiple times to see trends
                {stressRuns.length > 0 && <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">{stressRuns.length} run{stressRuns.length > 1 ? "s" : ""} this session</span>}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Transactions</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{stressOps}</span>
            </div>
            <input type="range" min={10} max={1000} step={10} value={stressOps}
              onChange={e => setStressOps(Number(e.target.value))} disabled={stressRunning}
              className="w-full accent-amber-500" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10</span><span>250</span><span>500</span><span>750</span><span>1000</span>
            </div>
          </div>

          <Button onClick={runStress} disabled={stressRunning} variant="outline"
            className="w-full h-12 text-base font-semibold border-amber-500/40 text-amber-600 hover:bg-amber-500/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
            {stressRunning
              ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Running {stressOps} transactions...</>
              : <><Zap className="mr-2 h-5 w-5" />Run Scale Test ({stressOps} ops)</>}
          </Button>

          {stressError && (
            <div className="flex gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-destructive">
              <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" /><p className="text-sm">{stressError}</p>
            </div>
          )}

          {latestStress && (
            <div className="space-y-2">
              {METRIC_ROWS.map(({ label, key, fmt: fmtVal, color, lowerIsBetter }) => {
                const history = stressRuns.map(r => r[key] as number)
                const latest = latestStress[key] as number
                const prev = prevStress ? prevStress[key] as number : undefined
                const diff = prev !== undefined ? latest - prev : 0
                const improved = lowerIsBetter ? diff < 0 : diff > 0
                const worsened = lowerIsBetter ? diff > 0 : diff < 0
                return (
                  <div key={key} className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border/50 bg-secondary/20">
                    <div className="w-28 flex-shrink-0">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-lg font-bold tracking-tight">{fmtVal(latest)}</p>
                      {prev !== undefined && Math.abs(diff) > 0 && (
                        <p className={`text-xs font-medium ${improved ? "text-green-600 dark:text-green-400" : worsened ? "text-red-500" : "text-muted-foreground"}`}>
                          {improved ? "▲" : "▼"} {Math.abs(diff) < 1 ? Math.abs(diff).toFixed(2) : Math.round(Math.abs(diff))}{key === "errorRate" ? "%" : key === "opsPerSec" ? "" : "ms"}
                        </p>
                      )}
                    </div>
                    <div className="flex-1 flex items-center justify-end">
                      <Sparkline values={history} color={color} height={36} />
                    </div>
                  </div>
                )
              })}

              <div className="px-4 py-3 rounded-2xl border border-border/50 bg-secondary/20">
                <p className="text-xs text-muted-foreground mb-2">Amount mix (latest run)</p>
                <div className="flex h-4 rounded-full overflow-hidden">
                  {[
                    { label: "micro", val: latestStress.amountBreakdown.micro, color: "#6366f1" },
                    { label: "small", val: latestStress.amountBreakdown.small, color: "#22c55e" },
                    { label: "medium", val: latestStress.amountBreakdown.medium, color: "#f59e0b" },
                    { label: "large", val: latestStress.amountBreakdown.large, color: "#ef4444" },
                  ].map(({ label, val, color }) => {
                    const pct = (val / (latestStress.writes || 1)) * 100
                    return pct > 0 ? <div key={label} style={{ width: `${pct}%`, backgroundColor: color }} title={`${label}: ${val}`} /> : null
                  })}
                </div>
                <div className="flex gap-3 mt-1.5 flex-wrap">
                  {[
                    { label: "micro $1–15", val: latestStress.amountBreakdown.micro, color: "#6366f1" },
                    { label: "small $15–60", val: latestStress.amountBreakdown.small, color: "#22c55e" },
                    { label: "medium $60–200", val: latestStress.amountBreakdown.medium, color: "#f59e0b" },
                    { label: "large $200+", val: latestStress.amountBreakdown.large, color: "#ef4444" },
                  ].map(({ label, val, color }) => (
                    <span key={label} className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />{label}: {val}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clear Test Data */}
      <Card className="border-border/50 shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-destructive/10 rounded-xl"><Trash2 className="h-5 w-5 text-destructive" /></div>
            <div>
              <CardTitle className="text-xl">Clean Up</CardTitle>
              <CardDescription className="mt-1">Remove all test and stress data from the database</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={clearTestData} disabled={clearing} variant="outline"
            className="w-full h-11 border-destructive/40 text-destructive hover:bg-destructive/10 transition-all duration-200">
            {clearing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Clearing...</> : <><Trash2 className="mr-2 h-4 w-4" />Clear Test Data</>}
          </Button>
          {clearMsg && (
            <p className={`text-sm text-center font-medium ${clearMsg.ok ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
              {clearMsg.ok ? "✓" : "✗"} {clearMsg.text}
            </p>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
