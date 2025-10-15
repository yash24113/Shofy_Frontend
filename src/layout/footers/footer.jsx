'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

// internal (kept your social + icons)
import social_data from '@/data/social-data';
import { Email, Location } from '@/svg';

/* ---- brand palette ---- */
const BG_TOP = '#112338';
const BG_BOTTOM = '#142a42';
const BRAND_BLUE = '#2C4C97';
const BRAND_GOLD = '#D6A74B';
const TEXT_MAIN = '#E9F1FA';
const TEXT_SOFT = 'rgba(233,241,250,.78)';
const BORDER_SOFT = 'rgba(255,255,255,.12)';

/* Trusted badges (served from /public) */
const trustedLogos = [
  { src: '/assets/img/logo/BCI.png', alt: 'BCI Better Cotton Initiative' },
  { src: '/assets/img/logo/confidence_Textiles.png', alt: 'OEKO-TEX Standard' },
  { src: '/assets/img/logo/ecovero.png', alt: 'Lenzing EcoVero' },
  { src: '/assets/img/logo/global.png', alt: 'Global Recycled Standard' },
  { src: '/assets/img/logo/organic.png', alt: 'Organic 100 Content Standard' },
  { src: '/assets/img/logo/gold.png', alt: 'Organic 100 Content Standard' },
];

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v2a2 2 0 0 1-2.18 2 19.84 19.84 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.15 12.8 19.84 19.84 0 0 1 .08 4.18 2 2 0 0 1 2.06 2h2a2 2 0 0 1 2 1.72c.12.86.34 1.7.66 2.5a2 2 0 0 1-.45 2.11L5.4 9.91a16 16 0 0 0 8.69 8.69l1.58-1.87a2 2 0 0 1 2.11-.45c.8.32 1.64.54 2.5.66A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const Footer = ({ style_2 = false, style_3 = false, primary_style = false }) => {
  const rootStyle =
    primary_style
      ? 'tp-footer-style-2 tp-footer-style-primary tp-footer-style-6'
      : (style_2 ? 'tp-footer-style-2' : (style_3 ? 'tp-footer-style-2 tp-footer-style-3' : ''));
  const bgToken = style_2 ? 'footer-bg-white' : 'footer-bg-grey';

  return (
    <footer aria-label="Site Footer" className="footer">
      <div
        className={`tp-footer-area footer--brand ${rootStyle}`}
        data-bg-color={bgToken}
        style={{
          background: `linear-gradient(180deg, ${BG_TOP}, ${BG_BOTTOM})`,
          borderTop: `1px solid ${BORDER_SOFT}`,
        }}
      >
        {/* ===== TOP ===== */}
        <div className="tp-footer-top pt-95 pb-40 top-pad">
          <div className="container">
            <div className="row" style={{ rowGap: 28 }}>
              {/* Addresses board (replaces brand/logo block) */}
              <div className="col-xl-4 col-lg-3 col-md-4 col-sm-12">
                <div className="tp-footer-widget footer-col-1 mb-50" style={{ paddingRight: 16 }}>
                  <div className="addr-board" aria-label="Company addresses">
                    <div className="addr-section">
                      <div className="addr-title">Office Address</div>
                      <div className="addr-lines">
                        <div>404, 4th Floor, Safal Prelude,</div>
                        <div>Behind YMCA Club, Corporate Road,</div>
                        <div>Prahlad Nagar, Ahmedabad , Gujarat, India – 380015</div>
                      </div>
                    </div>

                    <div className="addr-section">
                      <div className="addr-title">Factory Address</div>
                      <div className="addr-lines">
                        <div>1, Mohan Estate, Ramol Road,</div>
                        <div>Ahmedabad, Gujarat, India – 382449</div>
                      </div>
                    </div>

                    <div className="addr-section">
                      <div className="addr-title">Warehouse Address</div>
                      <div className="addr-lines">
                        <div>Nr. Ambuja Synthetics, B/H Old Narol Court,</div>
                        <div>Narol, Ahmedabad, Gujarat, India – 382405</div>
                      </div>
                    </div>

                    <div className="addr-section no-sep">
                      <div className="addr-title">UAE Office Address</div>
                      <div className="addr-lines">
                        <div>GSK Worldwide FZE, Ajman Free Zone, UAE</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* My Account */}
              <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6">
                <div className="tp-footer-widget footer-col-2 mb-50">
                  <h4 className="tp-footer-widget-title fx-title">My Account</h4>
                  <div className="tp-footer-widget-content">
                    <ul className="fx-list">
                      <li><a href="#" className="fx-nav">Track Orders</a></li>
                      <li><a href="#" className="fx-nav">Shipping</a></li>
                      <li><a href="#" className="fx-nav">Wishlist</a></li>
                      <li><a href="#" className="fx-nav">My Account</a></li>
                      <li><a href="#" className="fx-nav">Order History</a></li>
                      <li><a href="#" className="fx-nav">Returns</a></li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Information */}
              <div className="col-xl-3 col-lg-3 col-md-4 col-sm-6">
                <div className="tp-footer-widget footer-col-3 mb-50">
                  <h4 className="tp-footer-widget-title fx-title">Information</h4>
                  <div className="tp-footer-widget-content">
                    <ul className="fx-list">
                      <li><a href="#" className="fx-nav">Our Story</a></li>
                      <li><a href="#" className="fx-nav">Careers</a></li>
                      <li><a href="#" className="fx-nav">Privacy Policy</a></li>
                      <li><a href="#" className="fx-nav">Terms &amp; Conditions</a></li>
                      <li><a href="#" className="fx-nav">Latest News</a></li>
                      <li><a href="#" className="fx-nav">Contact Us</a></li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Talk To Us */}
              <div className="col-xl-3 col-lg-3 col-md-4 col-sm-6">
                <div className="tp-footer-widget footer-col-4 mb-50">
                  <h4 className="tp-footer-widget-title fx-title">Talk To Us</h4>

                  {/* Newsletter */}
                  <div className="fx-news-mini">
                    <p className="mini-desc">Subscribe to our newsletter to get the latest news and offers.</p>
                    <form className="mini-pill" action="#" method="post" onSubmit={(e) => e.preventDefault()}>
                      <input type="email" required placeholder="Subscribe with us" aria-label="Email address" />
                      <button type="submit" aria-label="Subscribe" className="mini-btn">
                        <span className="arrow">›</span>
                      </button>
                    </form>
                  </div>

                  {/* Phone / Email */}
                  <div className="talk-simple">
                    <div className="talk-row">
                      <span className="talk-icon"><PhoneIcon /></span>
                      <a className="talk-link" href="tel:9925155141">+91 9925155141</a>
                    </div>
                    <div className="talk-row">
                      <span className="talk-icon"><Email /></span>
                      <a className="talk-link" href="mailto:shofy@support.com">amritafashions.com</a>
                    </div>
                  </div>

                  {/* Address (HQ quick line) */}
                  <div className="talk-address">
                    <div className="addr-row">
                      <span className="addr-pin"><Location /></span>
                      <div className="addr-lines">
                        <div>4th Floor, Safal Prelude</div>
                        <div>404 Corporate Road, Near YMCA Club,</div>
                        <div>Prahlad Nagar, Ahmedabad, Gujarat</div>
                        <div>380015</div>
                      </div>
                    </div>
                  </div>

                  {/* Social */}
                  <div className="tp-footer-social mt-14" role="group" aria-label="Social links">
                    {social_data.map((s) => (
                      <a
                        key={s.id}
                        href={s.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label || 'Social link'}
                        title={s.label || undefined}
                        className="fx-social"
                      >
                        <i className={s.icon} aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ===== Bottom (copyright + mini trusted logos) ===== */}
        <div className="tp-footer-bottom fx-bottom">
          <div className="container">
            <div className="tp-footer-bottom-wrapper">
              <div className="fx-bottom-wrap">
                <div className="fx-topbar"></div>
                <p className="fx-copy">
                  <strong>© {new Date().getFullYear()} Amrita Global Enterprises</strong>
                  <span className="dot">•</span>
                  All rights reserved
                  <span className="dot">•</span>
                  Crafting quality textiles for a better tomorrow
                </p>

                <div className="mini-trust">
                  {trustedLogos.map((l, i) => (
                    <div key={i} className="mini-card" title={l.alt}>
                      <Image
                        src={l.src}
                        alt={l.alt}
                        width={60}
                        height={60}
                        style={{ width: '36px', height: 'auto', maxHeight: 36 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== styles ===== */}
      <style jsx>{`
        /* Footer-only fonts */
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Poppins:wght@600;700;800&display=swap');

        :global(.footer--brand){
          background:linear-gradient(180deg,${BG_TOP},${BG_BOTTOM})!important;
          border-top:1px solid ${BORDER_SOFT}!important;
          color:${TEXT_MAIN}!important;
        }
        :global(.footer--brand .fx-bottom){
          background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,0))!important;
          border-top:1px solid ${BORDER_SOFT}!important;
        }

        .footer { font-family:'Plus Jakarta Sans', system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, sans-serif; }
        .fx-title { font-family:'Poppins','Plus Jakarta Sans',system-ui,-apple-system,sans-serif; }

        .top-pad{padding-top:56px;padding-bottom:28px}

        .fx-title{
          color:${TEXT_MAIN};
          font-weight:800;
          font-size:20px;
          letter-spacing:.2px;
          margin:0 0 14px;
          position:relative
        }
        .fx-title::after{
          content:'';
          position:absolute;left:0;bottom:-8px;width:36px;height:3px;border-radius:3px;
          background:linear-gradient(90deg,${BRAND_GOLD},${BRAND_BLUE});opacity:.95
        }

        .fx-muted{color:${TEXT_SOFT};line-height:1.75}

        .fx-list{list-style:none;margin:0;padding:0}
        .fx-list li{margin:0 0 10px}
        .fx-nav{
          display:inline-block;font-weight:600;font-size:15px;text-decoration:none;color:${TEXT_MAIN};
          transition:color .22s ease,transform .15s ease
        }
        .fx-nav:hover{color:${BRAND_GOLD};transform:translateX(3px)}

        /* Addresses board (new) */
        .addr-board{
          background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.03));
          border:1px solid ${BORDER_SOFT};
          border-radius:16px;
          padding:16px 16px 10px;
        }
        .addr-section{
          position:relative;
          padding:10px 0 12px;
        }
        .addr-section:not(.no-sep)::after{
          content:'';
          position:absolute;left:0;right:0;bottom:0;height:1px;
          background:${BORDER_SOFT};
        }
        .addr-title{
          font-family:'Poppins','Plus Jakarta Sans',system-ui;
          font-weight:800;letter-spacing:.2px;margin:0 0 6px;color:${TEXT_MAIN};
          display:flex;align-items:center;gap:8px;
        }
        .addr-title::before{
          content:'';
          width:8px;height:8px;border-radius:50%;
          background:linear-gradient(90deg,${BRAND_GOLD},${BRAND_BLUE});
          box-shadow:0 0 0 3px rgba(255,255,255,.06);
        }
        .addr-lines{color:${TEXT_SOFT};line-height:1.65}

        /* Talk to us */
        .tp-footer-social{display:flex;gap:12px;margin-top:14px;flex-wrap:wrap}
        .fx-social{
          width:44px;height:44px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;
          color:${TEXT_MAIN};border:1px solid ${BORDER_SOFT};background:rgba(255,255,255,.06);
          transition:transform .15s ease,box-shadow .2s ease,background .2s
        }
        .fx-social:hover{
          transform:translateY(-3px);
          background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.08));
          box-shadow:0 10px 24px rgba(0,0,0,.35)
        }
        .tp-footer-social i { font-style: normal; color:${TEXT_MAIN}; }
        :global(.tp-footer-social .fa-brands){ font-family:"Font Awesome 6 Brands" !important; font-weight:400 !important; }
        :global(.tp-footer-social .fa-solid),
        :global(.tp-footer-social .fa-regular){ font-family:"Font Awesome 6 Free" !important; font-weight:900 !important; }

        /* Newsletter mini */
        .fx-news-mini{margin:6px 0 12px}
        .mini-desc{color:${TEXT_SOFT};margin:0 0 10px;font-size:18px;line-height:1.65}
        .mini-pill{
          position:relative;display:flex;align-items:center;
          background:#fff;border:1px solid rgba(0,0,0,.04);
          border-radius:9999px;height:52px;padding:6px;
          box-shadow:0 10px 26px rgba(0,0,0,.18);
        }
        .mini-pill input{
          flex:1;height:100%;background:transparent;border:none;color:#0b1220;
          padding:0 18px;outline:none;font-size:15px
        }
        .mini-pill input::placeholder{color:#6b7280}
        .mini-pill .mini-btn{
          width:40px;height:40px;border-radius:9999px;border:none;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          background:${BRAND_GOLD}; color:#fff; box-shadow:0 10px 22px rgba(214,167,75,.35)
        }
        .mini-pill .arrow{font-size:24px;line-height:1;transform:translateY(-1px)}

        /* Simple contact rows */
        .talk-simple{margin:12px 0 6px}
        .talk-row{display:flex;gap:10px;align-items:center;margin:6px 0}
        .talk-icon{color:${BRAND_GOLD};display:inline-flex;align-items:center;justify-content:center}
        .talk-link{color:${TEXT_MAIN};text-decoration:none;border-bottom:1px dashed rgba(255,255,255,.25)}
        .talk-link:hover{color:${BRAND_GOLD};border-bottom-color:${BRAND_GOLD}}

        /* HQ address quick lines */
        .talk-address{margin-top:6px}
        .addr-row{display:flex;gap:10px;align-items:flex-start}
        .addr-pin{color:${BRAND_GOLD};display:inline-flex;align-items:center;justify-content:center}
        .addr-pin :global(svg){width:18px;height:18px;stroke-width:1.8}
        .addr-lines{line-height:1.65;color:${TEXT_SOFT}}

        /* Bottom */
        .fx-bottom{padding:16px 0 22px}
        .fx-bottom-wrap{display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px}
        .fx-topbar{width:72px;height:3px;border-radius:3px;background:linear-gradient(90deg,${BRAND_BLUE},${BRAND_GOLD});opacity:.9}
        .fx-copy{margin:0;color:${TEXT_SOFT};font-size:14.5px;letter-spacing:.25px}
        .fx-copy strong{color:${TEXT_MAIN};font-weight:800}
        .dot{margin:0 10px;color:rgba(255,255,255,.45)}

        /* MINI trusted logos row (square tiles) */
        .mini-trust{
          display:flex;
          grid-template-columns:repeat(5, 52px);
          gap:10px;
          margin-top:2px;
        }
        .mini-card{
          width:52px;height:52px;border-radius:12px;background:#fff;
          border:1px solid rgba(16,24,40,.08);
          box-shadow:0 6px 16px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.7);
          display:flex;align-items:center;justify-content:center;
          transition:transform .16s ease, box-shadow .16s ease, filter .16s ease;
        }
        .mini-card:hover{
          transform:translateY(-2px);
          box-shadow:0 10px 22px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.85);
        }
        .mini-card :global(img){max-height:36px;filter:grayscale(.05) saturate(.95) contrast(1.05)}
        .mini-card:hover :global(img){filter:grayscale(0) saturate(1.2) contrast(1.1)}

        @media (max-width:991px){
          .fx-title{font-size:18px}
          .mini-trust{grid-template-columns:repeat(5, 48px)}
          .mini-card{width:48px;height:48px}
        }
        @media (max-width:575px){
          .top-pad{padding-top:44px;padding-bottom:24px}
          .fx-copy{font-size:13.6px}
          .mini-trust{grid-template-columns:repeat(5, 42px)}
          .mini-card{width:42px;height:42px;border-radius:10px}
          .mini-card :global(img){max-height:30px}
        }
      `}</style>
    </footer>
  );
};

export default Footer;
