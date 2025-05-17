"use client";
import { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../supabaseClient";
import Image from "next/image";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [name, setName] = useState(user?.user_metadata?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || "");
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/auth";
    return null;
  }

  // Profile update handler
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
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
    else setMessage("Profile updated!");
  };

  // Password change handler
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }
    // Optionally verify current password (not supported by Supabase directly)
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else setMessage("Password updated!");
    setPassword("");
  };

  // Account deletion handler
  const handleDeleteAccount = async () => {
    setDeleting(true);
    setMessage(null);
    setError(null);
    // In a real app, call a backend endpoint to delete the user
    setTimeout(() => {
      setDeleting(false);
      setMessage("Account deletion is not implemented in this demo.");
    }, 1500);
  };

  // Avatar upload handler
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewAvatar(e.target.files[0]);
      setAvatarUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <form onSubmit={handleProfileUpdate} className="mb-8 space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-3xl text-gray-400">{(user?.email?.[0] || "?").toUpperCase()}</span>
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
        <button type="submit" className="w-full py-2 rounded bg-primary text-white font-semibold hover:bg-primary/90 transition">Update Profile</button>
      </form>
      <form onSubmit={handlePasswordChange} className="mb-8 space-y-4">
        <h2 className="text-lg font-semibold mb-2">Change Password</h2>
        <div>
          <label className="block mb-1 font-medium">New Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="Enter new password"
            required
          />
        </div>
        <button type="submit" className="w-full py-2 rounded bg-primary text-white font-semibold hover:bg-primary/90 transition">Change Password</button>
      </form>
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Account Settings</h2>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-primary" disabled />
            Email notifications (coming soon)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-primary" disabled />
            Product updates (coming soon)
          </label>
        </div>
      </div>
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2 text-red-600">Danger Zone</h2>
        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="w-full py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-60"
        >
          {deleting ? "Deleting..." : "Delete Account"}
        </button>
      </div>
      {error && <div className="text-red-600 dark:text-red-400 mt-4">{error}</div>}
      {message && <div className="text-green-600 dark:text-green-400 mt-4">{message}</div>}
    </div>
  );
}
