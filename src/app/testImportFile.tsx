'use client';

import { useState } from 'react';

export default function TestImportFile() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [responseData, setResponseData] = useState<any>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);
        setResponseData(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/proxy/file/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('File upload failed');
            }

            const data = await response.json();
            console.log('✅ File upload response:', data);
            setResponseData(data);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Error uploading file:', errorMsg);
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h1>Test Import File</h1>
            
            <input 
                type="file" 
                onChange={handleFileChange}
                disabled={loading}
            />

            {loading && <p style={{ color: 'blue' }}>⏳ Đang upload...</p>}

            {error && (
                <div style={{ color: 'red', marginTop: '10px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
                    <strong>❌ Lỗi:</strong> {error}
                </div>
            )}

            {responseData && (
                <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                    <h3>✅ Response Data:</h3>
                    <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                        {JSON.stringify(responseData, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}