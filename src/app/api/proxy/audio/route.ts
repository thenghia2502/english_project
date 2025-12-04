export function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');
    const dialect = searchParams.get('dialect');
    try {
        const response = fetch('http://localhost:4000/audio/signed-url?word=' + encodeURIComponent(word || '') + '&dialect=' + encodeURIComponent(dialect || ''));
        return response;
    } catch {
        return new Response('Error in audio proxy', { status: 500 });
    }
}