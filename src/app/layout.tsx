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
  title: "Booklyx - Professional Booking Management System",
  description: "Booklyx is a modern, developer-grade booking management system designed for reliability and seamless integration. Streamline your business bookings with Booklyx - smart scheduling, team management, and automated notifications.",
  keywords: ["Booklyx", "booking system", "appointment booking", "booking management", "schedule management", "business booking", "online booking", "appointment scheduler", "booking software", "Booklyx booking"],
  authors: [{ name: "Bivaas Baral", url: "https://bivaasbaral.com.np" }],
  creator: "Bivaas Baral",
  publisher: "Booklyx",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://booklyx.vercel.app",
    siteName: "Booklyx",
    title: "Booklyx - Professional Booking Management System",
    description: "Streamline your business bookings with Booklyx. Modern booking management platform with smart scheduling, team management, and real-time notifications.",
    images: [
      {
        url: "https://booklyx.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Booklyx - Professional Booking Management System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Booklyx - Professional Booking Management System",
    description: "Streamline your business bookings with Booklyx. Modern booking management platform with smart scheduling and automated notifications.",
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
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
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
