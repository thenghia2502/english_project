import { getBackendBaseUrl } from "@/lib/backend-url"
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const backendBaseUrl = getBackendBaseUrl()
const isProduction = process.env.NODE_ENV === "production";

export async function GET(request: Request) {
    try {
        // Extract units from query parameters
        const { searchParams } = new URL(request.url);
        const unitIds = searchParams.getAll('unitIds');
        
        if (!unitIds || unitIds.length === 0) {
            return new Response(JSON.stringify({ error: 'unitIds parameter is required' }), { status: 400 });
        }

        // Read access token from server-side cookies (await dynamic API)
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('access_token')?.value;
        const refreshToken = cookieStore.get('refresh_token')?.value;

        // Build query string with multiple unitIds parameters: unitIds=id1&unitIds=id2&unitIds=id3
        const queryString = unitIds.map(id => `unitIds=${encodeURIComponent(id)}`).join('&');
        const url = `${backendBaseUrl}/words/by-units?${queryString}`
        const doFetch = async (token?: string) => fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
        })

        let response = await doFetch(accessToken)
        
        // If unauthorized and we have a refresh token, try to refresh and retry once
        if (response.status === 401 && refreshToken) {
            try {
                const refreshRes = await fetch(`${backendBaseUrl}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: refreshToken })
                })

                if (refreshRes.ok) {
                    const refData = await refreshRes.json()
                    const newAccess: string | undefined = refData?.session?.access_token
                    const newRefresh: string | undefined = refData?.session?.refresh_token
                    const expiresIn: number | undefined = typeof refData?.session?.expires_in === 'number' ? refData.session.expires_in : undefined

                    // Retry with new access token
                    const retryRes = await doFetch(newAccess)
                    if (retryRes.ok) {
                        const data = await retryRes.json()
                        const nextRes = NextResponse.json({ success: true, data }, { status: 200 })
                        if (newAccess) {
                            nextRes.cookies.set('access_token', newAccess, {
                                httpOnly: true,
                                secure: isProduction,
                                sameSite: 'strict',
                                path: '/',
                                ...(expiresIn ? { maxAge: expiresIn } : {})
                            })
                        }
                        if (newRefresh) {
                            nextRes.cookies.set('refresh_token', newRefresh, {
                                httpOnly: true,
                                secure: isProduction,
                                sameSite: 'strict',
                                path: '/',
                            })
                        }
                        return nextRes
                    } else {
                        // Retry failed, fall through to generic error handling
                        response = retryRes
                    }
                }
            } catch (e) {
                console.error('Refresh token flow failed:', e)
            }
        }

        if (!response.ok) {
            console.error('Backend returned error:', response.status, response.statusText);
            return new Response(JSON.stringify({ 
                success: false, 
                error: `Backend error: ${response.status}` 
            }), { 
                status: response.status 
            });
        }
        
        const data = await response.json();
        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error) {
       console.error('Error fetching words by units:', error);
       return new Response(JSON.stringify({ error: 'Error fetching words by units' }), { status: 500 });
    }
}