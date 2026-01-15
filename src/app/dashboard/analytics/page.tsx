"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Analytics {
  totalUsers: number;
  totalBusinesses: number;
  approvedBusinesses: number;
  pendingBusinesses: number;
  suspendedBusinesses: number;
  totalBookings: number;
  totalStaff: number;
  totalServices: number;
}

export default function AdminAnalyticsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    fetchAnalytics();
  }, [session, router]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/analytics");
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle }: { title: string; value: number | string; subtitle?: string }) => (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Overview of system data and statistics</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {loading ? (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-center py-12"
        >
          <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </motion.div>
      ) : analytics ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <StatCard title="Total Users" value={analytics.totalUsers} />
          <StatCard title="Total Businesses" value={analytics.totalBusinesses} />
          <StatCard title="Approved Businesses" value={analytics.approvedBusinesses} subtitle={`${analytics.pendingBusinesses} pending`} />
          <StatCard title="Suspended Businesses" value={analytics.suspendedBusinesses} />
          <StatCard title="Total Bookings" value={analytics.totalBookings} />
          <StatCard title="Total Staff Members" value={analytics.totalStaff} />
          <StatCard title="Total Services" value={analytics.totalServices} />
        </motion.div>
      ) : null}
    </div>
  );
}
