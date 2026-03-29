import { getBackendBaseUrl } from "@/lib/backend-url"
import { NextResponse } from "next/server";

const backendBaseUrl = getBackendBaseUrl()
 const isProduction = process.env.NODE_ENV === "production";
export async function POST(request: Request) {
    try {
        const body = await request.json(); // ⬅ Parse JSON

        const res = await fetch(`${backendBaseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        // Kiểm tra status response từ backend
        if (!res.ok) {
            const errorData = await res.json();
            return NextResponse.json(errorData, { status: res.status });
        }
        
        const data = await res.json();

        // Dùng NextResponse để set cookie
        const response = NextResponse.json({ success: true });
        response.cookies.set("access_token", data.session.access_token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "strict",
            path: "/",
            maxAge: data.session.expires_in // token hết hạn sau 3600s
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
        const message = error instanceof Error ? error.message : "Internal server error";
        const status =
            typeof error === "object" &&
            error !== null &&
            "status" in error &&
            typeof (error as { status?: unknown }).status === "number"
                ? (error as { status: number }).status
                : 500;

        return NextResponse.json({ error: message }, { status });
    }
}