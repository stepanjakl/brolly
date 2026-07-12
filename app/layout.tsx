import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Open Runde, self-hosted via next/font - no third-party requests, no layout shift.
const openRunde = localFont({
  src: [
    { path: "./fonts/OpenRunde-Regular.woff2", weight: "400" },
    { path: "./fonts/OpenRunde-Medium.woff2", weight: "500" },
    { path: "./fonts/OpenRunde-Semibold.woff2", weight: "600" },
    { path: "./fonts/OpenRunde-Bold.woff2", weight: "700" },
  ],
  variable: "--font-open-runde",
  display: "swap",
});

export const metadata: Metadata = {
  title: "brolly",
  description: "Current weather for the cities you care about.",
};

export const viewport: Viewport = {
  // match mobile browser chrome to the page background
  themeColor: "#e2e8f0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${openRunde.variable} h-full antialiased`}>
      {/* browser extensions stamp attributes onto <body> before hydration;
          only this element's attributes are exempted from the mismatch check */}
      <body
        suppressHydrationWarning
        className="flex min-h-full flex-col bg-slate-200 font-sans text-slate-800"
      >
        {children}
      </body>
    </html>
  );
}
