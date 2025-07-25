import { type NextRequest, NextResponse } from "next/server"
import { withAuth, withCors } from "@/lib/middleware"

async function handleGetMe(request: NextRequest, context: { user: any }) {
  return NextResponse.json({
    user: context.user,
  })
}

export const GET = withCors(withAuth(handleGetMe))
