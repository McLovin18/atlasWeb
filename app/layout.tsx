import "./globals.css";

import Footer from "./components/Footer";
import { cookies } from "next/headers";
import Navbar from "./components/Navbar";
import { UserProvider } from "./context/UserContext";
import { OnboardingProvider } from "./context/OnboardingContext";
import { ToastProvider } from "./context/ToastContext";
import LayoutContentClient from "./components/LayoutContentClient";
import { StructuredData } from "./components/StructuredData";
import type { Metadata, Viewport } from "next";
import { Barlow_Condensed } from "next/font/google";

// ISR Global
export const revalidate = 1800;

// Cambiar cuando tengas el dominio
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://goldbet.com.ec";

const SITE_NAME = "GoldBet Ecuador";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal"],
  variable: "--font-barlow-condensed",
});

export const metadata: Metadata = {
  title: {
    default: "GoldBet Ecuador | Pronósticos deportivos y cuotas en vivo",
    template: "%s | GoldBet Ecuador",
  },

  description:
    "Pronósticos deportivos, cuotas en vivo y análisis de partidos de fútbol, baloncesto y tenis en Ecuador. Sigue las mejores ligas con GoldBet.",

  keywords: [
    "pronósticos deportivos Ecuador",
    "apuestas deportivas Ecuador",
    "cuotas en vivo",
    "pronósticos de fútbol",
    "quinielas Ecuador",
    "análisis de partidos",
    "casas de apuestas Ecuador",
    "GoldBet",
  ],

  creator: SITE_NAME,

  publisher: SITE_NAME,

  metadataBase: new URL(SITE_URL),

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },

  manifest: "/site.webmanifest",

  openGraph: {
    type: "website",
    locale: "es_EC",
    url: SITE_URL,
    siteName: SITE_NAME,

    title: "GoldBet Ecuador | Pronósticos deportivos",

    description:
      "Pronósticos deportivos y cuotas en vivo para las principales ligas de fútbol, baloncesto y tenis.",

    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "GoldBet Ecuador",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "GoldBet Ecuador | Pronósticos deportivos",

    description:
      "Pronósticos deportivos y cuotas en vivo para fútbol, baloncesto y tenis.",

    images: [`${SITE_URL}/twitter-image.jpg`],
  },

  alternates: {
    canonical: SITE_URL,
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },

  verification: {
    google: "", // colocar Search Console cuando el dominio exista
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },

  category: "Pronósticos deportivos",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={barlowCondensed.variable}>
      <head>
        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-XXXXXXXXXX');
            `,
          }}
        />

        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
          rel="stylesheet"
        />

        <StructuredData />
      </head>

      <body className="relative">
          <ToastProvider>
            <OnboardingProvider>
              <LayoutContentClient>
                {children}
              </LayoutContentClient>
            </OnboardingProvider>
          </ToastProvider>

      </body>
    </html>
  );
}