"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Business {
  _id: string;
  name: string;
  email: string;
  slug: string;
  description?: string;
  status: "pending" | "approved" | "suspended";
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  suspendedAt?: string;
  suspendedReason?: string;
}

export default function AdminApprovalsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "suspended">("pending");

  useEffect(() => {
    if (session?.user?.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    fetchBusinesses();
  }, [session, filter, router]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/business-approval?status=${filter}`);
      if (!response.ok) throw new Error("Failed to fetch businesses");
      const { businesses } = await response.json();
      setBusinesses(businesses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch businesses");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (businessId: string) => {
    try {
      setProcessing(businessId);
      setError(null);
      const response = await fetch("/api/admin/business-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          action: "approve",
        }),
      });

      if (!response.ok) throw new Error("Failed to approve business");
      
      // Refresh the list
      await fetchBusinesses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve business");
    } finally {
      setProcessing(null);
    }
  };

  const handleSuspend = async (businessId: string, reason: string = "") => {
    try {
      setProcessing(businessId);
      setError(null);
      const response = await fetch("/api/admin/business-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          action: "suspend",
          reason,
        }),
      });

      if (!response.ok) throw new Error("Failed to suspend business");
      
      // Refresh the list
      await fetchBusinesses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to suspend business");
    } finally {
      setProcessing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "suspended":
        return <XCircle className="w-4 h-4" />;
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Business Approvals</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Review and approve pending business registrations</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-3">
        {["pending", "approved", "suspended"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({businesses.length})
          </button>
        ))}
      </div>

      {loading ? (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-center py-12"
        >
          <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading businesses...</p>
        </motion.div>
      ) : businesses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No {filter} businesses</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filter === "pending" 
                ? "All pending businesses have been processed."
                : `No ${filter} businesses at this time.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {businesses.map((business) => (
            <Card key={business._id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{business.name}</h3>
                      <Badge className={getStatusColor(business.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(business.status)}
                          {business.status}
                        </span>
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{business.email}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">Slug: {business.slug}</p>
                    {business.description && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{business.description}</p>
                    )}
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      <p>Created: {new Date(business.createdAt).toLocaleDateString()}</p>
                      {business.approvedAt && (
                        <p>Approved: {new Date(business.approvedAt).toLocaleDateString()} {business.approvedBy ? `by ${business.approvedBy}` : ""}</p>
                      )}
                      {business.suspendedAt && (
                        <div>
                          <p>Suspended: {new Date(business.suspendedAt).toLocaleDateString()}</p>
                          {business.suspendedReason && <p>Reason: {business.suspendedReason}</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {business.status === "pending" && (
                      <>
                        <Button
                          onClick={() => handleApprove(business._id)}
                          disabled={processing === business._id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {processing === business._id ? "Approving..." : "Approve"}
                        </Button>
                        <Button
                          onClick={() => handleSuspend(business._id)}
                          disabled={processing === business._id}
                          variant="outline"
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {business.status === "suspended" && (
                      <Button
                        onClick={() => handleApprove(business._id)}
                        disabled={processing === business._id}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {processing === business._id ? "Restoring..." : "Restore"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}
    </div>
  );
}
