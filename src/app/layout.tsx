import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/state/Providers";

// Inter is loaded at runtime from the Google Fonts CDN (see globals.css
// @import) instead of next/font — build machines without network access
// would otherwise fail the production build.

export const metadata: Metadata = {
  title: "Closer",
  description:
    "Client & Lead Opportunity Sales Engine Radar. Enterprise B2B sales monitoring, document hub, and task tracker.",
  applicationName: "CLOSER",
  authors: [{ name: "Fawaz Adya Dermawan" }],
  openGraph: {
    title: "CLOSER — Personal Pipeline OS",
    description: "Client & Lead Opportunity Sales Engine Radar",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // enables env(safe-area-inset-*) on notched devices
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="min-h-screen font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
