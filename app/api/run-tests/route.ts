import { type NextRequest, NextResponse } from "next/server"

export interface TestResult {
  name: string
  status: "pass" | "fail"
  message: string
  duration: number
}

export interface IntegrationResponse {
  results: TestResult[]
  summary: { passed: number; failed: number; total: number }
}

export async function runTest(name: string, fn: () => Promise<void>): Promise<TestResult> {
  const start = Date.now()
  try {
    await fn()
    return { name, status: "pass", message: "OK", duration: Date.now() - start }
  } catch (err) {
    return { name, status: "fail", message: err instanceof Error ? err.message : String(err), duration: Date.now() - start }
  }
}

export function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

export const CATEGORIES = ["Food", "Transportation", "Entertainment", "Utilities", "Healthcare", "Shopping", "Education", "Other"]
export const today = () => new Date().toISOString().split("T")[0]

// Normalise API response — handles both plain array and paginated { data, ... }
function toArray(json: unknown): unknown[] {
  if (Array.isArray(json)) return json
  if (json && typeof json === "object" && "data" in json && Array.isArray((json as { data: unknown }).data))
    return (json as { data: unknown[] }).data
  return []
}

export async function GET(request: NextRequest) {
  const base = new URL(request.url).origin
  const results: TestResult[] = []
  let createdId: number | null = null

  // Use ?all=true so we always get a plain array back
  const listUrl = `${base}/api/expenses?all=true`

  results.push(await runTest("Database is reachable", async () => {
    const res = await fetch(listUrl)
    assert(res.ok, `GET /api/expenses returned ${res.status}`)
  }))

  results.push(await runTest("GET /api/expenses returns an array", async () => {
    const res = await fetch(listUrl)
    const json = await res.json()
    const data = toArray(json)
    assert(Array.isArray(data), `Expected array, got ${typeof json}`)
  }))

  results.push(await runTest("POST creates a new expense", async () => {
    const res = await fetch(`${base}/api/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: "9.99", category: "Other", description: "Test expense", date: today() }),
    })
    assert(res.status === 201, `Expected 201, got ${res.status}`)
    const data = await res.json()
    assert(typeof data.id === "number", "Missing numeric id")
    assert(data.amount === "9.99", `Wrong amount: ${data.amount}`)
    createdId = data.id
  }))

  results.push(await runTest("Created expense appears in GET list", async () => {
    assert(createdId !== null, "Previous test did not create an expense")
    const res = await fetch(listUrl)
    const json = await res.json()
    const data = toArray(json)
    const found = data.find((e) => (e as { id: number }).id === createdId)
    assert(found !== undefined, `id=${createdId} not found in list`)
  }))

  results.push(await runTest("POST returns 500 on missing amount", async () => {
    const res = await fetch(`${base}/api/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "Food", date: today() }),
    })
    assert(res.status === 500, `Expected 500, got ${res.status}`)
  }))

  results.push(await runTest("Expense objects have required fields", async () => {
    const res = await fetch(listUrl)
    const data = toArray(await res.json())
    if (!data.length) return
    for (const field of ["id", "amount", "category", "date"])
      assert(field in (data[0] as object), `Missing field: ${field}`)
  }))

  results.push(await runTest("Expense amounts are valid numbers", async () => {
    const data = toArray(await (await fetch(listUrl)).json())
    for (const e of data as { amount: string }[]) {
      const n = parseFloat(e.amount)
      assert(!isNaN(n) && n >= 0, `Invalid amount: ${e.amount}`)
    }
  }))

  results.push(await runTest("Expense dates are valid ISO strings", async () => {
    const data = toArray(await (await fetch(listUrl)).json())
    for (const e of data as { date: string }[])
      assert(!isNaN(new Date(e.date).getTime()), `Invalid date: ${e.date}`)
  }))

  results.push(await runTest("Expense categories are valid", async () => {
    const valid = new Set(CATEGORIES)
    const data = toArray(await (await fetch(listUrl)).json())
    for (const e of data as { category: string }[])
      assert(valid.has(e.category), `Unknown category: ${e.category}`)
  }))

  results.push(await runTest("API returns application/json content-type", async () => {
    const res = await fetch(listUrl)
    const ct = res.headers.get("content-type") ?? ""
    assert(ct.includes("application/json"), `Wrong content-type: ${ct}`)
  }))

  const passed = results.filter(r => r.status === "pass").length
  const failed = results.filter(r => r.status === "fail").length
  return NextResponse.json({ results, summary: { passed, failed, total: results.length } } satisfies IntegrationResponse)
}
