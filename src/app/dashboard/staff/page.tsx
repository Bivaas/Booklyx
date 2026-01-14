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
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Members</h1>
          <p className="text-gray-600 mt-2">Manage your team members</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Staff
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {editingId ? "Edit Staff Member" : "Add New Staff Member"}
            </h2>
            <button
              onClick={resetForm}
              className="p-1 hover:bg-gray-100 rounded-lg"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={submitting || !formData.name}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {submitting ? "Saving..." : editingId ? "Update Staff" : "Add Staff"}
              </Button>
              <Button type="button" onClick={resetForm} variant="outline">
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Staff List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff...</p>
        </div>
      ) : staff.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600 mb-4">No staff members yet</p>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Staff Member
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {staff.map((member) => (
            <Card key={member._id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {member.name}
                  </h3>
                  {member.specialization && (
                    <p className="text-sm text-gray-600 mt-1">
                      {member.specialization}
                    </p>
                  )}
                  <div className="flex flex-col gap-2 mt-3 text-sm text-gray-600">
                    {member.email && <span>📧 {member.email}</span>}
                    {member.phone && <span>📞 {member.phone}</span>}
                  </div>
                </div>

                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(member)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <Edit2 className="h-4 w-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(member._id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
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
