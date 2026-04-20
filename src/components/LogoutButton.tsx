"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // 1. Clear the server cookie
      await fetch('/api/auth/logout', { method: 'POST' });

      // 2. Clear ALL local storage (Removes adminRole, adminPermissions, etc.)
      localStorage.clear();

      // 3. Send user back to the login secret door
      router.push('/admin/login');
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <Button 
      variant="ghost" 
      onClick={handleLogout}
      className="text-slate-500 hover:text-red-600 hover:bg-red-50 w-full justify-start gap-2"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </Button>
  );
}