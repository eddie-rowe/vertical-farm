'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function SupabaseTest() {
  const [status, setStatus] = useState('Checking...');

  useEffect(() => {
    supabase
      .from('test')
      .select('*')
      .limit(1)
      .then(({ error }) => {
        if (error) setStatus('Supabase connection failed');
        else setStatus('Supabase connection successful');
      });
  }, []);

  return (
    <div style={{ padding: 32 }}>
      <h1>Supabase Test</h1>
      <p>{status}</p>
      <p style={{ fontSize: 12, color: '#888' }}>
        (You can remove this page after confirming your Supabase setup.)
      </p>
    </div>
  );
}
