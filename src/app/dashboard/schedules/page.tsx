"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, AlertCircle, Clock } from "lucide-react";

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

interface StaffMember {
  _id: string;
  name: string;
  email: string;
}

interface Schedule {
  _id: string;
  staffId: string;
  staffName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
}

interface FormData {
  staffId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    staffId: "",
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "17:00",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [schedulesRes, staffRes] = await Promise.all([
        fetch("/api/schedules"),
        fetch("/api/staff"),
      ]);
      if (!schedulesRes.ok) throw new Error("Failed to fetch schedules");
      if (!staffRes.ok) throw new Error("Failed to fetch staff");
      const schedulesData = await schedulesRes.json();
      const staffData = await staffRes.json();
      setSchedules(schedulesData.schedules || []);
      setStaff(staffData.staff || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const businessRes = await fetch("/api/business");
      if (!businessRes.ok) throw new Error("Business not found");
      const { business } = await businessRes.json();

      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: business._id,
          staffId: formData.staffId,
          dayOfWeek: formData.dayOfWeek,
          startTime: formData.startTime,
          endTime: formData.endTime,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create schedule");
      }

      setShowForm(false);
      setFormData({ staffId: "", dayOfWeek: 1, startTime: "09:00", endTime: "17:00" });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save schedule");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this schedule?")) return;
    try {
      const response = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete schedule");
      fetchData();
    } catch (err) {
      setError("Failed to delete schedule");
    }
  };

  // Group schedules by staff member
  const groupedByStaff = schedules.reduce<Record<string, Schedule[]>>((acc, s) => {
    const key = s.staffName || s.staffId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Staff Schedules</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Set working hours for your staff members
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          disabled={staff.length === 0}
          title={staff.length === 0 ? "Add staff members first" : ""}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Schedule
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {staff.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-2">
            No staff members found. Add staff members first before creating schedules.
          </p>
          <Button variant="outline" onClick={() => window.location.href = "/dashboard/staff"}>
            Go to Staff
          </Button>
        </Card>
      )}

      {showForm && staff.length > 0 && (
        <Card className="p-5 mb-6">
          <h2 className="text-lg font-semibold mb-4">New Schedule</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Staff Member *</Label>
              <select
                className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md text-sm"
                value={formData.staffId}
                onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                required
              >
                <option value="">-- Select staff --</option>
                {staff.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Day of Week *</Label>
              <select
                className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md text-sm"
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
                required
              >
                {DAYS_OF_WEEK.map((day, i) => (
                  <option key={i} value={i}>{day}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time *</Label>
                <input
                  type="time"
                  className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md text-sm"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>End Time *</Label>
                <input
                  type="time"
                  className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md text-sm"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Create Schedule"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {schedules.length === 0 && staff.length > 0 && (
        <Card className="p-6 text-center">
          <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            No schedules yet. Add working hours for your staff to enable bookings.
          </p>
        </Card>
      )}

      {Object.entries(groupedByStaff).map(([staffName, staffSchedules]) => (
        <Card key={staffName} className="p-5 mb-4">
          <h3 className="font-semibold text-lg mb-3">{staffName}</h3>
          <div className="space-y-2">
            {staffSchedules
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
              .map((schedule) => (
                <div
                  key={schedule._id}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium w-24">
                      {DAYS_OF_WEEK[schedule.dayOfWeek]}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {schedule.startTime} — {schedule.endTime}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(schedule._id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
