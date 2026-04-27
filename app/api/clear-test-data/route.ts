import { NextResponse } from "next/server"
import { dbQuery, dbErrorMessage } from "@/lib/db"

// Deletes all rows whose description matches test/stress patterns,
// scoped to demo-user only — never touches real user data.
export async function DELETE() {
  try {
    const result = await dbQuery(
      `DELETE FROM expenses
       WHERE user_id = $1
         AND (
           description LIKE 'stress-%'
           OR description LIKE 'load-test-%'
           OR description = 'Test expense'
           OR description = 'Automated test expense — safe to delete'
         )
       RETURNING id`,
      ["demo-user"]
    )
    return NextResponse.json({ deleted: result.length })
  } catch (error) {
    return NextResponse.json({ error: dbErrorMessage(error) }, { status: 500 })
  }
}
