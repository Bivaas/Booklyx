"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Calendar, Users, Bell, ArrowRight, LogOut } from "lucide-react";

interface Business {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  phone?: string;
  address?: string;
  color: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const res = await fetch("/api/businesses");
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data.businesses || []);
      }
    } catch (error) {
      console.error("Failed to fetch businesses:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/60 bg-card/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center shadow-sm">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">Booklyx</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {status === "loading" ? (
              <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
            ) : session?.user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{session.user.name || session.user.email}</p>
                  <p className="text-xs text-muted-foreground">{session.user.email}</p>
                </div>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">Dashboard</Button>
                </Link>
                <Link href="/auth/signout">
                  <Button variant="outline" size="sm" className="gap-2">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative max-w-4xl mx-auto px-6 py-32">
        {/* Decorative gradient blur */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
        
        <div className="text-center mb-20">
          <div className="inline-block mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-6">
              ✨ Modern Booking Platform
            </span>
          </div>
          <h2 className="text-6xl font-bold text-foreground mb-6 tracking-tight leading-tight">
            Professional Booking
            <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Management</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A developer-grade booking system designed for reliability, clarity, and seamless integration. Built for professionals who value precision.
          </p>
          <div className="flex justify-center gap-3 flex-wrap mt-8">
            <Link href="/auth/signin">
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              Documentation
            </Button>
          </div>
        </div>
      </section>

      {/* Businesses Listing Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-border/60">
        <div className="mb-12 text-center">
          <h3 className="text-3xl font-bold text-foreground mb-3 tracking-tight">Available Businesses</h3>
          <p className="text-muted-foreground text-lg">Browse and book appointments with approved businesses</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading businesses...</p>
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No businesses available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((business) => (
              <Link key={business.id} href={`/${business.slug}`}>
                <Card className="hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer h-full" style={{ borderTopColor: business.color, borderTopWidth: "4px" }}>
                  <div className="p-6">
                    {business.logo && (
                      <img src={business.logo} alt={business.name} className="h-10 mb-3 object-contain" />
                    )}
                    <h3 className="font-bold text-lg text-foreground mb-2">{business.name}</h3>
                    {business.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{business.description}</p>
                    )}
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      {business.phone && <span>📞 {business.phone}</span>}
                      {business.address && <span className="line-clamp-1">📍 {business.address}</span>}
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" size="sm" className="w-full">
                        Book Now <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-foreground mb-4">Everything you need</h3>
          <p className="text-muted-foreground text-lg">Powerful features designed for modern businesses</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <Card className="hover:shadow-lg hover:border-primary/20 transition-all duration-300 group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground mb-2 text-lg">Smart Scheduling</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Intuitive calendar interface with real-time availability management and conflict prevention.
                </p>
              </div>
            </div>
          </Card>

          {/* Feature 2 */}
          <Card className="hover:shadow-lg hover:border-primary/20 transition-all duration-300 group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground mb-2 text-lg">Team Management</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Manage multiple staff members, their services, and individual availability rules.
                </p>
              </div>
            </div>
          </Card>

          {/* Feature 3 */}
          <Card className="hover:shadow-lg hover:border-primary/20 transition-all duration-300 group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground mb-2 text-lg">Notifications</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Automated email reminders and confirmations for bookings, cancellations, and updates.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="max-w-6xl mx-auto px-6 py-24 border-t border-border/60">
        <div className="mb-16 text-center">
          <h3 className="text-3xl font-bold text-foreground mb-4">Built for Enterprise</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Designed with the discipline and precision expected in professional environments. Security-first, scalability-ready.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Dark Mode", desc: "Full theme support", icon: "🌓" },
            { label: "Accessibility", desc: "WCAG compliant", icon: "♿" },
            { label: "Real-time Sync", desc: "Live updates", icon: "⚡" },
            { label: "API First", desc: "REST endpoints", icon: "🔌" },
            { label: "Rate Limiting", desc: "DDoS protection", icon: "🛡️" },
            { label: "Email Digest", desc: "Smart notifications", icon: "📧" },
            { label: "Audit Logs", desc: "Full tracking", icon: "📊" },
            { label: "Mobile Ready", desc: "Responsive design", icon: "📱" },
          ].map((item) => (
            <div key={item.label} className="bg-gradient-to-br from-secondary to-secondary/50 rounded-xl p-5 hover:shadow-md transition-all duration-300 border border-border/40 hover:border-primary/20">
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="font-semibold text-foreground text-sm mb-1">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 py-24">
        <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl p-12 text-center shadow-xl border border-primary/20">
          <h3 className="text-3xl font-bold mb-4">Ready to streamline your bookings?</h3>
          <p className="mb-8 opacity-95 text-lg">
            Set up your booking system in minutes. No credit card required.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link href="/auth/signin">
              <Button variant="secondary" size="lg">
                Start Free
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary/20">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary mt-20 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <p className="font-semibold text-foreground text-sm mb-3">Product</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">Security</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm mb-3">Company</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition">About</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm mb-3">Resources</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition">Docs</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">API</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">Status</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm mb-3">Legal</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition">Privacy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">Terms</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">License</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex justify-between items-center text-xs text-muted-foreground">
            <p>&copy; 2026 Booklyx. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-foreground transition">Twitter</a>
              <a href="#" className="hover:text-foreground transition">GitHub</a>
              <a href="#" className="hover:text-foreground transition">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
