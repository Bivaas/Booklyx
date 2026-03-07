"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, Shield, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface UserProfile {
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setName(data.user.name || "");
      } else {
        // Fallback to session data
        setProfile({
          name: session?.user?.name || "",
          email: session?.user?.email || "",
          role: session?.user?.role || "customer",
          emailVerified: session?.user?.emailVerified || false,
          createdAt: "",
        });
        setName(session?.user?.name || "");
      }
    } catch {
      // Fallback to session data
      setProfile({
        name: session?.user?.name || "",
        email: session?.user?.email || "",
        role: session?.user?.role || "customer",
        emailVerified: session?.user?.emailVerified || false,
        createdAt: "",
      });
      setName(session?.user?.name || "");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }

      const data = await res.json();
      setProfile((prev) => prev ? { ...prev, name: data.user.name } : prev);
      setEditing(false);
      setMessage({ type: "success", text: "Profile updated successfully!" });
      await updateSession();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Update failed" });
    } finally {
      setSaving(false);
    }
  };

  const roleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "owner": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "staff": return "bg-green-500/10 text-green-500 border-green-500/20";
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full max-w-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-1">View and manage your account details</p>
      </motion.div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Account Information
            </CardTitle>
            <CardDescription>Your personal account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="w-4 h-4" /> Name
              </Label>
              {editing ? (
                <div className="flex gap-2">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="max-w-sm"
                  />
                  <Button onClick={handleSave} disabled={saving || !name.trim()}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" onClick={() => { setEditing(false); setName(profile?.name || ""); }}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-foreground text-lg">{profile?.name || "Not set"}</p>
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="w-4 h-4" /> Email
              </Label>
              <div className="flex items-center gap-3">
                <p className="text-foreground text-lg">{profile?.email}</p>
                {profile?.emailVerified ? (
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Not Verified
                  </Badge>
                )}
              </div>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Shield className="w-4 h-4" /> Role
              </Label>
              <Badge className={`${roleBadgeColor(profile?.role || "customer")} capitalize`}>
                {profile?.role || "customer"}
              </Badge>
            </div>

            {/* Account Created */}
            {profile?.createdAt && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="w-4 h-4" /> Account Created
                </Label>
                <p className="text-foreground">
                  {new Date(profile.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
