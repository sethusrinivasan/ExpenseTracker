import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Mock the shared db helper — works for both local pg and Neon prod
const mockDbQuery = vi.fn()
vi.mock("@/lib/db", () => ({
  dbQuery: (...args: unknown[]) => mockDbQuery(...args),
  dbErrorMessage: (error: unknown) => {
    if (!(error instanceof Error)) return "An unexpected database error occurred."
    const msg = error.message
    if (msg.includes("DATABASE_URL")) return msg
    if (msg.includes("ECONNREFUSED") || msg.includes("fetch failed")) return "Unable to reach the database. Check your DATABASE_URL and network connectivity."
    if (msg.includes("password") || msg.includes("authentication")) return "Database authentication failed. Check your credentials."
    if (msg.includes("does not exist") || msg.includes("relation")) return "Database table not found. Run the migration script to set up the schema."
    return msg
  },
}))

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "demo-user" } }),
}))

const { GET, POST } = await import("../../app/api/expenses/route")

beforeEach(() => vi.clearAllMocks())

describe("GET /api/expenses", () => {
  it("returns expenses as JSON with status 200", async () => {
    const expenses = [
      { id: 1, amount: "25.00", category: "Food", description: "Lunch", date: "2026-04-01", user_id: "demo-user" },
    ]
    mockDbQuery.mockResolvedValueOnce(expenses)

    const res = await GET(new NextRequest("http://localhost/api/expenses"))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(expenses)
  })

  it("returns empty array when no expenses exist", async () => {
    mockDbQuery.mockResolvedValueOnce([])
    const res = await GET(new NextRequest("http://localhost/api/expenses"))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it("returns 500 with DATABASE_URL error message", async () => {
    mockDbQuery.mockRejectedValueOnce(new Error("DATABASE_URL is not configured."))
    const res = await GET(new NextRequest("http://localhost/api/expenses"))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/DATABASE_URL/i)
  })

  it("returns 500 with connection error message when db unreachable", async () => {
    mockDbQuery.mockRejectedValueOnce(new Error("ECONNREFUSED"))
    const res = await GET(new NextRequest("http://localhost/api/expenses"))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/reach the database/i)
  })

  it("returns 500 with migration hint when table missing", async () => {
    mockDbQuery.mockRejectedValueOnce(new Error("relation \"expenses\" does not exist"))
    const res = await GET(new NextRequest("http://localhost/api/expenses"))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/migration/i)
  })

  it("returns application/json content-type", async () => {
    mockDbQuery.mockResolvedValueOnce([])
    const res = await GET(new NextRequest("http://localhost/api/expenses"))
    expect(res.headers.get("content-type")).toMatch(/application\/json/)
  })
})

describe("POST /api/expenses", () => {
  it("creates an expense and returns 201", async () => {
    const created = { id: 1, amount: "42.50", category: "Food", description: "Dinner", date: "2026-04-01" }
    mockDbQuery.mockResolvedValueOnce([created])

    const res = await POST(new NextRequest("http://localhost/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: "42.50", category: "Food", description: "Dinner", date: "2026-04-01" }),
    }))

    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(created)
  })

  it("stores null description when omitted", async () => {
    const created = { id: 2, amount: "10.00", category: "Transportation", description: null, date: "2026-04-01" }
    mockDbQuery.mockResolvedValueOnce([created])

    const res = await POST(new NextRequest("http://localhost/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: "10.00", category: "Transportation", date: "2026-04-01" }),
    }))

    expect(res.status).toBe(201)
    expect((await res.json()).description).toBeNull()
  })

  it("returns 500 when db insert fails", async () => {
    mockDbQuery.mockRejectedValueOnce(new Error("insert failed"))
    const res = await POST(new NextRequest("http://localhost/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: "10.00", category: "Food", date: "2026-04-01" }),
    }))
    expect(res.status).toBe(500)
  })

  it("returns 500 with auth error on bad credentials", async () => {
    mockDbQuery.mockRejectedValueOnce(new Error("password authentication failed"))
    const res = await POST(new NextRequest("http://localhost/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: "5.00", category: "Food", date: "2026-04-01" }),
    }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/authentication/i)
  })
})
