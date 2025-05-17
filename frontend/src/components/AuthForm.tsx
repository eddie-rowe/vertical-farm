'use client';
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useRouter } from 'next/navigation';

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    // Email validation
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    // Password validation (sign up and login, but not reset)
    if (!showReset && password.length < 12) {
      setError('Password must be at least 12 characters.');
      return;
    }
    setLoading(true);
    if (showReset) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) setError(error.message);
      else setMessage('Password reset email sent!');
      setLoading(false);
      return;
    }
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage('Check your email for a confirmation link!');
    } else {
      // Set session persistence based on rememberMe
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) setError(error.message);
      else {
        router.push('/protected');
      }
    }
    setLoading(false);
  };

  return (
    <div className="w-80 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 shadow">
      <h2 className="text-center mb-4 text-gray-900 dark:text-gray-100 font-semibold text-xl">{isSignUp ? 'Sign Up' : 'Login'}</h2>
      <form onSubmit={handleSubmit}>
        {!isSignUp && !showReset && (
          <div className="flex flex-col gap-2 mb-3">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 py-2 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              onClick={async () => {
                setLoading(true);
                setError(null);
                setMessage(null);
                const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
                if (error) setError(error.message);
                setLoading(false);
              }}
            >
              <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g clipPath="url(#clip0_17_40)"><path d="M47.5 24.5C47.5 22.6 47.3 20.8 47 19H24V29.1H37.4C36.7 32.2 34.7 34.7 31.8 36.4V42.1H39.3C44 38 47.5 31.9 47.5 24.5Z" fill="#4285F4"/><path d="M24 48C30.6 48 36.2 45.9 39.3 42.1L31.8 36.4C30.1 37.5 27.9 38.2 24 38.2C17.7 38.2 12.3 34.1 10.4 28.7H2.6V34.6C5.7 41.1 14.1 48 24 48Z" fill="#34A853"/><path d="M10.4 28.7C9.9 27.6 9.6 26.4 9.6 25.2C9.6 24 9.9 22.8 10.4 21.7V15.8H2.6C0.9 19 0 22.4 0 25.2C0 28 0.9 31.4 2.6 34.6L10.4 28.7Z" fill="#FBBC05"/><path d="M24 9.8C27.7 9.8 30.2 11.3 31.5 12.5L39.4 5.1C36.2 2.1 30.6 0 24 0C14.1 0 5.7 6.9 2.6 15.8L10.4 21.7C12.3 16.3 17.7 12.2 24 12.2V9.8Z" fill="#EA4335"/></g><defs><clipPath id="clip0_17_40"><rect width="48" height="48" fill="white"/></clipPath></defs></svg>
              Continue with Google
            </button>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 py-2 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              onClick={async () => {
                setLoading(true);
                setError(null);
                setMessage(null);
                const { error } = await supabase.auth.signInWithOAuth({ provider: 'github' });
                if (error) setError(error.message);
                setLoading(false);
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0.297C5.373 0.297 0 5.67 0 12.297C0 17.617 3.438 22.092 8.205 23.682C8.805 23.797 9.025 23.422 9.025 23.092C9.025 22.797 9.015 22.047 9.01 21.047C5.672 21.797 4.968 19.422 4.968 19.422C4.422 18.047 3.633 17.672 3.633 17.672C2.547 16.922 3.722 16.938 3.722 16.938C4.922 17.047 5.555 18.203 5.555 18.203C6.633 20.047 8.422 19.547 9.205 19.203C9.322 18.422 9.633 17.922 9.98 17.672C7.255 17.422 4.422 16.359 4.422 11.672C4.422 10.359 4.872 9.297 5.633 8.453C5.505 8.203 5.105 6.922 5.755 5.297C5.755 5.297 6.755 5.016 9.005 6.355C9.965 6.086 10.985 5.953 12.005 5.953C13.025 5.953 14.045 6.086 15.005 6.355C17.255 5.016 18.255 5.297 18.255 5.297C18.905 6.922 18.505 8.203 18.375 8.453C19.135 9.297 19.585 10.359 19.585 11.672C19.585 16.375 16.745 17.422 14.015 17.672C14.445 17.984 14.825 18.641 14.825 19.641C14.825 21.047 14.815 22.672 14.815 23.092C14.815 23.422 15.035 23.797 15.635 23.672C20.402 22.092 23.84 17.617 23.84 12.297C23.84 5.67 18.467 0.297 12 0.297Z" fill="#181717"/></svg>
              Continue with GitHub
            </button>
          </div>
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full mb-3 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {!showReset && (
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full mb-3 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        )}
        {!isSignUp && !showReset && (
          <label className="flex items-center mb-3 text-gray-700 dark:text-gray-300 text-sm select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="mr-2 accent-primary"
            />
            Remember me
          </label>
        )}
        <button type="submit" disabled={loading} className="w-full py-2 mb-2 rounded bg-primary text-white dark:bg-primary dark:text-gray-900 font-semibold hover:bg-primary/90 transition disabled:opacity-60">
          {loading
            ? showReset
              ? 'Sending...'
              : isSignUp
              ? 'Signing up...'
              : 'Logging in...'
            : showReset
            ? 'Send Password Reset Email'
            : isSignUp
            ? 'Sign Up'
            : 'Login'}
        </button>
      </form>
      <div className="flex flex-col gap-2 mt-2">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full py-2 bg-none border-none text-primary dark:text-blue-400 cursor-pointer hover:underline"
          type="button"
        >
          {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
        </button>
        {!isSignUp && !showReset && (
          <button
            onClick={() => setShowReset(true)}
            className="w-full py-2 bg-none border-none text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:underline"
            type="button"
          >
            Forgot password?
          </button>
        )}
        {showReset && (
          <button
            onClick={() => setShowReset(false)}
            className="w-full py-2 bg-none border-none text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:underline"
            type="button"
          >
            Back to login
          </button>
        )}
      </div>
      {error && <div className="text-red-600 dark:text-red-400 mt-2">{error}</div>}
      {message && <div className="text-green-600 dark:text-green-400 mt-2">{message}</div>}
    </div>
  );
}
