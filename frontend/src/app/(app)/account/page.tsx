"use client";
import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { FarmSelect } from "@/components/ui/farm-select";
import { FarmInput } from "@/components/ui/farm-input";
import { FarmCheckbox } from "@/components/ui/farm-checkbox";
import { FarmControlButton } from "@/components/ui/farm-control-button";
import { PageHeader } from "@/components/ui/PageHeader";

export default function AccountPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [name, setName] = useState(user?.user_metadata?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(
    user?.user_metadata?.avatar_url || "",
  );
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [updating, setUpdating] = useState(false);
  const [theme, setTheme] = useState("light");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-control-label">
        Loading user data...
      </div>
    );
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
    else setMessage("Profile updated!");
    setUpdating(false);
  };

  // Password change handler
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setUpdating(true);
    if (password.length < 12) {
      setError("Password must be at least 12 characters.");
      setUpdating(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else setMessage("Password updated!");
    setPassword("");
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

  // Placeholder for theme change handler
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    // In a real app, you would persist this to user preferences and update the app's theme context
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(newTheme);
    setMessage(
      `Theme set to ${newTheme} (UI updated, persistence not implemented).`,
    );
  };

  // Placeholder for notification settings change handler
  const handleNotificationToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    // In a real app, persist this to user preferences
    setMessage(
      `Notifications ${enabled ? "enabled" : "disabled"} (preference not saved).`,
    );
  };

  return (
    <div className="max-w-xl mx-auto p-8">
      <PageHeader
        title="Account"
        description="Manage your profile, preferences, and account settings."
      />
      <form onSubmit={handleProfileUpdate} className="mb-8 space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 card-shadow">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={name || "User Avatar"}
                fill
                className="object-cover"
              />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-3xl text-gray-400">
                {(name?.[0] || user?.email?.[0] || "?").toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <FarmControlButton
              type="button"
              variant="default"
              size="sm"
              animation="float"
              onClick={() => fileInputRef.current?.click()}
            >
              Change Avatar
            </FarmControlButton>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        <FarmInput
          label="Name"
          inputSize="default"
          validation="default"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          helpText="Your display name for the farming platform"
        />

        <FarmInput
          label="Email"
          inputSize="default"
          validation={email !== user?.email ? "info" : "default"}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          helpText={
            email !== user?.email
              ? "Email change will require verification"
              : "Your account email address"
          }
          required
        />

        <FarmControlButton
          type="submit"
          disabled={updating}
          variant="primary"
          animation="pop"
          className="w-full"
        >
          {updating ? "Updating..." : "Update Profile"}
        </FarmControlButton>
      </form>

      <hr className="my-8 border-t-2 border-gray-200 dark:border-gray-700" />

      <form onSubmit={handlePasswordChange} className="mb-8 space-y-4">
        <h2 className="text-farm-title mb-2">Change Password</h2>

        <FarmInput
          label="New Password"
          inputSize="default"
          validation={
            password.length > 0 && password.length < 12 ? "error" : "default"
          }
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
          helpText="Password must be at least 12 characters"
          errorText={
            password.length > 0 && password.length < 12
              ? "Password too short"
              : undefined
          }
          required
        />

        <FarmControlButton
          type="submit"
          disabled={updating || password.length < 12}
          variant="primary"
          animation="pop"
          className="w-full"
        >
          {updating ? "Updating..." : "Change Password"}
        </FarmControlButton>
      </form>

      <hr className="my-8 border-t-2 border-gray-200 dark:border-gray-700" />

      <div className="mb-8 space-y-4">
        <h2 className="text-farm-title mb-2">Preferences</h2>

        <FarmSelect
          label="Theme"
          inputSize="default"
          validation="default"
          options={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
          value={theme}
          onChange={(e) => handleThemeChange(e.target.value)}
          helpText="Choose your preferred interface theme"
          className="w-[180px]"
        />

        <div className="flex items-center space-x-2 pt-2">
          <FarmCheckbox
            checked={notificationsEnabled}
            onCheckedChange={(checked) =>
              handleNotificationToggle(Boolean(checked))
            }
            id="notifications"
          />
          <label htmlFor="notifications" className="form-label">
            Enable email notifications
          </label>
        </div>
      </div>

      <hr className="my-8 border-t-2 border-gray-200 dark:border-gray-700" />

      <div className="mb-8">
        <h2 className="text-farm-title mb-2 state-offline">Danger Zone</h2>
        <FarmControlButton
          onClick={handleDeleteAccount}
          disabled={deleting}
          variant="offline"
          animation="none"
          className="w-full"
        >
          {deleting ? "Deleting..." : "Delete Account"}
        </FarmControlButton>
      </div>

      {error && (
        <div
          className="form-error mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20"
          role="alert"
        >
          {error}
        </div>
      )}
      {message && (
        <div
          className="text-control-label state-growing mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20"
          role="status"
        >
          {message}
        </div>
      )}
    </div>
  );
}
