import "server-only";

/**
 * Generate available time slots dynamically in memory
 * No database storage required for individual slots
 */

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

interface Schedule {
  dayOfWeek: number;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
}

interface Booking {
  startTime: Date;
  endTime: Date;
}

/**
 * Parse HH:mm time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to HH:mm format
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Generate time slots for a specific date based on schedule
 * @param date - The date to generate slots for
 * @param schedules - Array of schedule templates
 * @param existingBookings - Array of existing bookings to exclude
 * @param slotDuration - Duration of each slot in minutes (default 30)
 * @returns Array of available time slots
 */
export function generateTimeSlots(
  date: Date,
  schedules: Schedule[],
  existingBookings: Booking[],
  slotDuration: number = 30
): TimeSlot[] {
  const dayOfWeek = date.getDay();
  const slots: TimeSlot[] = [];

  // Find schedule for this day
  const daySchedule = schedules.find((s) => s.dayOfWeek === dayOfWeek);
  if (!daySchedule) {
    return []; // No availability for this day
  }

  const startMinutes = timeToMinutes(daySchedule.startTime);
  const endMinutes = timeToMinutes(daySchedule.endTime);

  // Generate slots
  for (let current = startMinutes; current < endMinutes; current += slotDuration) {
    const slotStart = new Date(date);
    slotStart.setHours(Math.floor(current / 60), current % 60, 0, 0);

    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

    // Check if slot conflicts with existing bookings
    const isBooked = existingBookings.some((booking) => {
      return (
        (slotStart >= booking.startTime && slotStart < booking.endTime) ||
        (slotEnd > booking.startTime && slotEnd <= booking.endTime) ||
        (slotStart <= booking.startTime && slotEnd >= booking.endTime)
      );
    });

    slots.push({
      start: slotStart,
      end: slotEnd,
      available: !isBooked,
    });
  }

  return slots;
}

/**
 * Check if a specific time slot is available
 * @param startTime - Start time of the slot
 * @param duration - Duration in minutes
 * @param schedules - Schedule templates
 * @param existingBookings - Existing bookings
 * @returns true if available, false otherwise
 */
export function isSlotAvailable(
  startTime: Date,
  duration: number,
  schedules: Schedule[],
  existingBookings: Booking[]
): boolean {
  const dayOfWeek = startTime.getDay();
  const daySchedule = schedules.find((s) => s.dayOfWeek === dayOfWeek);
  
  if (!daySchedule) {
    return false; // No schedule for this day
  }

  // Check if time is within schedule
  const requestedMinutes = startTime.getHours() * 60 + startTime.getMinutes();
  const scheduleStart = timeToMinutes(daySchedule.startTime);
  const scheduleEnd = timeToMinutes(daySchedule.endTime);

  const endTime = new Date(startTime.getTime() + duration * 60000);
  const requestedEndMinutes = endTime.getHours() * 60 + endTime.getMinutes();

  if (requestedMinutes < scheduleStart || requestedEndMinutes > scheduleEnd) {
    return false; // Outside schedule hours
  }

  // Check for conflicts with existing bookings
  const hasConflict = existingBookings.some((booking) => {
    return (
      (startTime >= booking.startTime && startTime < booking.endTime) ||
      (endTime > booking.startTime && endTime <= booking.endTime) ||
      (startTime <= booking.startTime && endTime >= booking.endTime)
    );
  });

  return !hasConflict;
}

/**
 * Get next available slot
 */
export function getNextAvailableSlot(
  fromDate: Date,
  schedules: Schedule[],
  existingBookings: Booking[],
  slotDuration: number = 30,
  maxDaysAhead: number = 30
): Date | null {
  const current = new Date(fromDate);
  const maxDate = new Date(fromDate);
  maxDate.setDate(maxDate.getDate() + maxDaysAhead);

  while (current <= maxDate) {
    const slots = generateTimeSlots(current, schedules, existingBookings, slotDuration);
    const availableSlot = slots.find((slot) => slot.available);
    
    if (availableSlot) {
      return availableSlot.start;
    }

    // Move to next day
    current.setDate(current.getDate() + 1);
    current.setHours(0, 0, 0, 0);
  }

  return null; // No available slots in the next maxDaysAhead days
}
