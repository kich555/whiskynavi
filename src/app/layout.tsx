import "@/app/globals.css";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/site";
import { AuthProvider } from "@/providers/AuthProvider";
import { pretendard } from "@/styles/fonts";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { OverlayProvider } from "overlay-kit";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.whiskynavi.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: "Whiskynavi" }],
  creator: "Whiskynavi",
  publisher: "Whiskynavi",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    alternateLocale: ["en_US", "ja_JP"],
    url: siteUrl,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    countryName: "South Korea",
    images: [
      {
        url: "/og-image.png",
        secureUrl: "/og-image.png",
        width: 1200,
        height: 630,
        alt: siteConfig.name,
        type: "image/png",
      },
      {
        url: "/apple-touch-icon.png",
        width: 180,
        height: 180,
        alt: `${siteConfig.name} App Icon`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [
      { rel: "android-chrome-192x192", url: "/android-chrome-192x192.png" },
      { rel: "android-chrome-512x512", url: "/android-chrome-512x512.png" },
    ],
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${pretendard.className} bg-[#1D2429] antialiased`}>
        <Analytics />

        <AuthProvider>
          <OverlayProvider>
            {/* <Header /> */}
            {/* <main className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8"> */}
            {children}
            {/* </main> */}
            <Toaster richColors position="bottom-right" />
          </OverlayProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
