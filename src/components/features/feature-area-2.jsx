'use client';
import React from 'react';
import {
  FiTruck,
  FiRefreshCcw,
  FiRuler,
  FiFeather,
  FiArchive,
  FiDollarSign,
  FiClock,
  FiSend,
  FiLink2,
  FiPercent,
  FiUserCheck,
  FiHeadphones,
} from 'react-icons/fi';

const feature_data = [
  { icon: FiTruck, title: 'Fast Dispatch & Low Lead Time', subtitle: 'Shipments in days, not weeks' },
  { icon: FiRefreshCcw, title: 'No-Hassle Returns', subtitle: 'Quick replacement or credit note' },
  { icon: FiRuler, title: 'Consistent GSM & Width', subtitle: 'Batch-wise QC & lab-tested fabric' },
  { icon: FiFeather, title: 'Custom Dyeing & Finishes', subtitle: 'Peach, Carbon, Laffer, Enzyme & more' },
  { icon: FiArchive, title: 'Wide Range — 5000+ Fabrics', subtitle: 'Cotton, Poplin, Twill, Lycra, Rayon' },
  { icon: FiDollarSign, title: 'Transparent B2B Pricing', subtitle: 'No hidden charges or agent margin' },
  { icon: FiClock, title: 'Low MOQ Sampling', subtitle: 'Perfect for designers & exporters' },
  { icon: FiSend, title: 'Nationwide Delivery', subtitle: 'Pan-India & export logistics network' },
  { icon: FiLink2, title: 'Direct From Mills', subtitle: 'Authentic fabrics, zero middlemen' },
  { icon: FiPercent, title: 'Volume & Loyalty Discounts', subtitle: 'Tiered pricing for bulk buyers' },
  { icon: FiUserCheck, title: 'Dedicated Account Support', subtitle: 'Your own fabric expert for orders' },
  { icon: FiHeadphones, title: '24×7 Client Assistance', subtitle: 'Always available for B2B partners' },
];

export default function FeatureAreaTwo() {
  return (
    <section className="tp-feature-area tp-feature-border-2 pb-80">
      <div className="container">
        <div className="tp-feature-inner-2">
          <div className="row align-items-center">
            {feature_data.map(({ icon: Icon, title, subtitle }, i) => (
              <div key={i} className="col-xl-3 col-lg-3 col-md-6 col-sm-6">
                <div className="tp-feature-item-2 d-flex align-items-start mb-40">
                  <div
                    className="tp-feature-icon-2 mr-10"
                    style={{ fontSize: 24, lineHeight: 1 }}
                  >
                    {Icon && <Icon />} {/* ✅ prevents crash if any icon missing */}
                  </div>
                  <div className="tp-feature-content-2">
                    <h3 className="tp-feature-title-2">{title}</h3>
                    <p>{subtitle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
