"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogOut, Calendar, Settings, Users, Package, ShieldCheck, User, Menu, X, Clock } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Role } from "@/lib/roles";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const data = session?.data;
  const status = session?.status;

  useEffect(() => {
    setMounted(true);
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/dashboard");
    }
  }, [status, router]);

  // Handle undefined session during build/SSG
  if (!session) {
    return null;
  }

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

  // Define Navigation based on Role
  let navItems = [
    { href: "/dashboard", label: "My Bookings", icon: <Calendar className="w-4 h-4" /> },
    { href: "/dashboard/profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { href: "/dashboard/business", label: "Register Business", icon: <Package className="w-4 h-4" /> },
  ];

  const role = data?.user?.role;

  if (role === Role.OWNER) {
    navItems = [
      { href: "/dashboard", label: "Incoming Bookings", icon: <Calendar className="w-4 h-4" /> },
      { href: "/dashboard/services", label: "Services", icon: <Package className="w-4 h-4" /> },
      { href: "/dashboard/staff", label: "Staff", icon: <Users className="w-4 h-4" /> },
      { href: "/dashboard/schedules", label: "Schedules", icon: <Clock className="w-4 h-4" /> },
      { href: "/dashboard/business", label: "Business Profile", icon: <Settings className="w-4 h-4" /> },
    ];
  } else if (role === Role.ADMIN) {
    navItems = [
      { href: "/dashboard/admin", label: "Approvals", icon: <ShieldCheck className="w-4 h-4" /> },
      { href: "/dashboard/analytics", label: "System Data", icon: <Settings className="w-4 h-4" /> },
    ];
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen flex-col md:flex-row">
        {/* Mobile Menu Button */}
        <div className="md:hidden sticky top-0 z-50 border-b border-border/60 bg-card/80 backdrop-blur-xl h-16 flex items-center px-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-secondary rounded-lg"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <span className="ml-3 font-semibold text-foreground">Booklyx</span>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-30 top-16"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`absolute md:relative md:flex top-16 md:top-0 left-0 right-0 md:right-auto z-40 transition-all duration-300 ${
            sidebarOpen ? "block" : "hidden"
          } md:block`}
        >
          <Sidebar items={navItems} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header - Hidden on Mobile (has mobile menu instead) */}
          <motion.div
            className="hidden md:flex h-16 border-b border-border/60 bg-card/80 backdrop-blur-xl items-center justify-between px-4 md:px-8 sticky top-0 z-40 shadow-sm"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex-1">
              <Link href="/" className="hover:opacity-80 transition-opacity inline-block">
                <p className="text-sm text-muted-foreground">Welcome back</p>
                <p className="font-bold text-foreground text-lg">{data?.user?.name || "User"}</p>
              </Link>
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

          {/* Mobile Header with signout */}
          <div className="md:hidden h-14 border-b border-border/60 bg-card/80 backdrop-blur-xl flex items-center justify-between px-4">
            <span className="text-sm font-medium text-muted-foreground truncate">
              {data?.user?.name || "User"}
            </span>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/auth/signout">
                <Button variant="outline" size="sm" className="gap-1 text-xs px-2 py-1 h-8">
                  <LogOut className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Page Content */}
          <motion.div
            className="flex-1 overflow-y-auto pb-4 md:pb-0"
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
