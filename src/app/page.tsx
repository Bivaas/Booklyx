import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Appointment Booking</h1>
          <div className="space-x-4">
            <Link href="/auth/signin">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-4">
            Simple Appointment Booking for Your Business
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Manage bookings, schedule staff, and handle notifications all in one place.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/auth/signin">
              <Button size="lg">Get Started</Button>
            </Link>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <Card className="p-6 bg-slate-800 border-slate-700">
            <h3 className="text-xl font-bold text-white mb-2">📅 Easy Scheduling</h3>
            <p className="text-slate-300">
              Let customers book appointments at their convenience with an intuitive interface.
            </p>
          </Card>

          <Card className="p-6 bg-slate-800 border-slate-700">
            <h3 className="text-xl font-bold text-white mb-2">👥 Staff Management</h3>
            <p className="text-slate-300">
              Manage multiple staff members, their schedules, and services offered.
            </p>
          </Card>

          <Card className="p-6 bg-slate-800 border-slate-700">
            <h3 className="text-xl font-bold text-white mb-2">🔔 Notifications</h3>
            <p className="text-slate-300">
              Automated email confirmations and reminders for bookings and cancellations.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
