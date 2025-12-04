export async function GET(request: Request) {
    try {
        // Extract units from query parameters
        const { searchParams } = new URL(request.url);
        const unitIds = searchParams.getAll('unitIds');
        
        if (!unitIds || unitIds.length === 0) {
            return new Response(JSON.stringify({ error: 'unitIds parameter is required' }), { status: 400 });
        }

        // Build query string with multiple unitIds parameters: unitIds=id1&unitIds=id2&unitIds=id3
        const queryString = unitIds.map(id => `unitIds=${encodeURIComponent(id)}`).join('&');
        const response = await fetch(`http://localhost:4000/words/by-units?${queryString}`);
        
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
        console.log('Proxy received data from backend:', data);
        const result = {
            success: true,
            data: data,
        }
        return new Response(JSON.stringify(result), { status: 200 });
    } catch (error) {
       console.error('Error fetching words by units:', error);
       return new Response(JSON.stringify({ error: 'Error fetching words by units' }), { status: 500 });
    }
}