'use client';
import { useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function ApiTest() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const callApi = async () => {
    setLoading(true);
    setResult('');
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) {
      setResult('No session found. Please log in.');
      setLoading(false);
      return;
    }
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/items/test`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult('Error: ' + err);
    }
    setLoading(false);
  };

  return (
    <div className="mt-8">
      <button
        onClick={callApi}
        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Calling API...' : 'Test Authenticated API Call'}
      </button>
      <pre className="mt-4 bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-x-auto">
        {result}
      </pre>
    </div>
  );
}
