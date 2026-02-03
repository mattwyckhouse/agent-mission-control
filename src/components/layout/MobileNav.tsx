"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListTodo, MessageSquare, RefreshCw, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Tasks", href: "/tasks", icon: ListTodo },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Ralph", href: "/ralph", icon: RefreshCw },
  { label: "Costs", href: "/costs", icon: DollarSign },
];

/**
 * MobileNav - Bottom tab navigation for mobile
 * 
 * Fixed at bottom of screen, shows on screens < 768px
 * Features:
 * - 5 tab items with icons and labels
 * - Active state with brand teal color
 * - Glass-morphism background
 */
export function MobileNav() {
  const pathname = usePathname();
  
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[200]",
        "h-14 md:hidden",
        "bg-card/90 backdrop-blur-[28px]",
        "border-t border-border",
        "safe-area-inset-bottom"
      )}
    >
      <div className="h-full flex items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5",
                "min-w-[56px] py-1",
                "transition-colors",
                isActive
                  ? "text-brand-teal"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileNav;
