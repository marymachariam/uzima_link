"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AuthGuard({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // wait until we know if a session exists

    if (!user) {
      router.replace("/login");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace("/login");
    }
  }, [user, loading, allowedRoles, router]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading...</div>;
  }

  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return null; // brief flash before redirect completes
  }

  return children;
}