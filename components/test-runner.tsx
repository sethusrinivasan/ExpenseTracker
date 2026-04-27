"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Loader2, FlaskConical, Clock, TrendingUp, TrendingDown, Trash2 } from "lucide-react"
import type { TestResult } from "@/app/api/run-tests/route"

interface Summary { passed: number; failed: number; total: number }

interface RunRecord {
  ts: number
  results: TestResult[]
  summary: Summary
}

const STORAGE_KEY = "expense-tracker-test-history"
const MAX_HISTORY = 10

function loadHistory(): RunRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
  } catch { return [] }
}

function saveRun(run: RunRecord) {
  const history = loadHistory()
  history.unshift(run)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
}

function fmt(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`
}

function DeltaBadge({ current, prev }: { current: number; prev: number | undefined }) {
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

function StatusDelta({ current, prev }: { current: string; prev: string | undefined }) {
  if (!prev || current === prev) return null
  if (current === "pass" && prev === "fail")
    return <span className="text-xs font-semibold text-green-600 dark:text-green-400">↑ fixed</span>
  if (current === "fail" && prev === "pass")
    return <span className="text-xs font-semibold text-destructive">↓ broke</span>
  return null
}

export function TestRunner() {
  const [running, setRunning] = useState(false)
  const [current, setCurrent] = useState<RunRecord | null>(null)
  const [prevRun, setPrevRun] = useState<RunRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const [clearMsg, setClearMsg] = useState<string | null>(null)

  useEffect(() => {
    const history = loadHistory()
    if (history.length > 0) setPrevRun(history[0])
  }, [])

  const runTests = async () => {
    setRunning(true)
    setError(null)

    try {
      const res = await fetch("/api/run-tests")
      if (!res.ok) throw new Error(`Test runner returned ${res.status}`)
      const data = await res.json()
      const run: RunRecord = { ts: Date.now(), results: data.results, summary: data.summary }

      // Save previous before overwriting
      const history = loadHistory()
      if (history.length > 0) setPrevRun(history[0])

      saveRun(run)
      setCurrent(run)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run tests")
    } finally {
      setRunning(false)
    }
  }

  const allPassed = current && current.summary.failed === 0

  // Build prev result lookup by test name
  const prevByName = Object.fromEntries(
    (prevRun?.results ?? []).map((r) => [r.name, r])
  )

  // Summary-level deltas
  const prevTotal = prevRun ? prevRun.results.reduce((s, r) => s + r.duration, 0) : undefined
  const currTotal = current ? current.results.reduce((s, r) => s + r.duration, 0) : undefined

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Card className="border-border/50 shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <FlaskConical className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Integration Tests</CardTitle>
                <CardDescription className="text-base mt-1">
                  Runs live tests against the app and database
                </CardDescription>
              </div>
            </div>
            {prevRun && !current && (
              <span className="text-xs text-muted-foreground">
                Last run {new Date(prevRun.ts).toLocaleTimeString()} — {prevRun.summary.passed}/{prevRun.summary.total} passed
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Button
            onClick={runTests}
            disabled={running}
            className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
          >
            {running ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Running tests...</>
            ) : (
              <><FlaskConical className="mr-2 h-5 w-5" />Run Tests</>
            )}
          </Button>

          {error && (
            <div className="flex gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-destructive">
              <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {current && (
            <div className={`flex items-center justify-between rounded-2xl p-4 border ${
              allPassed
                ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
                : "bg-destructive/10 border-destructive/30 text-destructive"
            }`}>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {allPassed ? "All tests passed" : `${current.summary.failed} test${current.summary.failed > 1 ? "s" : ""} failed`}
                </span>
                {prevRun && current.summary.passed !== prevRun.summary.passed && (
                  <span className="text-xs opacity-70">
                    (was {prevRun.summary.passed}/{prevRun.summary.total})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>{current.summary.passed} / {current.summary.total}</span>
                {currTotal !== undefined && prevTotal !== undefined && (
                  <span className="text-xs opacity-70 flex items-center gap-1">
                    <Clock className="h-3 w-3" />{fmt(currTotal)}
                    <DeltaBadge current={currTotal} prev={prevTotal} />
                  </span>
                )}
              </div>
            </div>
          )}

          {current && current.results.length > 0 && (
            <div className="space-y-2">
              {current.results.map((result, i) => {
                const prev = prevByName[result.name]
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 rounded-2xl border border-border/50 bg-secondary/20 animate-fade-in"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    {result.status === "pass"
                      ? <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      : <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    }

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{result.name}</p>
                      {result.status === "fail" && (
                        <p className="text-xs text-destructive mt-1 break-words">{result.message}</p>
                      )}
                    </div>

                    {/* Inline history: time + delta + status change */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {fmt(result.duration)}
                      </div>
                      <DeltaBadge current={result.duration} prev={prev?.duration} />
                      <StatusDelta current={result.status} prev={prev?.status} />
                      <Badge
                        variant={result.status === "pass" ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        {result.status}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
