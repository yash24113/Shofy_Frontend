'use client';

import React from 'react';
import Link from 'next/link';
import styles from './FashionBanner.module.scss';

/* ---- constants ---- */
// ✅ Correct public path: do NOT include "public" in the URL
const HERO_VIDEO = '/videos/canva_mix.mp4';

const EYEBROW  = 'Your One-Stop Fabric Destination';
const TITLE    = 'India’s Trusted Fabric Manufacturer';
const SUBTITLE = 'From timeless cottons to new-age blends — explore fabrics that define style and durability.';
const CTA      = { href: '/collections/new-arrivals-fabric', label: 'Discover Now' };

export default function FashionBanner() {
  return (
    <section className={styles.wrap} role="region" aria-label="Homepage Hero Video">
      <div className={styles.slide}>
        <div className={styles.bg}>
          {/* 🎥 Local video — autoplay, loop forever */}
          <video
            className={`${styles.bgMedia} ${styles.bgVideo}`}
            autoPlay
            muted
            loop
            playsInline
            controls={false}
            preload="metadata"
            onError={(e) => console.error('❌ Hero video failed to load', e)}
          >
            <source src={HERO_VIDEO} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* subtle overlays */}
          <span className={styles.scrim} aria-hidden />
          <span className={styles.vignette} aria-hidden />
        </div>

        {/* Centered content */}
        <div className={styles.center}>
          <span className={styles.eyebrow}>{EYEBROW}</span>
          <h1 className={styles.title}>{TITLE}</h1>
          <p className={styles.subtitle}>{SUBTITLE}</p>
          <div className={styles.actions}>
            <Link href={CTA.href} className={styles.cta}>
              {CTA.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
