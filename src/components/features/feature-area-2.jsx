'use client';
import React from 'react';

const feature_data = [
  { title: 'Fast Dispatch & Low Lead Time',   subtitle: 'Shipments in days, not weeks' },
  { title: 'Wide Range — 5000+ Fabrics',      subtitle: 'Cotton, Poplin, Twill, Lycra, Rayon' },
  { title: 'Consistent GSM & Width',          subtitle: 'Batch-wise QC & lab-tested fabric' },
  { title: 'Transparent B2B Pricing',         subtitle: 'No hidden charges or agent margin' },
  { title: 'Low MOQ Sampling',                subtitle: 'Perfect for designers & exporters' },
  { title: 'Dedicated Account Support',       subtitle: 'Your own fabric expert for orders' },
];

export default function FeatureAreaTwo() {
  return (
    <section
      className="age-feature-wrap"
      aria-labelledby="age-feature-heading"
    >
      <div className="age-feature-inner">
        {/* Section header – aligned with blog style */}
        <header className="age-feature-header">
          <p className="age-kicker">Our sourcing advantages</p>
          <h2 id="age-feature-heading" className="age-heading">
            Practical benefits your team feels on every order
          </h2>
          <p className="age-intro">
            Six core strengths that make sampling, bulk production and repeat orders
            smoother for your merchandising and production teams.
          </p>
        </header>

        {/* Feature grid – 6 items */}
        <div className="age-feature-grid">
          {feature_data.map(({ title, subtitle }, index) => {
            const number = String(index + 1).padStart(2, '0');
            return (
              <article className="age-card" key={title}>
                <div className="age-card-inner">
                  <span className="age-number">{number}</span>
                  <h3 className="age-title">{title}</h3>
                  <p className="age-sub">{subtitle}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .age-feature-wrap {
          background: linear-gradient(
            180deg,
            color-mix(in srgb, var(--tp-grey-1) 90%, var(--tp-common-white)),
            var(--tp-common-white)
          );
          padding: 60px var(--page-xpad) 80px;
          position: relative;
          overflow: hidden;
        }

        .age-feature-wrap::after {
          content: '';
          position: absolute;
          inset-inline: 0;
          bottom: 0;
          height: 70px;
          background: linear-gradient(
            to bottom,
            color-mix(in srgb, var(--tp-theme-primary) 6%, transparent),
            transparent
          );
          pointer-events: none;
        }

        .age-feature-inner {
          max-width: 1180px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .age-feature-header {
          max-width: 720px;
          margin: 0 auto 34px;
          text-align: center;
        }

        .age-kicker {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px 14px;
          border-radius: 999px;
          border: 1px solid color-mix(in srgb, var(--tp-theme-secondary) 25%, transparent);
          background: color-mix(in srgb, var(--tp-theme-secondary) 10%, var(--tp-grey-1));
          color: var(--tp-theme-secondary);
          font: 600 11px/1.4 var(--tp-ff-roboto);
          letter-spacing: 0.09em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .age-heading {
          margin: 0 0 8px;
          font: 700 clamp(26px, 3.4vw, 34px)/1.25 var(--tp-ff-jost);
          color: var(--tp-text-1);
        }

        .age-intro {
          margin: 0 auto;
          color: var(--tp-text-2);
          font: 400 clamp(14px, 1.05vw, 15px)/1.7 var(--tp-ff-roboto);
        }

        .age-feature-grid {
          margin-top: 32px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px;
        }

        @media (min-width: 768px) {
          .age-feature-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (min-width: 1024px) {
          .age-feature-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        .age-card {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          /* outer glow */
          box-shadow: 0 12px 30px color-mix(in srgb, var(--tp-theme-primary) 16%, transparent);
          transition:
            transform 0.22s ease,
            box-shadow 0.22s ease,
            border-color 0.22s ease,
            background 0.22s ease;
        }

        /* gradient border frame */
        .age-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(
            135deg,
            var(--tp-theme-primary),
            var(--tp-theme-secondary)
          );
          opacity: 0.35;
          pointer-events: none;
        }

        .age-card-inner {
          position: relative;
          border-radius: inherit;
          background: linear-gradient(
            135deg,
            var(--tp-common-white),
            color-mix(in srgb, var(--tp-grey-1) 70%, var(--tp-common-white))
          );
          padding: 18px 20px 16px;
          border: 1px solid color-mix(in srgb, var(--tp-grey-2) 85%, transparent);
        }

        .age-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px color-mix(in srgb, var(--tp-theme-primary) 22%, transparent);
        }

        .age-card:hover .age-card-inner {
          background: linear-gradient(
            135deg,
            color-mix(in srgb, var(--tp-theme-primary) 5%, var(--tp-common-white)),
            color-mix(in srgb, var(--tp-theme-secondary) 6%, var(--tp-grey-1))
          );
          border-color: color-mix(in srgb, var(--tp-theme-primary) 45%, var(--tp-grey-2));
        }

        /* big watermark number */
        .age-number {
          position: absolute;
          top: -6px;
          right: 10px;
          font: 800 clamp(42px, 4vw, 56px)/1 var(--tp-ff-jost);
          color: color-mix(in srgb, var(--tp-theme-primary) 22%, transparent);
          opacity: 0.12;
          pointer-events: none;
        }

        .age-title {
          position: relative;
          margin: 0 0 6px;
          font: 600 clamp(15px, 1.1vw, 17px)/1.35 var(--tp-ff-jost);
          color: var(--tp-text-1);
        }

        .age-sub {
          position: relative;
          margin: 0;
          color: var(--tp-text-2);
          font: 500 clamp(13.5px, 0.95vw, 14.5px)/1.6 var(--tp-ff-roboto);
        }

        @media (max-width: 575px) {
          .age-feature-wrap {
            padding: 42px var(--page-xpad) 60px;
          }

          .age-card-inner {
            padding: 16px 16px 14px;
          }
        }

        :global(html.theme-dark) .age-feature-wrap {
          background: var(--tp-grey-1);
        }

        :global(html.theme-dark) .age-card-inner {
          background: var(--tp-common-white);
        }
      `}</style>
    </section>
  );
}
