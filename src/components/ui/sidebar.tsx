"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface SidebarItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

interface SidebarProps {
  items: SidebarItem[];
  className?: string;
}

export function Sidebar({ items, className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn("w-full md:w-64 bg-card/50 backdrop-blur-sm border-r border-border/60 md:h-screen overflow-y-auto sticky top-0 md:top-16", className)}>
      <div className="p-4 md:p-6">
        <Link 
          href="/" 
          className="hidden md:flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity"
          onClick={(e) => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <img src="/logo.png" alt="Booklyx" className="w-8 h-8 rounded-lg object-contain" />
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Booklyx</h2>
        </Link>

        <nav className="space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full",
                  isActive
                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                )}
              >
                {item.icon && <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export function SidebarContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex-1 overflow-y-auto", className)}>{children}</div>;
}

export function SidebarHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("h-16 border-b border-border flex items-center px-6 bg-card", className)}>{children}</div>
  );
}
