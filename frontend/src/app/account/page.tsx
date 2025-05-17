'use client';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { redirect } from 'next/navigation';

export default function AccountPage() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) {
    redirect('/auth');
    return null;
  }

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setUpdating(true);
    const { error } = await supabase.auth.updateUser({ email });
    if (error) setError(error.message);
    else setMessage('Email update requested. Please check your new email for a confirmation link.');
    setUpdating(false);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setUpdating(true);
    if (password.length < 12) {
      setError('Password must be at least 12 characters.');
      setUpdating(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else setMessage('Password updated successfully.');
    setPassword('');
    setUpdating(false);
  };

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Account Management</h1>
      <form onSubmit={handleEmailUpdate} className="mb-6">
        <label className="block mb-2 font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full mb-3 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
        <button type="submit" disabled={updating} className="w-full py-2 rounded bg-primary text-white dark:bg-primary dark:text-gray-900 font-semibold hover:bg-primary/90 transition disabled:opacity-60">
          Update Email
        </button>
      </form>
      <form onSubmit={handlePasswordUpdate}>
        <label className="block mb-2 font-medium">New Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full mb-3 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Enter new password"
          required
        />
        <button type="submit" disabled={updating} className="w-full py-2 rounded bg-primary text-white dark:bg-primary dark:text-gray-900 font-semibold hover:bg-primary/90 transition disabled:opacity-60">
          Update Password
        </button>
      </form>
      {error && <div className="text-red-600 dark:text-red-400 mt-4">{error}</div>}
      {message && <div className="text-green-600 dark:text-green-400 mt-4">{message}</div>}
    </div>
  );
}
