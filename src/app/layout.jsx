/* ------------------------------------------------------------------ */
/*  app/layout.jsx – global layout & metadata                         */
/* ------------------------------------------------------------------ */
import './globals.scss';

import Providers        from '@/components/provider';
import GoogleAnalytics  from '@/components/analytics/GoogleAnalytics';
import MicrosoftClarity from '@/components/analytics/MicrosoftClarity';

/* Font Awesome CSS + reset */
import '/public/assets/css/font-awesome-pro.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Amrita Global Enterprises</title>

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
