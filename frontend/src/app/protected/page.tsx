'use client';
import { useAuth } from '../../context/AuthContext';
import { redirect } from 'next/navigation';

export default function ProtectedPage() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) {
    redirect('/auth');
    return null;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Protected Page</h1>
      <p>Welcome, {user.email}!</p>
      <p className="mt-2 text-gray-500">Only authenticated users can see this page.</p>
      <ApiTest />
    </div>
  );
}

import ApiTest from './api-test';
