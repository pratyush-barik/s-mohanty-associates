import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "S Mohanty Associates | Property Valuation Experts",
  description:
    "Government Registered Valuers and Chartered Engineers providing expert property valuation services for banks, government bodies, insurance companies, and private clients across India since 1995.",
  keywords: [
    "property valuation",
    "land valuation",
    "building valuation",
    "registered valuer",
    "chartered engineer",
    "bank valuation",
    "insurance valuation",
    "Bhubaneswar",
    "Odisha",
    "S Mohanty Associates",
  ],
  authors: [{ name: "S Mohanty Associates" }],
  openGraph: {
    title: "S Mohanty Associates | Property Valuation Experts",
    description:
      "Trusted property valuation expertise since 1995. Government Registered Valuers and Chartered Engineers serving India's leading banks and institutions.",
    type: "website",
    locale: "en_IN",
    siteName: "S Mohanty Associates",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
