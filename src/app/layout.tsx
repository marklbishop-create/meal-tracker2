import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
});

export const viewport = {
  themeColor: "#0F1115",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Meal & Macro Tracker",
  description: "Track your meals, macros, and goals.",
  manifest: "/manifest.json",
  icons: {
    icon: '/icon.jpg',
    apple: '/icon.jpg',
  },
};

import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head />
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="bottom-center" toastOptions={{ style: { background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' } }} />
        <Analytics />
      </body>
    </html>
  );
}
