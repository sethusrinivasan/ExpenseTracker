import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { ExpenseList } from "../../components/expense-list"

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => vi.clearAllMocks())

describe("ExpenseList", () => {
  it("shows loading skeletons initially", () => {
    mockFetch.mockReturnValue(new Promise(() => {}))
    render(<ExpenseList />)
    const skeletons = document.querySelectorAll(".animate-pulse")
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("renders expense items", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, amount: "25.50", category: "Food", description: "Lunch", date: "2026-04-01", created_at: "2026-04-01" },
        { id: 2, amount: "12.00", category: "Transportation", description: null, date: "2026-04-02", created_at: "2026-04-02" },
      ],
    })
    render(<ExpenseList />)
    await waitFor(() => expect(screen.getByText("$25.50")).toBeInTheDocument())
    expect(screen.getByText("$12.00")).toBeInTheDocument()
    expect(screen.getByText("Food")).toBeInTheDocument()
    expect(screen.getByText("Transportation")).toBeInTheDocument()
    expect(screen.getByText("Lunch")).toBeInTheDocument()
  })

  it("shows empty state when no expenses", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
    render(<ExpenseList />)
    await waitFor(() => expect(screen.getByText(/no expenses yet/i)).toBeInTheDocument())
  })

  it("shows db error banner when API returns error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Unable to reach the database. Check your DATABASE_URL and network connectivity." }),
    })
    render(<ExpenseList />)
    await waitFor(() => expect(screen.getByText("Database unavailable")).toBeInTheDocument())
    expect(screen.getByText(/DATABASE_URL/i)).toBeInTheDocument()
  })

  it("shows db error banner on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("fetch failed"))
    render(<ExpenseList />)
    await waitFor(() => expect(screen.getByText("Database unavailable")).toBeInTheDocument())
  })
})
