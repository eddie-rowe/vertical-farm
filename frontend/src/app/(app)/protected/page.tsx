'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button'; // Assuming shadcn/ui Button
import { PageHeader } from '@/components/ui/PageHeader';

export default function ProtectedPage() {
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const callBackendHealth = async () => {
    setIsLoading(true);
    setMessage('');
    setError('');
    try {
      // Ensure your NEXT_PUBLIC_API_URL is set in your .env.local or environment
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMessage(`Backend status: ${data.status}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to fetch backend status: ${err.message}`);
      } else {
        setError('Failed to fetch backend status: An unknown error occurred');
      }
      console.error(err);
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <PageHeader
        title="Protected Page"
        description="This page is protected by authentication. Only logged-in users should be able to see this."
      />
      <div className="mt-6">
        <Button onClick={callBackendHealth} disabled={isLoading}>
          {isLoading ? 'Checking Backend...' : 'Check Backend Health'}
        </Button>
        {message && <p className="mt-4 text-green-600">{message}</p>}
        {error && <p className="mt-4 text-red-600">{error}</p>}
      </div>
    </div>
  );
}
