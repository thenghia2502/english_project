import { getBackendBaseUrl } from "@/lib/backend-url";
import { NextResponse } from "next/server";

const backendBaseUrl = getBackendBaseUrl();
const isProduction = process.env.NODE_ENV === "production";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await fetch(`${backendBaseUrl}/auth/sync-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(errorData, { status: res.status });
    }

    const data = await res.json();

    const response = NextResponse.json({ success: true });

    response.cookies.set("access_token", data.session.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      path: "/",
      maxAge: data.session.expires_in,
    });

    response.cookies.set("refresh_token", data.session.refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      path: "/",
    });

    response.cookies.set("user_id", data.user.id, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}