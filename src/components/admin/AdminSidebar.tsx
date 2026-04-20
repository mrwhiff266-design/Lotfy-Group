"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Users, ShoppingCart, Settings, LogOut, Shield, Package, Folder, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

// Use same permission keys as backend
const allLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, permission: "dashboard" },
  { name: "Products", href: "/admin/products", icon: ShoppingBag, permission: "products" },
  { name: "Collections", href: "/admin/collections", icon: Folder, permission: "products" }, // Reusing 'products' permission, // Added Navigation
  { name: "Inventory", href: "/admin/inventory", icon: Package, permission: "inventory" }, // New Link
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart, permission: "orders" },
  { name: "Customers (B2B)", href: "/admin/customers", icon: Users, permission: "customers" },
  { name: "Team", href: "/admin/team", icon: Shield, permission: "team" }, // Reusing 'settings' permission for now, or create 'cms'
  { name: "Settings", href: "/admin/settings", icon: Settings, permission: "settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [permissions, setPermissions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false); // Mobile Menu State
  const [userRole, setUserRole] = useState<string | null>(null);

  // Function to load permissions safely
  const loadPermissions = () => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem("adminPermissions");
    const role = localStorage.getItem("adminRole");
    setUserRole(role);

    if (stored) {
      try {
        setPermissions(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse permissions", e);
      }
    } else {
      setPermissions(null); // Clear them if not found
    }
    setLoading(false);
  };

  // 1. Load on Mount
  useEffect(() => {
    loadPermissions();
    
    // 2. Listen for storage changes (e.g. login/logout in another tab)
    window.addEventListener('storage', loadPermissions);
    
    // 3. Custom event for immediate updates within the same tab
    window.addEventListener('permissionsUpdated', loadPermissions);

    return () => {
      window.removeEventListener('storage', loadPermissions);
      window.removeEventListener('permissionsUpdated', loadPermissions);
    };
  }, []);

  // Watch pathname changes to re-check if user is allowed here
  useEffect(() => {
    loadPermissions();
    setIsOpen(false); // Close mobile menu on route change
  }, [pathname]);

  // Hide sidebar completely on login page
  if (pathname === '/admin/login') return null;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem("adminPermissions"); // Explicit removal
      localStorage.removeItem("adminRole");
      localStorage.clear();
      
      // Dispatch event so sidebar updates immediately
      window.dispatchEvent(new Event('permissionsUpdated'));
      
      router.push('/admin/login');
      router.refresh(); 
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // If loading, show skeleton
  if (loading) return <div className="p-4 w-64 border-r h-full bg-white"><div className="h-8 bg-slate-100 rounded w-3/4 animate-pulse"></div></div>;

  // IMPORTANT: If no permissions found, DO NOT show the menu (unless SuperAdmin).
  // This fixes the "flash of content" bug.
  if (!permissions && userRole !== 'SuperAdmin') {
     return <div className="hidden md:block w-64 border-r h-full bg-white"></div>;
  }

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white border-b h-14 flex items-center px-4 sticky top-0 z-40 w-full">
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 -ml-2 mr-2 text-slate-600">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <span className="font-bold text-lg text-slate-900">LotfyGroup AdminPannel</span>
      </div>

      {/* Overlay for Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed md:static inset-y-0 left-0 z-50 w-64 flex-col border-r bg-white transition-transform duration-300 ease-in-out md:translate-x-0 md:flex h-full",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">LotfyGroup</h2>
          <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">Admin</span>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="grid gap-1 px-2">
            {allLinks.map((link) => {
              const section = permissions?.[link.permission];
              // Allow if view=true OR if user is SuperAdmin
              const canView = (section?.view === true) || (userRole === 'SuperAdmin');

              if (!canView) return null;

              const Icon = link.icon;
              const isActive = pathname === link.href;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-slate-900 text-white" 
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t p-4">
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </div>
    </>
  );
}
