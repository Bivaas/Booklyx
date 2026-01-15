"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle } from "lucide-react";

interface BusinessData {
  name: string;
  slug: string;
  email: string;
  description: string;
  logo: string;
  website: string;
  phone: string;
  address: string;
  timezone: string;
  color: string;
}

export default function BusinessPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [businessExists, setBusinessExists] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BusinessData>({
    name: "",
    slug: "",
    email: "",
    description: "",
    logo: "",
    website: "",
    phone: "",
    address: "",
    timezone: "UTC",
    color: "#3b82f6",
  });

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/business");
      if (response.ok) {
        const { business } = await response.json();
        setBusinessExists(true);
        setBusinessId(business._id);
        setFormData({
          name: business.name || "",
          slug: business.slug || "",
          email: business.email || "",
          description: business.description || "",
          logo: business.logo || "",
          website: business.website || "",
          phone: business.phone || "",
          address: business.address || "",
          timezone: business.timezone || "UTC",
          color: business.color || "#3b82f6",
        });
      } else {
        // No existing business, which is OK for new users
        setBusinessExists(false);
        setError(null);
      }
    } catch (err) {
      setError("Failed to load business data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (businessExists && businessId) {
        // Update existing business
        const response = await fetch(`/api/business/${businessId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error("Failed to update business");
      } else {
        // Create new business
        const response = await fetch("/api/business", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create business");
        }
        
        const { business } = await response.json();
        setBusinessId(business._id);
        setBusinessExists(true);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSubmitting(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const timezones = [
    "UTC",
    "EST",
    "CST",
    "MST",
    "PST",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Australia/Sydney",
  ];

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading business settings...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8 px-4 md:px-6 lg:px-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Business Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your business information</p>
      </div>

      {error && (
        <div className="mb-6 mx-4 md:mx-6 lg:mx-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 mx-4 md:mx-6 lg:mx-8 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-green-600 dark:text-green-400">Business settings saved successfully!</p>
        </div>
      )}

      <Card className="p-4 md:p-6 lg:p-8 mx-4 md:mx-6 lg:mx-8">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
          {/* Business Name & Slug */}
          <div>
            <Label htmlFor="name" className="text-sm md:text-base font-semibold">
              Business Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value;
                setFormData({
                  ...formData,
                  name,
                  slug: generateSlug(name),
                });
              }}
              placeholder="Your business name"
              required
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              💡 Booking URL: https://booklyx.vercel.app/booking/{formData.slug}
            </p>
          </div>

          <div>
            <Label htmlFor="email" className="text-sm md:text-base font-semibold">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="mt-2"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm md:text-base font-semibold">
              Description
            </Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description of your business"
              rows={3}
              className="mt-2 w-full px-3 py-2 border border-input rounded-lg bg-background"
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone" className="text-sm md:text-base font-semibold">
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="(123) 456-7890"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="website" className="text-sm md:text-base font-semibold">
                Website
              </Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                placeholder="https://example.com"
                className="mt-2"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="address" className="text-sm md:text-base font-semibold">
              Address
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="123 Main Street, City, State 12345"
              className="mt-2"
            />
          </div>

          {/* Timezone & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timezone" className="text-sm md:text-base font-semibold">
                Timezone
              </Label>
              <select
                id="timezone"
                value={formData.timezone}
                onChange={(e) =>
                  setFormData({ ...formData, timezone: e.target.value })
                }
                className="mt-2 w-full px-3 py-2 border border-input rounded-lg bg-background"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="color" className="text-sm md:text-base font-semibold">
                Brand Color (Optional)
              </Label>
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="h-10 w-12 border border-input rounded-lg cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Logo */}
          <div>
            <Label htmlFor="logo" className="text-sm md:text-base font-semibold">
              Logo URL
            </Label>
            <Input
              id="logo"
              type="url"
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="mt-2"
            />
            {formData.logo && (
              <div className="mt-3">
                <img
                  src={formData.logo}
                  alt="Logo preview"
                  className="h-12 max-w-xs"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {submitting ? "Saving..." : businessExists ? "Save Changes" : "Create Business"}
            </Button>
            <Button
              type="button"
              onClick={fetchBusinessData}
              variant="outline"
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-4 md:p-6 mt-6 md:mt-8 mx-4 md:mx-6 lg:mx-8 bg-primary/5 border-primary/20">
        <h3 className="font-semibold text-foreground mb-2">💡 Booking Link</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-background rounded border border-primary/20">
          <code className="flex-1 text-xs md:text-sm text-muted-foreground break-all">
            https://booklyx.vercel.app/booking/{formData.slug}
          </code>
          <button
            onClick={() =>
              navigator.clipboard.writeText(`https://booklyx.vercel.app/booking/${formData.slug}`)
            }
            className="w-full sm:w-auto px-3 py-1 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded whitespace-nowrap"
          >
            Copy
          </button>
        </div>
      </Card>
    </div>
  );
}
