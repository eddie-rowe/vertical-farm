'use client';
import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabaseClient';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PageHeader } from '@/components/ui/PageHeader';

export default function AccountPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState(user?.user_metadata?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [updating, setUpdating] = useState(false);
  const [theme, setTheme] = useState("light");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading user data...</div>;
  }

  // Profile update handler
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setUpdating(true);
    const updates: {
      data: { name: string; avatar_url?: string };
      email?: string;
    } = { data: { name } };
    if (email !== user?.email) updates.email = email;
    if (newAvatar) {
      // In a real app, upload to storage and get the URL
      updates.data.avatar_url = URL.createObjectURL(newAvatar);
    }
    const { error } = await supabase.auth.updateUser(updates);
    if (error) setError(error.message);
    else setMessage('Profile updated!');
    setUpdating(false);
  };

  // Password change handler
  const handlePasswordChange = async (e: React.FormEvent) => {
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
    else setMessage('Password updated!');
    setPassword('');
    setUpdating(false);
  };

  // Account deletion handler
  const handleDeleteAccount = async () => {
    setDeleting(true);
    setMessage(null);
    setError(null);
    // In a real app, call a backend endpoint to delete the user
    setTimeout(() => {
      setDeleting(false);
      setMessage('Account deletion is not implemented in this demo.');
    }, 1500);
  };

  // Avatar upload handler
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewAvatar(e.target.files[0]);
      setAvatarUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  // Placeholder for theme change handler
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    // In a real app, you would persist this to user preferences and update the app's theme context
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    setMessage(`Theme set to ${newTheme} (UI updated, persistence not implemented).`);
  };

  // Placeholder for notification settings change handler
  const handleNotificationToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    // In a real app, persist this to user preferences
    setMessage(`Notifications ${enabled ? 'enabled' : 'disabled'} (preference not saved).`);
  };

  return (
    <div className="max-w-xl mx-auto p-8">
      <PageHeader
        title="Account"
        description="Manage your profile, preferences, and account settings."
      />
      <form onSubmit={handleProfileUpdate} className="mb-8 space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={name || 'User Avatar'} fill className="object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-3xl text-gray-400">{(name?.[0] || user?.email?.[0] || "?").toUpperCase()}</span>
            )}
          </div>
          <div>
            <button
              type="button"
              className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Change Avatar
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </div>
        <div>
          <label className="block mb-1 font-medium">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            required
          />
        </div>
        <button type="submit" disabled={updating} className="w-full py-2 rounded bg-primary text-white font-semibold hover:bg-primary/90 transition disabled:opacity-60">Update Profile</button>
      </form>
      <hr className="my-8 border-t-2 border-gray-200 dark:border-gray-700" />
      <form onSubmit={handlePasswordChange} className="mb-8 space-y-4">
        <h2 className="text-2xl font-bold mb-2">Change Password</h2>
        <div>
          <Label htmlFor="newPassword">New Password</Label>
          <input
            type="password"
            id="newPassword"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="Enter new password"
            required
          />
        </div>
        <button type="submit" disabled={updating} className="w-full py-2 rounded bg-primary text-white font-semibold hover:bg-primary/90 transition disabled:opacity-60">Change Password</button>
      </form>
      <hr className="my-8 border-t-2 border-gray-200 dark:border-gray-700" />
      <div className="mb-8 space-y-4">
        <h2 className="text-2xl font-bold mb-2">Preferences</h2>
        <div className="space-y-1">
          <Label htmlFor="theme">Theme</Label>
          <Select value={theme} onValueChange={handleThemeChange}>
            <SelectTrigger id="theme" className="w-[180px]">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox 
            id="notifications" 
            checked={notificationsEnabled} 
            onCheckedChange={(checkedState) => handleNotificationToggle(Boolean(checkedState))} 
          />
          <Label htmlFor="notifications" className="font-medium">
            Enable email notifications
          </Label>
        </div>
      </div>
      <hr className="my-8 border-t-2 border-gray-200 dark:border-gray-700" />
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2 text-red-600">Danger Zone</h2>
        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="w-full py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-60"
        >
          {deleting ? "Deleting..." : "Delete Account"}
        </button>
      </div>
      {error && <div className="text-red-600 dark:text-red-400 mt-4 text-lg font-semibold" role="alert">{error}</div>}
      {message && <div className="text-green-600 dark:text-green-400 mt-4 text-lg font-semibold" role="status">{message}</div>}
    </div>
  );
}
