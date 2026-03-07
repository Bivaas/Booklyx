"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Calendar,
  Users,
  Bell,
  ArrowRight,
  LogOut,
  CheckCircle,
  Shield,
  Clock,
  Building2,
  Search,
  ChevronRight,
  Phone,
  MapPin,
  Sparkles,
  LayoutDashboard,
  UserCheck,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

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

function BrandMark({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`${className} bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-sm`}>
      <Calendar className="w-[60%] h-[60%] text-primary-foreground" />
    </div>
  );
}

// Reusable section reveal wrapper
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? {} : { opacity: 0, y: 24 }}
      whileInView={reduced ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const { data: session, status } = useSession();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const reduced = useReducedMotion();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/businesses");
        if (res.ok) {
          const data = await res.json();
          setBusinesses(data.businesses || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Nav ─── */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <BrandMark />
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Booklyx
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {status === "loading" ? (
              <div className="w-7 h-7 border-2 border-border border-t-primary rounded-full animate-spin" />
            ) : session?.user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/auth/signout">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(var(--color-primary)/0.06),transparent_60%)] pointer-events-none" />
        <div className="max-w-3xl mx-auto px-6 pt-24 pb-20 text-center relative">
          <motion.div
            initial={reduced ? {} : { opacity: 0, y: 16 }}
            animate={reduced ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/8 border border-primary/15 text-xs font-medium text-primary mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Appointment scheduling, simplified
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-5"
            initial={reduced ? {} : { opacity: 0, y: 20 }}
            animate={reduced ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Your booking page,
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              ready in minutes
            </span>
          </motion.h1>

          <motion.p
            className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8"
            initial={reduced ? {} : { opacity: 0, y: 20 }}
            animate={reduced ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Set up services, add your team, define your availability, and share a
            clean booking link with your customers. No clutter, no cost.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
            initial={reduced ? {} : { opacity: 0, y: 20 }}
            animate={reduced ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href="/auth/register">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                Create your booking page
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#businesses">
              <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                <Search className="w-4 h-4" />
                Browse businesses
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="border-t border-border/40 bg-card/30">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <Reveal>
            <p className="text-center text-sm font-medium text-primary/80 tracking-wide uppercase mb-2">
              How it works
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-14 tracking-tight">
              Two sides, one platform
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-10">
            {/* For Business Owners */}
            <Reveal delay={0.1}>
              <Card className="p-6 h-full border-border/60">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">For business owners</h3>
                </div>
                <ol className="space-y-3">
                  {[
                    "Create an account and register your business",
                    "Add services, staff, and set your schedule",
                    "Submit for approval — reviewed by our team",
                    "Share your booking link and accept appointments",
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </Card>
            </Reveal>

            {/* For Customers */}
            <Reveal delay={0.2}>
              <Card className="p-6 h-full border-border/60">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">For customers</h3>
                </div>
                <ol className="space-y-3">
                  {[
                    "Browse approved businesses on the homepage",
                    "Pick a service and choose an available time",
                    "Enter your details and confirm the booking",
                    "Receive an email confirmation instantly",
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="border-t border-border/40">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <Reveal>
            <p className="text-center text-sm font-medium text-primary/80 tracking-wide uppercase mb-2">
              Features
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-4 tracking-tight">
              Everything you need, nothing you don't
            </h2>
            <p className="text-center text-muted-foreground max-w-xl mx-auto mb-14">
              Manage your appointments, team, and availability from one dashboard.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <Calendar className="w-5 h-5" />,
                title: "Schedule management",
                desc: "Define weekly availability templates. Booklyx calculates open slots automatically — no manual slot creation.",
              },
              {
                icon: <Users className="w-5 h-5" />,
                title: "Multi-staff support",
                desc: "Add team members, assign them to services, and manage individual schedules from one place.",
              },
              {
                icon: <Bell className="w-5 h-5" />,
                title: "Email notifications",
                desc: "Automatic confirmation emails to customers and booking alerts to business owners.",
              },
              {
                icon: <Shield className="w-5 h-5" />,
                title: "Business approval",
                desc: "Every business is reviewed before going live. Customers see only verified, approved listings.",
              },
              {
                icon: <Clock className="w-5 h-5" />,
                title: "Conflict prevention",
                desc: "Real-time availability checks prevent double bookings and time-slot collisions.",
              },
              {
                icon: <LayoutDashboard className="w-5 h-5" />,
                title: "Owner dashboard",
                desc: "View incoming bookings, manage services and staff, and update your business profile.",
              },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 0.06}>
                <Card className="p-5 h-full border-border/60 group hover:border-primary/20 hover:shadow-sm transition-all duration-200">
                  <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center text-primary mb-4 group-hover:bg-primary/12 transition-colors">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-foreground mb-1.5">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trust / Quality ─── */}
      <section className="border-t border-border/40 bg-card/30">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <Reveal>
            <p className="text-center text-sm font-medium text-primary/80 tracking-wide uppercase mb-2">
              Built with care
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-14 tracking-tight">
              Quality you can rely on
            </h2>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Shield className="w-4 h-4" />, label: "Rate limiting", desc: "Abuse protection built in" },
              { icon: <CheckCircle className="w-4 h-4" />, label: "Email verification", desc: "OTP-verified accounts" },
              { icon: <Clock className="w-4 h-4" />, label: "Conflict checks", desc: "No double bookings" },
              { icon: <UserCheck className="w-4 h-4" />, label: "Manual review", desc: "Every business vetted" },
            ].map((item, i) => (
              <Reveal key={item.label} delay={i * 0.06}>
                <div className="rounded-xl border border-border/60 bg-background p-4 text-center hover:border-primary/20 transition-colors">
                  <div className="w-8 h-8 mx-auto rounded-lg bg-primary/8 flex items-center justify-center text-primary mb-3">
                    {item.icon}
                  </div>
                  <p className="font-medium text-foreground text-sm mb-0.5">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Businesses / Discovery ─── */}
      <section id="businesses" className="border-t border-border/40 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <Reveal>
            <p className="text-center text-sm font-medium text-primary/80 tracking-wide uppercase mb-2">
              Directory
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-3 tracking-tight">
              Approved businesses
            </h2>
            <p className="text-center text-muted-foreground max-w-md mx-auto mb-12">
              Browse verified businesses and book an appointment directly.
            </p>
          </Reveal>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
          ) : businesses.length === 0 ? (
            <Reveal>
              <div className="text-center py-16 px-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">No businesses listed yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
                  Be the first to set up your booking page and start accepting appointments.
                </p>
                <Link href="/auth/register">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    Register your business <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </Reveal>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {businesses.map((biz, i) => (
                <Reveal key={biz.id} delay={i * 0.05}>
                  <Link href={`/${biz.slug}`}>
                    <Card className="h-full border-border/60 overflow-hidden group hover:border-primary/25 hover:shadow-md transition-all duration-200 cursor-pointer">
                      <div className="h-1" style={{ backgroundColor: biz.color }} />
                      <div className="p-5">
                        {biz.logo && (
                          <img
                            src={biz.logo}
                            alt=""
                            className="h-8 mb-3 object-contain"
                          />
                        )}
                        <h3 className="font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                          {biz.name}
                        </h3>
                        {biz.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {biz.description}
                          </p>
                        )}
                        <div className="flex flex-col gap-1 text-xs text-muted-foreground mb-4">
                          {biz.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3" /> {biz.phone}
                            </span>
                          )}
                          {biz.address && (
                            <span className="flex items-center gap-1.5 line-clamp-1">
                              <MapPin className="w-3 h-3" /> {biz.address}
                            </span>
                          )}
                        </div>
                        <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                          Book appointment <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </Card>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="border-t border-border/40">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <Reveal>
            <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/15 p-10 sm:p-14 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 tracking-tight">
                Ready to accept bookings?
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-8">
                Create your business profile, add your services, and share your
                booking link — all for free.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/auth/register">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    Get started <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Read the docs
                  </Button>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/50 bg-card/50">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <p className="font-medium text-foreground text-sm mb-3">Product</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#businesses" className="text-muted-foreground hover:text-foreground transition-colors">Businesses</a></li>
                <li><Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground text-sm mb-3">Account</p>
              <ul className="space-y-2 text-sm">
                <li><Link href="/auth/signin" className="text-muted-foreground hover:text-foreground transition-colors">Sign In</Link></li>
                <li><Link href="/auth/register" className="text-muted-foreground hover:text-foreground transition-colors">Create Account</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground text-sm mb-3">Developer</p>
              <ul className="space-y-2 text-sm">
                <li><a href="https://github.com/bivaas" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">GitHub</a></li>
                <li><a href="mailto:bivaasbaral7@gmail.com" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground text-sm mb-3">Author</p>
              <ul className="space-y-2 text-sm">
                <li><a href="https://bivaasbaral.com.np" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">Portfolio</a></li>
                <li><a href="https://bivaas.me" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">About</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Booklyx. Built by{" "}
              <a href="https://bivaasbaral.com.np" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors font-medium">Bivaas Baral</a>.
            </p>
            <div className="flex gap-5">
              <a href="https://github.com/bivaas" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
              <a href="https://www.linkedin.com/in/bivaas/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
