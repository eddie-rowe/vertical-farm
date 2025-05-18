"use client";
import { useState } from "react";

export default function SettingsPage() {
  const [email, setEmail] = useState("user@example.com");
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState("light");

  return (
    <div className="flex-1 p-8 animate-pop max-w-2xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-8 text-green-900 dark:text-green-100 drop-shadow-lg border-b-2 border-green-200 dark:border-green-800 pb-4">Settings</h1>
      <form className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-2">Account</h2>
          <div className="mb-4">
            <label className="block font-medium mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="border rounded px-3 py-2 w-full" />
          </div>
        </section>
        <hr className="my-8 border-t-2 border-gray-200 dark:border-gray-700" />
        <section>
          <h2 className="text-2xl font-bold mb-2">Preferences</h2>
          <div className="flex items-center gap-4 mb-4">
            <label className="font-medium">Theme</label>
            <select value={theme} onChange={e => setTheme(e.target.value)} className="border rounded px-3 py-1">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={notifications} onChange={e => setNotifications(e.target.checked)} id="notifications" />
            <label htmlFor="notifications" className="font-medium">Enable notifications</label>
          </div>
        </section>
        <hr className="my-8 border-t-2 border-gray-200 dark:border-gray-700" />
        <section>
          <h2 className="text-2xl font-bold mb-2">Danger Zone</h2>
          <button type="button" className="btn-animated bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded font-semibold">Delete Account</button>
        </section>
      </form>
    </div>
  );
}
