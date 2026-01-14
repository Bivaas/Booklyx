"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Clock, DollarSign } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  color: string;
}

interface Business {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  phone: string;
  address: string;
  timezone: string;
  color: string;
}

interface TimeSlot {
  time: Date;
  available: boolean;
}

interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  notes: string;
  serviceId: string;
  selectedDate: string;
  selectedTime: string;
}

interface BookingPageProps {
  params: {
    slug: string;
  };
}

export default function PublicBookingPage({ params }: BookingPageProps) {
  const businessSlug = params.slug;
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<BookingFormData>();

  const selectedServiceId = watch("serviceId");
  const selectedDate = watch("selectedDate");

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch business and services
  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/business/${businessSlug}`);
        if (!response.ok) {
          throw new Error("Business not found");
        }
        const data = await response.json();
        setBusiness(data.business);
        setServices(data.services);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load business");
        setBusiness(null);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessData();
  }, [businessSlug]);

  // Fetch available time slots
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!business || !selectedServiceId || !selectedDate) {
        setTimeSlots([]);
        return;
      }

      try {
        const selectedDateObj = new Date(selectedDate);
        const nextDay = new Date(selectedDateObj);
        nextDay.setDate(nextDay.getDate() + 1);

        const response = await fetch("/api/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId: business.id,
            serviceId: selectedServiceId,
            startDate: selectedDateObj.toISOString(),
            endDate: nextDay.toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch availability");
        }

        const data = await response.json();
        setTimeSlots(data.slots);
      } catch (err) {
        console.error("Availability fetch error:", err);
        setTimeSlots([]);
      }
    };

    fetchAvailability();
  }, [business, selectedServiceId, selectedDate]);

  const onSubmit = async (formData: BookingFormData) => {
    if (!business) return;

    try {
      setSubmitting(true);
      setError(null);

      const selectedService = services.find((s) => s.id === formData.serviceId);
      const [hours, minutes] = formData.selectedTime.split(":").map(Number);
      const startTime = new Date(formData.selectedDate);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + (selectedService?.duration || 60));

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          serviceId: formData.serviceId,
          customerId: formData.email,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone || undefined,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          notes: formData.notes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create booking");
      }

      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking page...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <Card className="p-8 max-w-2xl">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Error</h2>
              <p className="text-gray-600 mt-1">{error || "Business not found"}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Business Header */}
        <Card className="mb-6 p-6" style={{ borderTopColor: business.color, borderTopWidth: "4px" }}>
          <div className="flex items-start justify-between">
            <div>
              {business.logo && (
                <img src={business.logo} alt={business.name} className="h-12 mb-3" />
              )}
              <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
              {business.description && (
                <p className="text-gray-600 mt-2">{business.description}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                {business.phone && <span>📞 {business.phone}</span>}
                {business.address && <span>📍 {business.address}</span>}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Book an Appointment</h2>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-700 font-semibold">✓ Appointment booked successfully!</p>
                    <p className="text-green-600 text-sm mt-1">Check your email for confirmation details.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Service Selection */}
                <div>
                  <Label htmlFor="service" className="text-base font-semibold">
                    Select Service *
                  </Label>
                  <select
                    {...register("serviceId", { required: "Please select a service" })}
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">-- Choose a service --</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} ({service.duration} min) - ${(service.price / 100).toFixed(2)}
                      </option>
                    ))}
                  </select>
                  {errors.serviceId && (
                    <p className="text-red-500 text-sm mt-1">{errors.serviceId.message}</p>
                  )}
                </div>

                {selectedService && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>{selectedService.name}</strong> - {selectedService.duration} minutes
                      {selectedService.description && ` • ${selectedService.description}`}
                    </p>
                  </div>
                )}

                {/* Date Selection */}
                <div>
                  <Label htmlFor="date" className="text-base font-semibold">
                    Select Date *
                  </Label>
                  <input
                    type="date"
                    {...register("selectedDate", { required: "Please select a date" })}
                    min={tomorrow.toISOString().split("T")[0]}
                    max={maxDate.toISOString().split("T")[0]}
                    className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {errors.selectedDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.selectedDate.message}</p>
                  )}
                </div>

                {/* Time Selection */}
                {selectedDate && timeSlots.length > 0 && (
                  <div>
                    <Label className="text-base font-semibold">Select Time *</Label>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {timeSlots
                        .filter((slot) => slot.available)
                        .slice(0, 12)
                        .map((slot, idx) => {
                          const timeStr = new Date(slot.time).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          });
                          return (
                            <label
                              key={idx}
                              className="relative flex items-center cursor-pointer"
                            >
                              <input
                                type="radio"
                                {...register("selectedTime", { required: "Please select a time" })}
                                value={timeStr}
                                className="sr-only"
                              />
                              <span
                                className="w-full py-2 px-3 text-center text-sm font-medium rounded-lg border-2 border-gray-200 hover:border-indigo-500 cursor-pointer
                                has-[:checked]:bg-indigo-600 has-[:checked]:text-white has-[:checked]:border-indigo-600 transition"
                              >
                                {timeStr}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                    {errors.selectedTime && (
                      <p className="text-red-500 text-sm mt-1">{errors.selectedTime.message}</p>
                    )}
                  </div>
                )}

                {selectedDate && timeSlots.length === 0 && selectedServiceId && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">No available time slots for this date. Please select another date.</p>
                  </div>
                )}

                {/* Customer Information */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h3>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-base font-semibold">
                        Full Name *
                      </Label>
                      <Input
                        {...register("name", { required: "Name is required" })}
                        placeholder="John Doe"
                        className="mt-2"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-base font-semibold">
                        Email *
                      </Label>
                      <Input
                        {...register("email", {
                          required: "Email is required",
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Please enter a valid email",
                          },
                        })}
                        type="email"
                        placeholder="john@example.com"
                        className="mt-2"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-base font-semibold">
                        Phone Number (Optional)
                      </Label>
                      <Input
                        {...register("phone")}
                        type="tel"
                        placeholder="(123) 456-7890"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes" className="text-base font-semibold">
                        Notes or Special Requests (Optional)
                      </Label>
                      <textarea
                        {...register("notes")}
                        rows={3}
                        placeholder="Any special requests or additional information..."
                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting || !selectedServiceId || !selectedDate}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-lg font-semibold"
                >
                  {submitting ? "Booking..." : "Confirm Appointment"}
                </Button>
              </form>
            </Card>
          </div>

          {/* Summary Sidebar */}
          {selectedService && (
            <div>
              <Card className="p-6 sticky top-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Service</p>
                    <p className="text-base font-semibold text-gray-900">{selectedService.name}</p>
                  </div>

                  <div className="flex items-center space-x-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{selectedService.duration} minutes</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-600" />
                    <span className="text-2xl font-bold text-gray-900">
                      ${(selectedService.price / 100).toFixed(2)}
                    </span>
                  </div>

                  {selectedDate && (
                    <>
                      <div className="border-t pt-4">
                        <p className="text-sm text-gray-600">Date</p>
                        <p className="text-base font-semibold text-gray-900">
                          {new Date(selectedDate).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </>
                  )}

                  <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      💡 A confirmation email will be sent to you with all the details.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
