"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Settings, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/" },
  { label: "Tasks", href: "/tasks" },
  { label: "Ralph", href: "/ralph" },
  { label: "Costs", href: "/costs" },
];

/**
 * Header - Top navigation bar
 * 
 * Features:
 * - Logo with "MISSION CONTROL" branding
 * - Navigation tabs with active state
 * - Search input
 * - Theme toggle
 * - Settings button
 */
export function Header() {
  const pathname = usePathname();
  
  return (
    <header className="sticky top-0 z-[200] h-16 bg-[var(--color-iron-900)] border-b border-white/10">
      <div className="h-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-12 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <div className="flex flex-col">
            <span className="text-xs font-semibold tracking-[0.05em] text-[var(--color-iron-25)] uppercase">
              Mission
            </span>
            <span className="text-xs font-semibold tracking-[0.05em] text-[var(--color-iron-25)] uppercase">
              Control
            </span>
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium transition-colors rounded-md",
                  isActive
                    ? "text-[var(--color-iron-25)] bg-white/5"
                    : "text-[var(--color-iron-400)] hover:text-[var(--color-iron-25)] hover:bg-white/5"
                )}
              >
                {item.label}
                {isActive && (
                  <div className="h-0.5 bg-[var(--color-brand-teal)] mt-1 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="hidden sm:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-iron-500)]" />
              <input
                type="text"
                placeholder="Search..."
                className={cn(
                  "w-48 h-9 pl-9 pr-4 rounded-full",
                  "bg-white/5 border border-white/10",
                  "text-sm text-[var(--color-iron-25)]",
                  "placeholder:text-[var(--color-iron-500)]",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-teal)]/50",
                  "transition-all focus:w-64"
                )}
              />
            </div>
          </div>
          
          {/* Theme Toggle */}
          <button
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-lg",
              "text-[var(--color-iron-400)] hover:text-[var(--color-iron-25)]",
              "hover:bg-white/5 transition-colors"
            )}
            aria-label="Toggle theme"
          >
            <Sun className="w-5 h-5" />
          </button>
          
          {/* Settings */}
          <button
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-lg",
              "text-[var(--color-iron-400)] hover:text-[var(--color-iron-25)]",
              "hover:bg-white/5 transition-colors"
            )}
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
