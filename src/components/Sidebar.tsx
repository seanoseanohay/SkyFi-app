"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Satellite, Map, Bell, Settings, LogOut } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", icon: Map, label: "Dashboard" },
  { href: "/notifications", icon: Bell, label: "Alerts" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-14 flex flex-col items-center py-4 border-r border-white/10 bg-[#0f1117] shrink-0">
      {/* Logo */}
      <div className="mb-6">
        <div className="w-8 h-8 bg-blue-600/20 border border-blue-600/40 rounded-lg flex items-center justify-center">
          <Satellite className="w-4 h-4 text-blue-400" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            title={label}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-lg transition-colors relative",
              pathname.startsWith(href)
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white hover:bg-white/5"
            )}
          >
            {href === "/notifications" ? (
              <NotificationBell />
            ) : (
              <Icon className="w-5 h-5" />
            )}
          </Link>
        ))}
      </nav>

      {/* Sign out */}
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        title="Sign out"
        className="w-10 h-10 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </aside>
  );
}
