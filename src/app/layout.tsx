import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "S Mohanty Associates | Property Valuation Experts",
  description:
    "Government Registered Valuers and Chartered Engineers providing expert property valuation services for Banks, Non-Banking Financial Corporations, Insurance Companies, and Private Clients across India since 2016.",
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
      "Trusted property valuation expertise since 2016. Government Registered Valuers and Chartered Engineers serving India's leading banks and institutions.",
    type: "website",
    locale: "en_IN",
    siteName: "S Mohanty Associates",
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'S Mohanty Associates - Property Valuation Experts',
      },
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "S Mohanty Associates",
  "image": "https://smohantyassociates.com/opengraph-image.png",
  "description": "Government Registered Valuers and Chartered Engineers providing expert property valuation services for Banks, Non-Banking Financial Corporations, Insurance Companies, and Private Clients across India since 2016.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "N-1/157, IRC Village",
    "addressLocality": "Nayapalli, Bhubaneswar",
    "addressRegion": "Odisha",
    "postalCode": "751015",
    "addressCountry": "IN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 20.3010,
    "longitude": 85.8245
  },
  "url": "https://smohantyassociates.com",
  "telephone": "+919437033501",
  "priceRange": "$$"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
