/* ------------------------------------------------------------------ */
/*  app/layout.jsx – global layout & metadata                         */
/* ------------------------------------------------------------------ */
import './globals.scss';

import Providers        from '@/components/provider';
import GoogleAnalytics  from '@/components/analytics/GoogleAnalytics';
import MicrosoftClarity from '@/components/analytics/MicrosoftClarity';

/* Font Awesome CSS + reset */
import '/public/assets/css/font-awesome-pro.css';

// Default metadata (can be overridden by page-specific metadata)
export const metadata = {
  title: {
    default: 'Amrita Global Enterprises',
    template: '%s | Amrita Global Enterprises',
  },
  description: 'Premium quality fabrics for apparel and fashion industry',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://shofy-frontend1.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Amrita Global Enterprises',
    images: [
      {
        url: 'https://amritafashions.com/wp-content/uploads/amrita-fashions-company-logo-270x270.webp',
        width: 800,
        height: 600,
        alt: 'Amrita Global Enterprises',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@amritafabrics',
  },
  icons: {
    icon: [
      {
        url: 'https://amritafashions.com/wp-content/uploads/amrita-fashions-company-logo-32x32.webp',
        type: 'image/webp',
        sizes: '32x32',
      },
      {
        url: 'https://amritafashions.com/wp-content/uploads/amrita-fashions-company-logo-192x192.webp',
        type: 'image/webp',
        sizes: '192x192',
      },
    ],
    apple: [
      {
        url: 'https://amritafashions.com/wp-content/uploads/amrita-fashions-company-logo-180x180.webp',
        sizes: '180x180',
        type: 'image/webp',
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        

        {/* Favicon / Touch Icons (from amritafashions.com) */}
        <link
          rel="icon"
          href="https://amritafashions.com/wp-content/uploads/amrita-fashions-company-logo-150x150.webp"
          sizes="32x32"
          type="image/webp"
        />
        <link
          rel="icon"
          href="https://amritafashions.com/wp-content/uploads/amrita-fashions-company-logo-270x270.webp"
          sizes="192x192"
          type="image/webp"
        />
        <link
          rel="apple-touch-icon"
          href="https://amritafashions.com/wp-content/uploads/amrita-fashions-company-logo-270x270.webp"
        />

        {/* Preload CSS & fonts */}
        <link
          rel="preload"
          href="/assets/fonts/fa-regular-400.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/assets/fonts/fa-brands-400.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/assets/fonts/fa-solid-900.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/assets/fonts/fa-light-300.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/assets/fonts/Jost/Jost-VariableFont_wght.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/assets/fonts/Jost/Jost-Italic-VariableFont_wght.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />

        {/* Analytics scripts */}
        <GoogleAnalytics />
        <MicrosoftClarity />
      </head>

      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
