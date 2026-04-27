import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { dbQuery, dbErrorMessage } from "@/lib/db"

async function getUserId(): Promise<string> {
  try {
    const session = await auth()
    return session?.user?.id ?? "demo-user"
  } catch {
    return "demo-user"
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    const { searchParams } = new URL(request.url)

    // Summary and analytics need all records for accurate calculations
    if (searchParams.get("all") === "true") {
      const rows = await dbQuery(
        `SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC, created_at DESC`,
        [userId]
      )
      return NextResponse.json(rows)
    }

    // List view: paginated, 50 per page, sorted desc
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
    const limit = 50
    const offset = (page - 1) * limit

    const rows = await dbQuery(
      `SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC, created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    )
    const countRows = await dbQuery(
      `SELECT COUNT(*) as total FROM expenses WHERE user_id = $1`,
      [userId]
    )
    const total = parseInt(String(countRows[0]?.total ?? "0"), 10)
    return NextResponse.json({ data: rows, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (error) {
    console.error("[expenses] GET error:", error)
    return NextResponse.json({ error: dbErrorMessage(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    const body = await request.json()
    const { amount, category, description, date } = body
    const rows = await dbQuery(
      `INSERT INTO expenses (user_id, amount, category, description, date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, amount, category, description || null, date]
    )
    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    console.error("[expenses] POST error:", error)
    return NextResponse.json({ error: dbErrorMessage(error) }, { status: 500 })
  }
}
