'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Keyboard, Autoplay } from 'swiper/modules';
import { Rating } from 'react-simple-star-rating';

// If Swiper CSS isn't already global, uncomment:
// import 'swiper/css';
// import 'swiper/css/navigation';
// import 'swiper/css/pagination';

import { ArrowRightLong, PrevLongArrTwo } from '@/svg';

/* ---------- Anonymous B2B testimonials (6 items) ---------- */
const DATA = [
  {
    id: 1,
    review: 4.5,
    desc:
      'On-time dispatch for 10K+ meters/month with stable hand-feel on peach finish poplin. Shade lots stayed consistent across repeats.',
    industry: 'Garment Exporter',
    location: 'Tirupur, TN',
    tags: ['Online Delivery', 'Peach Finish', 'Bulk Orders', 'Shade Match'],
  },
  {
    id: 2,
    review: 5,
    desc:
      'Uniform shirting quality is predictable. GSM and shrinkage are under control which reduced our returns dramatically.',
    industry: 'Uniform Manufacturer',
    location: 'Ludhiana, Punjab',
    tags: ['GSM Control', 'Shrinkage', 'Low Returns', 'Uniforms'],
  },
  {
    id: 3,
    review: 4.5,
    desc:
      'Fast lab dips and 50+ shade support helped us launch a new line quickly. Lead times were met even in peak season.',
    industry: 'Private Label Brand',
    location: 'Mumbai, MH',
    tags: ['Lab Dips', 'Shade Range', 'Lead Time', 'Seasonal'],
  },
  {
    id: 4,
    review: 5,
    desc:
      'Carbon/peach finishes matched our tech pack. Lot-to-lot variance stayed minimal and packing was export-grade.',
    industry: 'Textile Buying House',
    location: 'Delhi NCR',
    tags: ['Laffer/Peach', 'QC', 'Export Packing', 'Consistency'],
  },
  {
    id: 5,
    review: 4.5,
    desc:
      'Poplin and twill supply remained steady with helpful MoQs. PO changes were handled smoothly by the team.',
    industry: 'Corporate Procurement',
    location: 'Bengaluru, KA',
    tags: ['MoQ Flex', 'Poplin/Twill', 'PO Support', 'Service'],
  },
  {
    id: 6,
    review: 5,
    desc:
      'Fabric inspection reports and test certificates provided on request. Helped us pass third-party audits without issues.',
    industry: 'Export Compliance Partner',
    location: 'Jaipur, RJ',
    tags: ['Reports', 'Certificates', 'Compliance', 'Audits'],
  },
];

/* ---------- Slider options ---------- */
const slider_setting = {
  slidesPerView: 1,
  spaceBetween: 20,
  pagination: { el: '.tp-testimonial-slider-dot', clickable: true },
  navigation: {
    nextEl: '.tp-testimonial-slider-button-next',
    prevEl: '.tp-testimonial-slider-button-prev',
  },
  keyboard: { enabled: true, onlyInViewport: true },
  autoplay: { delay: 5200, disableOnInteraction: false, pauseOnMouseEnter: true },
  a11y: { enabled: true },
  breakpoints: {
    640: {
      slidesPerView: 2,
      spaceBetween: 20
    },
    1024: {
      slidesPerView: 3,
      spaceBetween: 24
    }
  }
};

const nonEmpty = (v) =>
  Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && String(v).trim() !== '';

function FashionTestimonial() {
  return (
    <section className="tp-testimonial-area pt-80 pb-90 testimonial--age-bg" aria-labelledby="testimonial-heading">
      <div className="container">
        {/* Header */}
        <div className="row justify-content-center">
          <div className="col-xl-8 text-center">
            <span className="age-badge">
              <i aria-hidden className="age-badge-dot" />
              Verified Industry Feedback
            </span>

            <h2 id="testimonial-heading" className="age-hl">
              Trusted by Fabric Buyers
            </h2>

            <p className="age-sub">
              Anonymous by policy, honest by performance — quality, shade consistency, and on-time delivery.
            </p>
          </div>
        </div>

        {/* Testimonial Cards Grid */}
        <div className="row justify-content-center mt-30">
          <div className="col-xl-12">
            <div className="p-relative">
              <Swiper
                {...slider_setting}
                modules={[Navigation, Pagination, A11y, Keyboard, Autoplay]}
                className="tp-testimonial-slider-active"
                aria-label="Anonymous Testimonial Slider"
              >
                {DATA.map((item, idx) => (
                  <SwiperSlide key={item.id} aria-label={`Testimonial ${idx + 1}`}>
                    <article className="age-card">
                      {/* Top row with stars and verified badge */}
                      <div className="age-top">
                        <div className="age-rating" aria-label={`${item.review} stars`}>
                          <Rating readonly allowFraction size={18} initialValue={item.review} fillColor={'#D6A74B'} />
                        </div>
                        <span className="age-verified">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="#D6A74B">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.85L18.18 22 12 18.77 5.82 22 7 14.12l-5-4.85 6.91-1.01L12 2z"/>
                          </svg>
                          VERIFIED
                        </span>
                      </div>

                      {/* Quote */}
                      <div className="age-quote-row">
                        <p className="age-quote">&ldquo;{item.desc}&rdquo;</p>
                      </div>

                      {/* Client info */}
                      <div className="age-client-info">
                        <div className="age-industry">{nonEmpty(item.industry) ? item.industry : 'Verified Buyer'}</div>
                        <div className="age-location">{nonEmpty(item.location) ? item.location : 'India'}</div>
                      </div>

                      {/* Tags */}
                      {nonEmpty(item.tags) && (
                        <div className="age-tags" aria-label="Tags">
                          {item.tags.slice(0, 3).map((t, i) => (
                            <span key={i} className="age-chip">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Gold accent line */}
                      <span className="age-gold-line" aria-hidden />
                    </article>
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Arrows */}
              <button className="tp-testimonial-slider-button-prev d-none d-md-grid age-arrow" aria-label="Previous testimonial">
                <PrevLongArrTwo />
              </button>
              <button className="tp-testimonial-slider-button-next d-none d-md-grid age-arrow" aria-label="Next testimonial">
                <ArrowRightLong />
              </button>

              {/* Dots */}
              <div
                className="tp-testimonial-slider-dot text-center mt-20 age-dots"
                style={{
                  ['--swiper-pagination-color']: '#D6A74B',
                  ['--swiper-pagination-bullet-inactive-color']: 'rgba(255,255,255,0.3)',
                  ['--swiper-pagination-bullet-inactive-opacity']: 1,
                }}
              />
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="row justify-content-center mt-40">
          <div className="col-xl-10">
            <div className="age-metric-wrap">
              {[
                { k: 'Repeat Orders', v: '96%' },
                { k: 'On-Time', v: '99.2%' },
                { k: 'Monthly Volume', v: '10K+' },
                { k: 'Client Retention', v: '98%' },
              ].map((m, i) => (
                <div key={i} className="age-metric">
                  <div className="age-metric-v">{m.v}</div>
                  <div className="age-metric-k">{m.k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ====== styles-in-one-file (styled-jsx) ====== */}
      <style jsx>{`
        /* Blue Background Section */
        .testimonial--age-bg {
          background:#112439;
          position: relative;
          overflow: hidden;
        }

        /* Add subtle pattern overlay */
        .testimonial--age-bg::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(214, 167, 75, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
          pointer-events: none;
        }

        .age-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          font: 600 11px/1 var(--tp-ff-roboto);
          color: #D6A74B;
          background: rgba(214, 167, 75, 0.1);
          border: 1px solid rgba(214, 167, 75, 0.3);
          border-radius: 999px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .age-badge-dot {
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: #D6A74B;
        }

        .age-hl {
          margin-top: 20px;
          font-family: var(--tp-ff-jost);
          color: var(--tp-common-white);
          font-weight: 700;
          font-size: 36px;
          line-height: 1.2;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .age-sub {
          color: rgba(255, 255, 255, 0.9);
          max-width: 500px;
          margin: 16px auto 0;
          font-size: 16px;
          line-height: 1.5;
          font-weight: 400;
        }

        /* Modern Card Design */
        .age-card {
          position: relative;
          border-radius: 16px;
          padding: 28px 24px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.1),
            0 2px 8px rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .age-card:hover {
          transform: translateY(-5px);
          box-shadow: 
            0 16px 40px rgba(0, 0, 0, 0.15),
            0 4px 16px rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.98);
        }
        
        .age-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        
        .age-rating {
          display: flex;
          align-items: center;
        }
        
        .age-verified {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font: 600 10px/1 var(--tp-ff-roboto);
          color: #D6A74B;
          background: rgba(214, 167, 75, 0.1);
          padding: 6px 10px;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          border: 1px solid rgba(214, 167, 75, 0.2);
        }

        .age-quote-row {
          flex: 1;
          margin-bottom: 20px;
        }
        
        .age-quote {
          color: var(--tp-text-1);
          font-size: 15px;
          line-height: 1.6;
          margin: 0;
          font-weight: 500;
        }

        .age-client-info {
          margin-bottom: 16px;
        }
        
        .age-industry {
          color: var(--tp-theme-primary);
          font-weight: 700;
          font-size: 16px;
          margin-bottom: 4px;
        }
        
        .age-location {
          color: var(--tp-text-2);
          font-size: 13px;
          font-weight: 500;
        }

        .age-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .age-chip {
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid var(--tp-grey-3);
          background: var(--tp-grey-1);
          color: var(--tp-text-2);
          font-weight: 600;
          font-size: 11px;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        
        .age-chip:hover {
          background: var(--tp-theme-primary);
          color: var(--tp-common-white);
          border-color: var(--tp-theme-primary);
        }

        .age-gold-line {
          position: absolute;
          left: 0;
          bottom: 0;
          height: 3px;
          width: 100%;
          background: linear-gradient(90deg, #D6A74B, var(--tp-theme-secondary), #D6A74B);
          border-radius: 0 0 16px 16px;
        }

        /* Modern Arrows */
        .age-arrow {
          background: rgba(255, 255, 255, 0.9) !important;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          color: var(--tp-theme-primary) !important;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 3;
          transition: all 0.3s ease;
        }
        
        .tp-testimonial-slider-button-prev.age-arrow {
          left: -24px;
        }
        
        .tp-testimonial-slider-button-next.age-arrow {
          right: -24px;
        }
        
        .age-arrow:hover {
          background: var(--tp-theme-primary) !important;
          border-color: var(--tp-theme-primary) !important;
          color: var(--tp-common-white) !important;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          transform: translateY(-50%) scale(1.1);
        }

        /* Modern Metrics */
        .age-metric-wrap {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          padding: 24px;
          display: grid;
          gap: 20px;
          grid-template-columns: repeat(4, 1fr);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        .age-metric {
          text-align: center;
          padding: 16px 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        
        .age-metric:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }
        
        .age-metric-v {
          color: #D6A74B;
          font-weight: 800;
          font-size: 28px;
          line-height: 1.1;
          margin-bottom: 6px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .age-metric-k {
          color: rgba(255, 255, 255, 0.9);
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Responsive */
        @media (max-width: 991.98px) {
          .tp-testimonial-area {
            padding-top: 60px;
            padding-bottom: 70px;
          }
          
          .age-hl {
            font-size: 32px;
          }
          
          .age-metric-wrap {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          
          .tp-testimonial-slider-button-prev.age-arrow {
            left: 8px;
          }
          
          .tp-testimonial-slider-button-next.age-arrow {
            right: 8px;
          }
        }
        
        @media (max-width: 767.98px) {
          .tp-testimonial-area {
            padding-top: 50px;
            padding-bottom: 60px;
          }
          
          .age-hl {
            font-size: 28px;
          }
          
          .age-sub {
            font-size: 14px;
          }
          
          .age-card {
            padding: 24px 20px;
          }
          
          .age-metric-wrap {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .age-arrow {
            width: 40px;
            height: 40px;
          }
          
          .age-metric-v {
            font-size: 24px;
          }
        }
      `}</style>
    </section>
  );
}

export default dynamic(() => Promise.resolve(FashionTestimonial), { ssr: false });