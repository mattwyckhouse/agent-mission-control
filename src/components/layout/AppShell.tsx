"use client";

import { ReactNode } from "react";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * AppShell - Main application layout wrapper
 * 
 * Provides the shell structure with:
 * - Header (64px) on desktop
 * - Main content area (scrollable)
 * - Mobile bottom navigation (56px)
 */
export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop/Tablet Header */}
      <Header />
      
      {/* Main Content */}
      <main
        id="main-content"
        tabIndex={-1}
        className={cn(
          "min-h-[calc(100vh-64px)]",
          "px-4 py-6 md:px-6 lg:px-12",
          "max-w-[1280px] mx-auto",
          // Add padding for mobile nav
          "pb-20 md:pb-6",
          // Remove focus outline when clicked, keep for skip link
          "focus:outline-none focus-visible:outline-none",
          className
        )}
      >
        {children}
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}

export default AppShell;
