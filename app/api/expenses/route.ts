import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, category, description, date } = body

    const userId = "demo-user"

    const result = await sql`
      INSERT INTO expenses (user_id, amount, category, description, date)
      VALUES (${userId}, ${amount}, ${category}, ${description || null}, ${date})
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating expense:", error)
    console.error("[v0] Error details:", error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // For now, using a hardcoded user_id - in production, get from auth session
    const userId = "demo-user"

    const expenses = await sql`
      SELECT * FROM expenses
      WHERE user_id = ${userId}
      ORDER BY date DESC, created_at DESC
      LIMIT 100
    `

    return NextResponse.json(expenses)
  } catch (error) {
    console.error("[v0] Error fetching expenses:", error)
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 })
  }
}
