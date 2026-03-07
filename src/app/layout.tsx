import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeScript } from "@/components/theme-script";
import { Providers } from "./providers";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Booklyx — Booking Management for Service Businesses",
  description: "Set up a booking page for your service business. Add services, staff, and availability — customers book directly from your link. Free and admin-reviewed.",
  authors: [{ name: "Bivaas Baral", url: "https://bivaasbaral.com.np" }],
  creator: "Bivaas Baral",
  publisher: "Booklyx",
  robots: "index, follow",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://booklyx.vercel.app",
    siteName: "Booklyx",
    title: "Booklyx — Booking Management for Service Businesses",
    description: "Set up a booking page for your service business. Add services, staff, and availability — customers book directly from your link.",
    images: [
      {
        url: "https://booklyx.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Booklyx — Booking management for service businesses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Booklyx — Booking Management for Service Businesses",
    description: "Set up a booking page for your service business. Add services, staff, and availability — customers book directly from your link.",
    images: ["https://booklyx.vercel.app/og-image.png"],
  },
  metadataBase: new URL("https://booklyx.vercel.app"),
  alternates: {
    canonical: "https://booklyx.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        {/* Google Search Console Verification */}
        <meta name="google-site-verification" content="IlTuTqVA6pi_rgjh0scCGvJdJFIOaDD59IW7xRv1p2I" />
        {/* Schema.org Structured Data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Booklyx",
          "url": "https://booklyx.vercel.app",
          "description": "Free booking management for service businesses. Add services, staff, and availability — customers book directly from your link.",
          "publisher": {
            "@type": "Organization",
            "name": "Booklyx",
            "url": "https://booklyx.vercel.app"
          }
        }) }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-N2D7XRX4J1"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-N2D7XRX4J1');
          `}
        </Script>

        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
