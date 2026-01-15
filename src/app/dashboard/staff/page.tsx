"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit2, AlertCircle, X } from "lucide-react";

interface Staff {
  _id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  specialization: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    specialization: "",
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/staff");
      if (!response.ok) throw new Error("Failed to fetch staff");
      const data = await response.json();
      setStaff(data.staff || []);
    } catch (err) {
      setError("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      // Get business ID from session
      const businessResponse = await fetch("/api/business");
      if (!businessResponse.ok) throw new Error("Business not found");
      const { business } = await businessResponse.json();

      if (editingId) {
        // Update existing staff
        const response = await fetch(`/api/staff/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error("Failed to update staff");
      } else {
        // Create new staff
        const response = await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            businessId: business._id,
          }),
        });
        if (!response.ok) throw new Error("Failed to create staff");
      }

      resetForm();
      fetchStaff(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save staff");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;
    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete staff");
      fetchStaff(); // Refresh the list
    } catch (err) {
      setError("Failed to delete staff");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      specialization: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (member: Staff) => {
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      specialization: member.specialization,
    });
    setEditingId(member._id);
    setShowForm(true);
  };

  return (
    <div className="w-full">
      <div className="mb-8 px-4 md:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Staff Members</h1>
          <p className="text-muted-foreground mt-2">Manage your team members</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add Staff
        </Button>
      </div>

      {error && (
        <div className="mb-6 mx-4 md:mx-6 lg:mx-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="p-4 md:p-6 mb-8 mx-4 md:mx-6 lg:mx-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <h2 className="text-lg md:text-xl font-bold text-foreground">
              {editingId ? "Edit Staff Member" : "Add New Staff Member"}
            </h2>
            <button
              onClick={resetForm}
              className="p-1 hover:bg-secondary rounded-lg self-start sm:self-auto"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Full name"
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@example.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="(123) 456-7890"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    specialization: e.target.value,
                  })
                }
                placeholder="e.g., Hair Styling, Massage Therapy"
                className="mt-1"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={submitting || !formData.name}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {submitting ? "Saving..." : editingId ? "Update Staff" : "Add Staff"}
              </Button>
              <Button type="button" onClick={resetForm} variant="outline" className="w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Staff List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading staff...</p>
        </div>
      ) : staff.length === 0 ? (
        <Card className="p-8 md:p-12 mx-4 md:mx-6 lg:mx-8 text-center">
          <p className="text-muted-foreground mb-4">No staff members yet</p>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Staff Member
          </Button>
        </Card>
      ) : (
        <div className="space-y-4 px-4 md:px-6 lg:px-8">
          {staff.map((member) => (
            <Card key={member._id} className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground">
                    {member.name}
                  </h3>
                  {member.specialization && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {member.specialization}
                    </p>
                  )}
                  <div className="flex flex-col gap-1 mt-3 text-sm text-muted-foreground">
                    {member.email && <span className="break-all">📧 {member.email}</span>}
                    {member.phone && <span>📞 {member.phone}</span>}
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => handleEdit(member)}
                    className="flex-1 sm:flex-none p-2 hover:bg-secondary rounded-lg transition"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4 text-blue-600 mx-auto" />
                  </button>
                  <button
                    onClick={() => handleDelete(member._id)}
                    className="flex-1 sm:flex-none p-2 hover:bg-secondary rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-600 mx-auto" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
