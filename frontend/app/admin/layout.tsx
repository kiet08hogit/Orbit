"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, AlertTriangle } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      const token = await getToken();
      if (!token) {
        router.push("/");
        return;
      }

      try {
        const res = await fetch("http://localhost:3000/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const user = await res.json();
          if (user.role === "ADMIN") {
            setIsChecking(false);
          } else {
            router.push("/");
          }
        } else {
          router.push("/");
        }
      } catch (error) {
        router.push("/");
      }
    }
    checkAdmin();
  }, [getToken, router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading Admin Dashboard...</p>
      </div>
    );
  }

  const links = [
    { href: "/admin", label: "Overview", icon: <LayoutDashboard size={20} /> },
    { href: "/admin/reports", label: "Reports", icon: <AlertTriangle size={20} /> },
    { href: "/admin/users", label: "Users", icon: <Users size={20} /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r bg-background">
        <div className="h-16 flex items-center px-6 border-b">
          <h2 className="text-xl font-bold tracking-tight">Admin Console</h2>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
