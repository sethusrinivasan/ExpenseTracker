import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { ExpenseSummary } from "../../components/expense-summary"

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  vi.clearAllMocks()
})

describe("ExpenseSummary", () => {
  it("shows loading skeletons initially", () => {
    mockFetch.mockReturnValue(new Promise(() => {})) // never resolves
    render(<ExpenseSummary />)
    // skeletons render as divs with animate-pulse
    const skeletons = document.querySelectorAll(".animate-pulse")
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("renders total, month, and average correctly", async () => {
    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-15`
    const lastYear = `${now.getFullYear() - 1}-01-10`

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { amount: "100.00", date: thisMonth },
        { amount: "50.00", date: thisMonth },
        { amount: "200.00", date: lastYear },
      ],
    })

    render(<ExpenseSummary />)

    await waitFor(() => expect(screen.getByText("$350.00")).toBeInTheDocument()) // total
    expect(screen.getByText("$150.00")).toBeInTheDocument() // this month
    expect(screen.getByText("$116.67")).toBeInTheDocument() // average
  })

  it("shows $0.00 when no expenses", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
    render(<ExpenseSummary />)
    await waitFor(() => {
      const zeros = screen.getAllByText("$0.00")
      expect(zeros.length).toBe(3)
    })
  })

  it("shows db error banner when API returns error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Database table not found. Run the migration script to set up the schema." }),
    })
    render(<ExpenseSummary />)
    await waitFor(() => expect(screen.getByText("Database unavailable")).toBeInTheDocument())
    expect(screen.getByText(/migration script/i)).toBeInTheDocument()
  })

  it("shows db error banner on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"))
    render(<ExpenseSummary />)
    await waitFor(() => expect(screen.getByText("Database unavailable")).toBeInTheDocument())
    expect(screen.getByText(/network connection/i)).toBeInTheDocument()
  })
})
