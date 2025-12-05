import { NextResponse } from "next/server";
 const isProduction = process.env.NODE_ENV === "production";
export async function POST(request: Request) {
    try {
        const body = await request.json(); // ⬅ Parse JSON

        const res = await fetch('http://localhost:4000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
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
        return response;
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: error.status });
    }
}