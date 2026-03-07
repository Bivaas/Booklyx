"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  Phone,
  MapPin,
  ArrowLeft,
  Info,
} from "lucide-react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";

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
  time: string;
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
  params: Promise<{ slug: string }>;
}

export default function PublicBookingPage({ params }: BookingPageProps) {
  const resolvedParams = use(params);
  const businessSlug = resolvedParams.slug;
  const reduced = useReducedMotion();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<BookingFormData>();

  const selectedServiceId = watch("serviceId");
  const selectedDate = watch("selectedDate");
  const selectedTime = watch("selectedTime");

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/business/${businessSlug}`);
        if (!response.ok) throw new Error("Business not found");
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
    })();
  }, [businessSlug]);

  useEffect(() => {
    if (!business || !selectedServiceId || !selectedDate) {
      setTimeSlots([]);
      return;
    }
    (async () => {
      try {
        const d = new Date(selectedDate);
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        const res = await fetch("/api/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId: business.id,
            serviceId: selectedServiceId,
            startDate: d.toISOString(),
            endDate: next.toISOString(),
          }),
        });
        if (!res.ok) throw new Error("Failed to fetch availability");
        const data = await res.json();
        setTimeSlots(data.slots);
      } catch {
        setTimeSlots([]);
      }
    })();
  }, [business, selectedServiceId, selectedDate]);

  const onSubmit = async (formData: BookingFormData) => {
    if (!business) return;
    try {
      setSubmitting(true);
      setError(null);
      const svc = services.find((s) => s.id === formData.serviceId);
      const [h, m] = formData.selectedTime.split(":").map(Number);
      const startTime = new Date(formData.selectedDate);
      startTime.setHours(h, m, 0, 0);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + (svc?.duration || 60));

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business.id,
          serviceId: formData.serviceId,
          customerId: formData.email,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          notes: formData.notes || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create booking");
      }
      setSuccess(true);
      reset();
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
  const availableSlots = timeSlots.filter((s) => s.available);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // ── Error / Not found ──
  if (!business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="p-8 max-w-md w-full text-center border-border/60">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-foreground mb-1">Business not found</h2>
          <p className="text-sm text-muted-foreground mb-5">{error || "This business doesn't exist or isn't available."}</p>
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // ── Success ──
  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={reduced ? {} : { opacity: 0, scale: 0.95 }}
          animate={reduced ? {} : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-10 max-w-md w-full text-center border-border/60">
            <div className="w-14 h-14 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Appointment booked</h2>
            <p className="text-sm text-muted-foreground mb-6">
              A confirmation email has been sent with the details.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" size="sm" onClick={() => setSuccess(false)}>
                Book another
              </Button>
              <Link href="/">
                <Button size="sm" variant="ghost">Back to home</Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-primary to-primary/80 rounded-md flex items-center justify-center">
              <Calendar className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">Booklyx</span>
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Business Header */}
        <motion.div
          initial={reduced ? {} : { opacity: 0, y: 12 }}
          animate={reduced ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="mb-8 border-border/60 overflow-hidden">
            <div className="h-1" style={{ backgroundColor: business.color }} />
            <div className="p-6">
              <div className="flex items-start gap-4">
                {business.logo && (
                  <img src={business.logo} alt="" className="h-12 w-auto object-contain flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold text-foreground">{business.name}</h1>
                  {business.description && (
                    <p className="text-sm text-muted-foreground mt-1">{business.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                    {business.phone && (
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {business.phone}</span>
                    )}
                    {business.address && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {business.address}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Booking requirement note */}
        <motion.div
          initial={reduced ? {} : { opacity: 0, y: 8 }}
          animate={reduced ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-6"
        >
          <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-primary/5 border border-primary/15 text-sm">
            <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              Booking requires a verified Booklyx account. Enter the email you registered with, or{" "}
              <Link href="/auth/register" className="text-primary hover:text-primary/80 font-medium">
                create an account
              </Link>{" "}
              first.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <motion.div
            className="lg:col-span-2"
            initial={reduced ? {} : { opacity: 0, y: 12 }}
            animate={reduced ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="border-border/60">
              <div className="p-6 sm:p-8">
                <h2 className="text-xl font-bold text-foreground mb-6">Book an appointment</h2>

                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-5"
                    >
                      <div className="p-3.5 bg-destructive/8 border border-destructive/25 rounded-lg flex items-start gap-2.5">
                        <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Step 1: Service */}
                  <fieldset>
                    <legend className="text-sm font-semibold text-foreground mb-2">1. Select a service</legend>
                    <div className="grid gap-2">
                      {services.map((svc) => (
                        <label
                          key={svc.id}
                          className="relative flex items-center gap-3 p-3 rounded-lg border border-input bg-background cursor-pointer hover:border-primary/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors"
                        >
                          <input
                            type="radio"
                            {...register("serviceId", { required: "Please select a service" })}
                            value={svc.id}
                            className="sr-only"
                          />
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: svc.color }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{svc.name}</p>
                            {svc.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{svc.description}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-foreground">${(svc.price / 100).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">{svc.duration} min</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    {errors.serviceId && (
                      <p className="text-destructive text-xs mt-1">{errors.serviceId.message}</p>
                    )}
                  </fieldset>

                  {/* Step 2: Date */}
                  <fieldset>
                    <legend className="text-sm font-semibold text-foreground mb-2">2. Pick a date</legend>
                    <input
                      type="date"
                      {...register("selectedDate", { required: "Please select a date" })}
                      min={tomorrow.toISOString().split("T")[0]}
                      max={maxDate.toISOString().split("T")[0]}
                      className="w-full px-3 py-2.5 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input text-foreground text-sm"
                    />
                    {errors.selectedDate && (
                      <p className="text-destructive text-xs mt-1">{errors.selectedDate.message}</p>
                    )}
                  </fieldset>

                  {/* Step 3: Time */}
                  {selectedDate && selectedServiceId && (
                    <fieldset>
                      <legend className="text-sm font-semibold text-foreground mb-2">3. Choose a time</legend>
                      {availableSlots.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {availableSlots.slice(0, 16).map((slot, idx) => (
                            <label key={idx} className="relative cursor-pointer">
                              <input
                                type="radio"
                                {...register("selectedTime", { required: "Please select a time" })}
                                value={slot.time}
                                className="sr-only"
                              />
                              <span className="block py-2 px-2 text-center text-sm font-medium rounded-lg border border-input bg-background text-foreground hover:border-primary/30 has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary transition-colors">
                                {slot.time}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-muted/40 rounded-lg">
                          <p className="text-sm text-muted-foreground">No available slots for this date. Try another date.</p>
                        </div>
                      )}
                      {errors.selectedTime && (
                        <p className="text-destructive text-xs mt-1">{errors.selectedTime.message}</p>
                      )}
                    </fieldset>
                  )}

                  {/* Step 4: Customer Info */}
                  <fieldset className="border-t border-border/50 pt-6">
                    <legend className="text-sm font-semibold text-foreground mb-3">4. Your details</legend>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="name">Full name</Label>
                        <Input
                          {...register("name", { required: "Name is required" })}
                          id="name"
                          placeholder="Jane Smith"
                        />
                        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          {...register("email", {
                            required: "Email is required",
                            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
                          })}
                          id="email"
                          type="email"
                          placeholder="jane@example.com"
                        />
                        <p className="text-xs text-muted-foreground">Use the email linked to your Booklyx account</p>
                        {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          {...register("phone", {
                            required: "Phone number is required",
                            pattern: { value: /^[\d+\-\s()]+$/, message: "Enter a valid phone number" },
                          })}
                          id="phone"
                          type="tel"
                          placeholder="(123) 456-7890"
                        />
                        {errors.phone && <p className="text-destructive text-xs">{errors.phone.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="notes">Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
                        <textarea
                          {...register("notes")}
                          id="notes"
                          rows={2}
                          placeholder="Anything the business should know…"
                          className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground text-sm resize-none"
                        />
                      </div>
                    </div>
                  </fieldset>

                  <Button
                    type="submit"
                    disabled={submitting || !selectedServiceId || !selectedDate}
                    className="w-full"
                    size="lg"
                  >
                    {submitting ? "Booking…" : "Confirm appointment"}
                  </Button>
                </form>
              </div>
            </Card>
          </motion.div>

          {/* Summary Sidebar */}
          <motion.div
            initial={reduced ? {} : { opacity: 0, y: 12 }}
            animate={reduced ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="border-border/60 sticky top-20">
              <div className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Booking summary</h3>

                {selectedService ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Service</p>
                      <p className="font-medium text-foreground">{selectedService.name}</p>
                    </div>

                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{selectedService.duration} minutes</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xl font-bold text-foreground">
                        {(selectedService.price / 100).toFixed(2)}
                      </span>
                    </div>

                    {selectedDate && (
                      <div className="border-t border-border/50 pt-4">
                        <p className="text-xs text-muted-foreground">Date</p>
                        <p className="font-medium text-foreground">
                          {new Date(selectedDate).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    )}

                    {selectedTime && (
                      <div>
                        <p className="text-xs text-muted-foreground">Time</p>
                        <p className="font-medium text-foreground">{selectedTime}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Select a service to see the summary.</p>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
