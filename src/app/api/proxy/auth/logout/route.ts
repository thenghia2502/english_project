import { NextResponse } from "next/server";

const isProduction = process.env.NODE_ENV === "production";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // ❌ xóa cookie bằng cách set maxAge = 0
  response.cookies.set("access_token", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("user_id", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}