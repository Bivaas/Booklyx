"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogOut, Calendar, Settings, Users, Package } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Handle undefined session during build/SSG
  if (!session) {
    return null;
  }

  const { data, status } = session;

  useEffect(() => {
    setMounted(true);
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-center"
        >
          <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const navItems = [
    { href: "/dashboard", label: "Bookings", icon: <Calendar className="w-4 h-4" /> },
    { href: "/dashboard/services", label: "Services", icon: <Package className="w-4 h-4" /> },
    { href: "/dashboard/staff", label: "Staff", icon: <Users className="w-4 h-4" /> },
    { href: "/dashboard/business", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar items={navItems} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <motion.div
            className="h-16 border-b border-border/60 bg-card/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <p className="font-bold text-foreground text-lg">{data?.user?.name || "User"}</p>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/auth/signout">
                <Button variant="outline" size="sm" className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Page Content */}
          <motion.div
            className="flex-1 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
