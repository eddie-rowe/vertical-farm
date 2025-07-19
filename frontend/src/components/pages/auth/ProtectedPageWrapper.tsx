"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedPageWrapperProps {
  children: React.ReactNode;
}

export default function ProtectedPageWrapper({
  children,
}: ProtectedPageWrapperProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // You can render a loading spinner or a blank page here while checking auth
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-900 dark:border-green-100"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Authenticating...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
