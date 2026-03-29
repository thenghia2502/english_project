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
        return response;
    } catch {
        return new Response('Error in audio proxy', { status: 500 });
    }
}