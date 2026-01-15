"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Calendar, ArrowLeft, CheckCircle, Shield, Users, Mail, Clock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/60 bg-card/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center shadow-sm">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">Booklyx</h1>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative max-w-4xl mx-auto px-6 py-16"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
        
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4 tracking-tight">
            Booklyx Documentation
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about using Booklyx to manage your bookings and grow your business
          </p>
        </div>
      </motion.div>

      {/* Documentation Content */}
      <div className="max-w-4xl mx-auto px-6 pb-24 space-y-12">
        {/* Section 1: Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Introduction to Booklyx</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Booklyx is a professional booking management system designed for businesses that need reliable, 
                  secure, and easy-to-use scheduling tools. Whether you run a salon, consultancy, or any service-based 
                  business, Booklyx helps you manage appointments, staff schedules, and customer communications in one place.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Real-time availability management</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Automated email notifications</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Multi-staff scheduling</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Section 2: Creating an Account */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">How to Create an Account</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Getting started with Booklyx is simple and secure:
                </p>
                <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
                  <li>Click "Get Started" or "Sign Up" from the homepage</li>
                  <li>Enter your email address and create a secure password (minimum 8 characters)</li>
                  <li>Click "Send OTP" to receive a verification code</li>
                  <li>Check your email for the 6-digit verification code</li>
                  <li>Enter the code to verify your account</li>
                  <li>Your account is now active and ready to use!</li>
                </ol>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Section 3: Email Verification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Email Verification Overview</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Email verification ensures the security of your account and enables important notifications:
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-primary/5 rounded-lg">
                    <p className="text-sm font-medium text-foreground mb-1">✅ Why We Verify</p>
                    <p className="text-sm text-muted-foreground">
                      Verification confirms account ownership, prevents spam, and ensures booking confirmations reach you.
                    </p>
                  </div>
                  <div className="p-3 bg-primary/5 rounded-lg">
                    <p className="text-sm font-medium text-foreground mb-1">⏱️ Code Expiration</p>
                    <p className="text-sm text-muted-foreground">
                      Verification codes expire after 5 minutes for security. You can request a new code if needed.
                    </p>
                  </div>
                  <div className="p-3 bg-primary/5 rounded-lg">
                    <p className="text-sm font-medium text-foreground mb-1">🔒 Security First</p>
                    <p className="text-sm text-muted-foreground">
                      Your email is never shared with third parties and is only used for essential account communications.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Section 4: Booking Workflow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Booking Workflow</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Booking an appointment is quick and straightforward:
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Browse Businesses</p>
                      <p className="text-sm text-muted-foreground">Explore approved businesses on the homepage</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Select Service & Time</p>
                      <p className="text-sm text-muted-foreground">Choose from available services and pick your preferred time slot</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Enter Your Details</p>
                      <p className="text-sm text-muted-foreground">Provide your name, email, and phone number</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm flex-shrink-0">
                      4
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Receive Confirmation</p>
                      <p className="text-sm text-muted-foreground">Get instant email confirmation with booking details</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Section 5: Business Registration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Business Registration Process</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Want to list your business on Booklyx? Here's how:
                </p>
                <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
                  <li>Create and verify your account</li>
                  <li>Navigate to Dashboard → Business section</li>
                  <li>Fill in your business details (name, description, contact info)</li>
                  <li>Add your services with pricing and duration</li>
                  <li>Set up your team members and their availability</li>
                  <li>Submit for approval (reviewed within 24-48 hours)</li>
                  <li>Once approved, your business goes live and can accept bookings!</li>
                </ol>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Section 6: Admin Approval */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Admin Approval Overview</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  To maintain quality and trust, all businesses undergo a review process:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Manual Review</p>
                      <p className="text-sm text-muted-foreground">
                        Each submission is reviewed by our team to ensure accuracy and professionalism
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Review Time</p>
                      <p className="text-sm text-muted-foreground">
                        Typically 24-48 hours; you'll be notified via email when approved or if changes are needed
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Section 7: Privacy & Trust */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Card className="p-8 border-primary/20">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Privacy & Trust Principles</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p className="leading-relaxed">
                    <strong className="text-foreground">Your Data is Protected:</strong> We use industry-standard 
                    encryption and security practices to keep your information safe. Your personal details are 
                    never shared with third parties without your consent.
                  </p>
                  <p className="leading-relaxed">
                    <strong className="text-foreground">Transparent Communication:</strong> We only send emails 
                    related to your bookings, account security, or important updates. No spam, ever.
                  </p>
                  <p className="leading-relaxed">
                    <strong className="text-foreground">Fair Use:</strong> Our platform is designed for legitimate 
                    business use. We have measures in place to prevent abuse while ensuring smooth service for all users.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Section 8: Limitations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card className="p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Limitations and Fair-Use Rules</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  To ensure quality service for everyone, please note:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Booking limits apply to prevent spam (1 booking per user per business per day)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>New accounts have a brief warm-up period before booking (15 minutes)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Repeated failed verification attempts may temporarily restrict account access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Businesses must be approved before accepting bookings</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="text-center pt-8"
        >
          <Card className="p-12 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <h3 className="text-3xl font-bold text-foreground mb-4">Ready to Get Started?</h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of businesses using Booklyx to streamline their booking process
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="gap-2">
                  Create Account
                  <Calendar className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="outline">
                  Back to Home
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Built with precision by{" "}
              <a
                href="https://bivaasbaral.com.np"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                Bivaas Baral
              </a>
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <a
                href="https://bivaasbaral.com.np"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Portfolio
              </a>
              <span className="text-muted-foreground">•</span>
              <a
                href="https://bivaas.me"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Blog
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
