import { getBackendBaseUrl } from "@/lib/backend-url"
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const backendBaseUrl = getBackendBaseUrl()

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const parentId = searchParams.get('parentId');
        
        if (!parentId) {
            return NextResponse.json({ error: 'parentId is required' }, { status: 400 });
        }

        const cookieStore = await cookies();
        const accessToken = cookieStore.get('access_token')?.value;

        const response = await fetch(`${backendBaseUrl}/words/child-of/${parentId}`, {
            headers: {
                'Authorization': accessToken ? `Bearer ${accessToken}` : '',
            },
        });

        if (response.status === 401) {
            const refreshToken = cookieStore.get('refresh_token')?.value;
            if (!refreshToken) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }

            const refreshResponse = await fetch(`${backendBaseUrl}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (!refreshResponse.ok) {
                return NextResponse.json({ error: 'Failed to refresh token' }, { status: 401 });
            }

            const { access_token: newAccessToken, refresh_token: newRefreshToken } = await refreshResponse.json();

            const retryResponse = await fetch(`${backendBaseUrl}/words/child-of/${parentId}`, {
                headers: {
                    'Authorization': `Bearer ${newAccessToken}`,
                },
            });

            if (!retryResponse.ok) {
                return NextResponse.json({ error: 'Failed to fetch data' }, { status: retryResponse.status });
            }

            const data = await retryResponse.json();
            const res = NextResponse.json(data);
            res.cookies.set('access_token', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7,
            });
            res.cookies.set('refresh_token', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30,
            });
            return res;
        }

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch data' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in child-of proxy:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}