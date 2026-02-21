import { NextResponse } from "next/server";
import { cookies } from 'next/headers';

const isProduction = process.env.NODE_ENV === "production";

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get('refresh_token')?.value;
        
        if (!refreshToken) {
            return NextResponse.json(
                { error: 'Refresh token not found' }, 
                { status: 401 }
            );
        }

        // Gọi backend để refresh token
        const response = await fetch('http://localhost:4000/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ refreshToken: refreshToken }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(
                errorData, 
                { status: response.status }
            );
        }

        const data = await response.json();

        const accessToken = data?.access_token ?? data?.session?.access_token ?? data?.accessToken
        const newRefreshToken = data?.refresh_token ?? data?.session?.refresh_token ?? data?.refreshToken
        const expiresIn = data?.expires_in ?? data?.session?.expires_in

        if (!accessToken) {
            return NextResponse.json(
                { error: 'Refresh did not return access token' },
                { status: 401 }
            );
        }

        // Tạo response và set cookies mới
        const nextResponse = NextResponse.json({ 
            success: true,
            message: 'Token refreshed successfully'
        });

        // Set access_token mới
        nextResponse.cookies.set("access_token", accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "strict",
            path: "/",
            maxAge: expiresIn || 3600 // Default 1 hour
        });

        // Set refresh_token mới (nếu backend trả về)
        if (newRefreshToken) {
            nextResponse.cookies.set("refresh_token", newRefreshToken, {
                httpOnly: true,
                secure: isProduction,
                sameSite: "strict",
                path: "/",
                maxAge: 60 * 60 * 24 * 30 // 30 days
            });
        }

        return nextResponse;

    } catch (error: any) {
        console.error('Refresh token error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' }, 
            { status: 500 }
        );
    }
}
