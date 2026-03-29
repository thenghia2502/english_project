import { getBackendBaseUrl } from "@/lib/backend-url"

const backendBaseUrl = getBackendBaseUrl()
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const word = searchParams.get('word');
        if (!word) {
            return new Response(JSON.stringify({ error: 'word parameter is required' }), { status: 400 });
        }
        const res = await fetch(`${backendBaseUrl}/words/us-ipa?word=${encodeURIComponent(word)}`, {
            method: 'GET',
        });
        const data = await res.json();
        return new Response(JSON.stringify(data), { status: res.status });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}