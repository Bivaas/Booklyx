"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, Plus, Trash2, Edit2, X, Package } from "lucide-react";
import { motion } from "framer-motion";

interface Service {
  _id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  color: string;
}

interface FormData {
  name: string;
  description: string;
  duration: number;
  price: number;
  color: string;
}

export default function ServicesPage() {
  const { data: session } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    duration: 60,
    price: 0,
    color: "#0066cc",
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/services");
      if (!response.ok) throw new Error("Failed to fetch services");
      const data = await response.json();
      setServices(data.services || []);
    } catch (err) {
      setError("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const businessResponse = await fetch("/api/business");
      if (!businessResponse.ok) throw new Error("Business not found");
      const { business } = await businessResponse.json();

      if (editingId) {
        const response = await fetch(`/api/services/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error("Failed to update service");
      } else {
        const response = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            businessId: business._id,
          }),
        });
        if (!response.ok) throw new Error("Failed to create service");
      }

      resetForm();
      fetchServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save service");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete service");
      setDeleteConfirm(null);
      fetchServices();
    } catch (err) {
      setError("Failed to delete service");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      duration: 60,
      price: 0,
      color: "#0066cc",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (service: Service) => {
    setFormData({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      color: service.color,
    });
    setEditingId(service._id);
    setShowForm(true);
  };

  return (
    <div className="p-8">
      {/* Page Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Services</h1>
              <p className="text-muted-foreground mt-1">Manage the services you offer</p>
            </div>
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Service" : "Add New Service"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Update service details" : "Create a new service offering"}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm">Service Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Hair Cut, Consultation"
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm">Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description of the service"
                    rows={3}
                    className="mt-2 w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="duration" className="text-sm">Duration (min) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration: parseInt(e.target.value) || 0,
                        })
                      }
                      min="15"
                      step="15"
                      required
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="price" className="text-sm">Price ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price / 100}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: Math.round(parseFloat(e.target.value) * 100) || 0,
                        })
                      }
                      min="0"
                      step="0.01"
                      required
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="color" className="text-sm">Color</Label>
                    <div className="mt-2 flex gap-2">
                      <input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) =>
                          setFormData({ ...formData, color: e.target.value })
                        }
                        className="h-9 w-12 border border-border rounded-lg cursor-pointer"
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

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={submitting || !formData.name}
                  >
                    {submitting ? "Saving..." : editingId ? "Update" : "Create"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <motion.div
          className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </motion.div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-2 border-border border-t-primary rounded-full mx-auto mb-4"
          />
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-1">No services yet</h3>
            <p className="text-sm text-muted-foreground mb-6">Create your first service to get started</p>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {services.map((service, index) => (
            <motion.div
              key={service._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: service.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base">{service.name}</CardTitle>
                        {service.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {service.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">{service.duration} min</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-medium">${(service.price / 100).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(service)}
                      className="flex-1"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Dialog open={deleteConfirm === service._id} onOpenChange={(open: boolean) => setDeleteConfirm(open ? service._id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Service</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete "{service.name}"? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex gap-3">
                          <Button
                            variant="destructive"
                            onClick={() => handleDelete(service._id)}
                            className="flex-1"
                          >
                            Delete
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setDeleteConfirm(null)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
