import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { ExpenseAnalytics } from "../../components/expense-analytics"

const mockFetch = vi.fn()
global.fetch = mockFetch

// recharts uses ResizeObserver — stub it for jsdom
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => vi.clearAllMocks())

describe("ExpenseAnalytics", () => {
  it("shows loading skeletons initially", () => {
    mockFetch.mockReturnValue(new Promise(() => {}))
    render(<ExpenseAnalytics />)
    const skeletons = document.querySelectorAll(".animate-pulse")
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("shows empty state when no expenses", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
    render(<ExpenseAnalytics />)
    await waitFor(() => expect(screen.getByText(/no data available/i)).toBeInTheDocument())
  })

  it("renders category breakdown with expense data", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, amount: "50.00", category: "Food", date: "2026-04-01" },
        { id: 2, amount: "30.00", category: "Food", date: "2026-04-02" },
        { id: 3, amount: "20.00", category: "Transportation", date: "2026-04-03" },
      ],
    })
    render(<ExpenseAnalytics />)
    await waitFor(() => expect(screen.getByText("Category Breakdown")).toBeInTheDocument())
    expect(screen.getByText("$80.00")).toBeInTheDocument() // Food total
    expect(screen.getByText("$20.00")).toBeInTheDocument() // Transportation total
  })

  it("shows db error banner when API returns error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "DATABASE_URL is not configured. Set it in your environment variables." }),
    })
    render(<ExpenseAnalytics />)
    await waitFor(() => expect(screen.getByText("Database unavailable")).toBeInTheDocument())
    expect(screen.getByText(/DATABASE_URL/i)).toBeInTheDocument()
  })

  it("shows db error banner on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("fetch failed"))
    render(<ExpenseAnalytics />)
    await waitFor(() => expect(screen.getByText("Database unavailable")).toBeInTheDocument())
  })
})
