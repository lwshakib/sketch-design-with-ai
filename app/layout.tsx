import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "Sketch - AI-Powered Design Tool",
    template: "%s | Sketch",
  },
  description:
    "Design with AI - Transform your sketches into stunning, production-ready designs instantly. Create beautiful UI designs with Google Gemini AI, export to code, and customize themes with ease.",
  keywords: [
    "sketch design with AI",
    "AI design tool",
    "sketch to code",
    "AI-powered design",
    "design with AI",
    "UI design generator",
    "Google Gemini design",
    "design automation",
    "AI sketch tool",
    "web design AI",
    "mockup generator",
  ],
  authors: [{ name: "Shakib Khan", url: "https://github.com/lwshakib" }],
  creator: "Shakib Khan",
  publisher: "Shakib Khan",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sketch-design-with-ai.vercel.app",
    title: "Sketch - Design with AI | AI-Powered Design Tool",
    description:
      "Design with AI - Transform your sketches into stunning, production-ready designs instantly. Create beautiful UI designs with Google Gemini AI, export to code, and customize themes with ease.",
    siteName: "Sketch - Design with AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sketch - Design with AI | AI-Powered Design Tool",
    description:
      "Design with AI - Transform your sketches into stunning, production-ready designs instantly using Google Gemini AI.",
    creator: "@lwshakib",
  },
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
  icons: {
    icon: [
      {
        url: "/favicon_io/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/favicon_io/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      { url: "/favicon_io/favicon.ico", sizes: "any", type: "image/x-icon" },
      {
        url: "/favicon_io/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/favicon_io/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: "/favicon_io/apple-touch-icon.png",
  },
  manifest: "/favicon_io/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
