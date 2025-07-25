import { type NextRequest, NextResponse } from "next/server";
import { withCors } from "@/lib/middleware";

async function handleLogout(request: NextRequest) {
  const response = NextResponse.json({
    message: "Logged out successfully",
  });

  // Clear the auth cookie
  response.cookies.set("auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
  });

  return response;
}

export const POST = withCors(handleLogout);
