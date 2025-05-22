'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../context/AuthContext"; // Assuming AuthContext provides user info
import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const { user } = useAuth(); // Get user from AuthContext
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      // Potentially set displayName from user.user_metadata.full_name or similar if available
      setDisplayName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User');
    }
  }, [user]);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for profile update logic
    alert('Profile update submitted (not implemented).');
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>View and update your personal details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.user_metadata?.avatar_url || `https://avatar.vercel.sh/${email}.png`} alt={displayName} />
              <AvatarFallback>{displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{displayName}</h2>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
          
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email Address (read-only)</Label>
              <Input id="email" type="email" value={email} readOnly disabled />
            </div>
            {/* Add more profile fields here as needed (e.g., bio, phone) */}
            <Button type="submit">Update Profile</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 