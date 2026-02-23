import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const isProduction = process.env.NODE_ENV === "production"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get("refresh_token")?.value

    if (refreshToken) {
      try {
        await fetch("http://localhost:4000/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        })
      } catch (error) {
        console.error("Backend logout call failed:", error)
      }
    }

    const response = NextResponse.json({ success: true })

    response.cookies.set("access_token", "", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    })

    response.cookies.set("refresh_token", "", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    })

    response.cookies.set("user_id", "", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    })

    return response
  } catch (error: any) {
    console.error("Logout route error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
