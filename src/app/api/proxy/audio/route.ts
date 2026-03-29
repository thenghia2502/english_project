import { NextResponse } from "next/server"
import { getBackendBaseUrl } from "@/lib/backend-url"

const backendBaseUrl = getBackendBaseUrl()
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');
    const dialect = searchParams.get('dialect');

    try {
        const response = await fetch(
            backendBaseUrl +
                '/audio/signed-url?word=' +
                encodeURIComponent(word || '') +
                '&dialect=' +
                encodeURIComponent(dialect || '')
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch audio from backend' },
                { status: response.status }
            );
        }

        // Parse JSON từ backend response
        const data = await response.json();
        
        // Return clean JSON response (avoid encoding issues)
        return NextResponse.json(data);
    } catch (error) {
        console.error('Audio proxy error:', error);
        return NextResponse.json(
            { error: 'Error in audio proxy' },
            { status: 500 }
        );
    }
}