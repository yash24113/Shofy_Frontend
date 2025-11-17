'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Keyboard, Autoplay } from 'swiper/modules';
import { Rating } from 'react-simple-star-rating';
import { ArrowRightLong, PrevLongArrTwo } from '@/svg';

const DATA = [
  { id: 1, review: 4.5, desc: 'On-time dispatch for 10K+ meters/month with stable hand-feel on peach finish poplin. Shade lots stayed consistent across repeats.', industry: 'Garment Exporter', location: 'Tirupur, TN', tags: ['Online Delivery', 'Peach Finish', 'Bulk Orders'] },
  { id: 2, review: 5,   desc: 'Uniform shirting quality is predictable. GSM and shrinkage are under control which reduced our returns dramatically.', industry: 'Uniform Manufacturer', location: 'Ludhiana, Punjab', tags: ['GSM Control', 'Shrinkage', 'Low Returns'] },
  { id: 3, review: 4.5, desc: 'Fast lab dips and 50+ shade support helped us launch a new line quickly. Lead times were met even in peak season.', industry: 'Private Label Brand', location: 'Mumbai, MH', tags: ['Lab Dips', 'Shade Range', 'Lead Time'] },
  { id: 4, review: 5,   desc: 'Carbon/peach finishes matched our tech pack. Lot-to-lot variance stayed minimal and packing was export-grade.', industry: 'Textile Buying House', location: 'Delhi NCR', tags: ['Laffer/Peach', 'QC', 'Export Packing'] },
  { id: 5, review: 4.5, desc: 'Poplin and twill supply remained steady with helpful MoQs. PO changes were handled smoothly by the team.', industry: 'Corporate Procurement', location: 'Bengaluru, KA', tags: ['MoQ Flex', 'Poplin/Twill', 'PO Support'] },
  { id: 6, review: 5,   desc: 'Fabric inspection reports and test certificates provided on request. Helped us pass third-party audits without issues.', industry: 'Export Compliance Partner', location: 'Jaipur, RJ', tags: ['Reports', 'Certificates', 'Compliance'] },
];

const slider_setting = {
  slidesPerView: 1,
  spaceBetween: 14,
  pagination: { el: '.tp-testimonial-slider-dot', clickable: true },
  navigation: { nextEl: '.tp-testimonial-slider-button-next', prevEl: '.tp-testimonial-slider-button-prev' },
  keyboard: { enabled: true, onlyInViewport: true },
  autoplay: { delay: 5200, disableOnInteraction: false, pauseOnMouseEnter: true },
  a11y: { enabled: true },
  breakpoints: { 640: { slidesPerView: 2, spaceBetween: 14 }, 1024: { slidesPerView: 3, spaceBetween: 16 } }
};

const nonEmpty = (v) => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && String(v).trim() !== '');

function FashionTestimonial() {
  const dotsStyle = {
    '--swiper-pagination-color': 'var(--tp-theme-secondary)',
    '--swiper-pagination-bullet-inactive-color': 'rgba(255,255,255,0.35)',
    '--swiper-pagination-bullet-inactive-opacity': 1
  };

  return (
    <section className="tp-testimonial-area testimonial--age-bg" aria-labelledby="testimonial-heading">
      <div className="container">

        {/* Header (unchanged) */}
        <div className="row justify-content-center">
          <div className="col-xl-8 text-center">
            <span className="age-badge"><i aria-hidden className="age-badge-dot" />Verified Industry Feedback</span>
            <h2 id="testimonial-heading" className="age-hl">Trusted by Fabric Buyers</h2>
          </div>
        </div>

        {/* Cards */}
        <div className="row justify-content-center mt-16">
          <div className="col-xl-12">
            <div className="p-relative">
              <Swiper
                {...slider_setting}
                modules={[Navigation, Pagination, A11y, Keyboard, Autoplay]}
                className="tp-testimonial-slider-active"
                aria-label="Anonymous Testimonial Slider"
              >
                {DATA.map((item, idx) => (
                  <SwiperSlide key={item.id} className="slide-auto" aria-label={`Testimonial ${idx + 1}`}>
                    <article className="age-card h-eq">
                      {/* top row */}
                      <div className="age-top">
                        <div className="age-stars" aria-hidden />
                        <div className="age-rating" aria-label={`${item.review} stars`}>
                          <Rating readonly allowFraction size={16} initialValue={item.review} fillColor={'var(--tp-theme-secondary)'} />
                        </div>
                        <span className="age-verified">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--tp-theme-secondary)" aria-hidden>
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.85L18.18 22 12 18.77 5.82 22 7 14.12l-5-4.85 6.91-1.01L12 2z"/>
                          </svg>
                          VERIFIED
                        </span>
                      </div>

                      {/* quote */}
                      <p className="age-quote">&ldquo;{item.desc}&rdquo;</p>

                      {/* buyer */}
                      <div className="age-client">
                        <div className="age-industry">{nonEmpty(item.industry) ? item.industry : 'Verified Buyer'}</div>
                        <div className="age-dot" />
                        <div className="age-location">{nonEmpty(item.location) ? item.location : 'India'}</div>
                      </div>

                      {/* tags */}
                      {nonEmpty(item.tags) && (
                        <div className="age-tags" aria-label="Tags">
                          {item.tags.slice(0, 3).map((t, i) => (<span key={i} className="age-chip">{t}</span>))}
                        </div>
                      )}
                    </article>
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Arrows & Dots (unchanged) */}
              <button className="tp-testimonial-slider-button-prev d-none d-md-grid age-arrow" aria-label="Previous testimonial"><PrevLongArrTwo /></button>
              <button className="tp-testimonial-slider-button-next d-none d-md-grid age-arrow" aria-label="Next testimonial"><ArrowRightLong /></button>
              <div className="tp-testimonial-slider-dot text-center mt-10 age-dots" style={dotsStyle} />
            </div>
          </div>
        </div>

        {/* Metrics (unchanged from your last good version) */}
        <div className="row justify-content-center mt-24">
          <div className="col-xl-10">
            <div className="age-metric-grid small-white">
              {[
                { k: 'Repeat Orders', v: '96%' },
                { k: 'On-Time', v: '99.2%' },
                { k: 'Monthly Volume', v: '10K+' },
                { k: 'Client Retention', v: '98%' },
              ].map((m, i) => (
                <div key={i} className="age-metric-box">
                  <div className="val">{m.v}</div>
                  <div className="key">{m.k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <style jsx>{`
        /* spacing stay compact */
        .tp-testimonial-area{ padding:38px 0 46px; }
        .mt-10{ margin-top:10px; }
        .mt-16{ margin-top:16px; }
        .mt-24{ margin-top:24px; }
        .testimonial--age-bg{ background: var(--tp-theme-1, #112439); }

        .age-badge{
          display:inline-flex; align-items:center; gap:6px;
          padding:5px 10px; font:600 10px/1 var(--tp-ff-roboto);
          color: var(--tp-theme-secondary);
          background: color-mix(in srgb, var(--tp-theme-secondary) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--tp-theme-secondary) 30%, transparent);
          border-radius:999px; text-transform:uppercase; letter-spacing:.5px;
        }
        .age-badge-dot{ width:5px; height:5px; border-radius:999px; background: var(--tp-theme-secondary); }
        .age-hl{ margin-top:10px; color: var(--tp-common-white); font-family: var(--tp-ff-jost); font-weight:700; font-size:30px; line-height:1.18; }

        /* equalize slides */
        .slide-auto{ height:auto; }
        :global(.tp-testimonial-slider-active .swiper-wrapper){ align-items:stretch; }
        .h-eq{ display:flex; flex-direction:column; height:100%; }

        /* ===== Card (refined) ===== */
        .age-card{
          position:relative;
          border-radius:14px;
          padding:18px 18px 16px;
          background: var(--tp-common-white);
          border: 1px solid color-mix(in srgb, var(--tp-grey-3) 40%, transparent);
          box-shadow:
            0 8px 22px rgba(0,0,0,.10);
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .age-card::after{
          /* soft inner highlight ring to replace the bottom line */
          content:'';
          position:absolute; inset:0;
          border-radius:14px;
          box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tp-theme-secondary) 24%, transparent);
          pointer-events:none;
        }
        .age-card:hover{ transform:translateY(-3px); box-shadow:0 12px 28px rgba(0,0,0,.14); }

        .age-top{
          display:flex; align-items:center; justify-content:space-between;
          gap:10px; margin-bottom:10px;
        }
        .age-rating{ display:flex; align-items:center; }
        .age-verified{
          display:inline-flex; align-items:center; gap:4px;
          font:600 10px/1 var(--tp-ff-roboto);
          color: var(--tp-theme-secondary);
          background: color-mix(in srgb, var(--tp-theme-secondary) 12%, transparent);
          padding:5px 8px; border-radius:999px;
          text-transform:uppercase; letter-spacing:.6px;
          border:1px solid color-mix(in srgb, var(--tp-theme-secondary) 22%, transparent);
          white-space:nowrap;
        }

        .age-quote{
          color: var(--tp-text-1);
          font-size:14px; line-height:1.55; font-weight:500;
          margin:6px 0 12px;
          min-height:56px; /* keep equal height rows */
        }

        .age-client{
          display:flex; align-items:center; gap:8px;
          margin:0 0 10px;
        }
        .age-industry{ color: var(--tp-theme-primary); font-weight:700; font-size:14.5px; }
        .age-location{ color: var(--tp-text-2); font-size:12.5px; font-weight:600; }
        .age-dot{ width:4px; height:4px; border-radius:999px; background: var(--tp-grey-5, #cfd6e4); opacity:.8; }

        .age-tags{ display:flex; gap:6px; flex-wrap:wrap; }
        .age-chip{
          padding:4px 10px;
          border-radius:20px;
          background: var(--tp-grey-1);
          border:1px solid var(--tp-grey-3);
          color: var(--tp-text-2);
          font-weight:600; font-size:11px; white-space:nowrap;
          transition: background .2s ease, color .2s ease, border-color .2s ease;
        }
        .age-chip:hover{
          background: var(--tp-theme-primary);
          border-color: var(--tp-theme-primary);
          color: var(--tp-common-white);
        }

        /* arrows & dots */
        .age-arrow{
          background: var(--tp-common-white)!important; color: var(--tp-theme-primary)!important;
          width:38px; height:38px; border-radius:50%; display:grid; place-items:center;
          box-shadow:0 4px 14px rgba(0,0,0,.10); position:absolute; top:50%; transform:translateY(-50%); z-index:3;
        }
        .tp-testimonial-slider-button-prev.age-arrow{ left:6px; }
        .tp-testimonial-slider-button-next.age-arrow{ right:6px; }
        .age-dots :global(.swiper-pagination-bullet){ margin:0 4px!important; }

        /* metrics (your latest style kept) */
        .age-metric-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
        .age-metric-grid.small-white .age-metric-box{
          background: #00000033; color: var(--tp-theme-secondary);
          border-radius:10px; padding:16px 12px; text-align:center;
          box-shadow:0 4px 12px rgba(0,0,0,.08);
        }
        .age-metric-grid.small-white .val{ font-weight:800; font-size:20px; margin-bottom:6px; line-height:1.1; }
        .age-metric-grid.small-white .key{ font-size:12.5px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; }

        /* responsive */
        @media (max-width: 991.98px){
          .age-metric-grid{ grid-template-columns:repeat(2,1fr); }
        }
        @media (max-width: 575.98px){
          .age-card{ padding:16px 14px; }
          .age-quote{ min-height:60px; font-size:13.5px; }
          .age-metric-grid{ grid-template-columns:1fr; gap:8px; }
        }
      `}</style>
    </section>
  );
}

export default dynamic(() => Promise.resolve(FashionTestimonial), { ssr: false });
