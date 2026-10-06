import "./globals.css";
import type { Metadata } from "next";

import MainNavigation from "@/components/MainNavigation";
import ConditionalFooter from "@/components/ConditionalFooter";
import ScrollToTop from "@/components/ScrollToTop";
import GlobalFeedback from "@/components/GlobalFeedback";

export const metadata: Metadata = {
  title: "Advanta Growth - Restaurant POS Management",
  description:
    "Professional Restaurant POS & Management System - Streamline your operations with Advanta Growth",
  keywords:
    "restaurant POS, management system, billing, inventory, restaurant management",
  authors: [{ name: "Advanta Growth" }],

  openGraph: {
    title:
      "Advanta Growth - Restaurant POS Management",

    description:
      "Professional Restaurant POS & Management System",

    type: "website",
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
        {/* Google Fonts */}

        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />

        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap"
          rel="stylesheet"
        />

        {/* Font Awesome */}

        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />

        {/* Material Icons */}

        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />

        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
          rel="stylesheet"
        />

        {/* Favicon */}

        <link
          rel="icon"
          href="/favicon.ico"
          sizes="any"
        />

      </head>

      <body className="min-h-screen flex flex-col" suppressHydrationWarning>

        {/* GLOBAL TOASTS + CONFIRM MODAL */}

        <GlobalFeedback />

        {/* Skip to main content */}

        <a
          href="#main-content"
          className="skip-to-main"
        >
          Skip to main content
        </a>

        {/* Navbar */}

        <MainNavigation />

        {/* Main Content */}

        <main
          id="main-content"
          className="flex-1"
        >
          <div className="page-container">
            {children}
          </div>
        </main>

        {/* Footer - guest users only */}

        <ConditionalFooter />

        {/* Scroll To Top */}

        <ScrollToTop />

      </body>
    </html>
  );
}