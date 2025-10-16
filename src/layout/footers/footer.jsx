'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

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

/* SVG Fallback for YouTube */
const YouTubeSvg = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
    <path fill="currentColor" d="M23.5 6.2a3.7 3.7 0 0 0-2.6-2.6C18.9 3 12 3 12 3s-6.9 0-8.9.6A3.7 3.7 0 0 0 .5 6.2 38.7 38.7 0 0 0 0 12c0 1.9.2 3.8.5 5.8a3.7 3.7 0 0 0 2.6 2.6C5.1 21 12 21 12 21s6.9 0 8.9-.6a3.7 3.7 0 0 0 2.6-2.6c.3-2 .5-3.9.5-5.8 0-1.9-.2-3.8-.5-5.8zM9.6 15.6V8.4L15.8 12l-6.2 3.6z"/>
  </svg>
);

const Footer = () => {
  // ensure there’s a youtube entry; if not, add one so the icon always shows
  const socials = React.useMemo(() => {
    const hasYouTube = (social_data || []).some(
      s => /youtube/i.test(`${s?.label ?? ''} ${s?.icon ?? ''}`)
    );
    if (hasYouTube) return social_data;
    return [
      ...(social_data || []),
      {
        id: 'yt-fallback',
        label: 'YouTube',
        icon: 'fa-brands fa-youtube',
        link: 'https://www.youtube.com/', // change to your channel URL
      },
    ];
  }, []);

  return (
    <footer aria-label="Site Footer" className="age-footer">
      <div className="age-footer__gradient">
        {/* ===== TOP ===== */}
        <div className="age-footer__top">
          <div className="age-container">
            <div className="age-grid" role="list">
              {/* Addresses board */}
              <div className="age-col" role="listitem">
                <div className="age-widget">
                  <div className="age-addressBoard" aria-label="Company addresses">
                    <div className="age-addressSection">
                      <div className="age-addressTitle">Office Address</div>
                      <div className="age-addressLines">
                        <div>404, 4th Floor, Safal Prelude,</div>
                        <div>Behind YMCA Club, Corporate Road,</div>
                        <div>Prahlad Nagar, Ahmedabad, Gujarat, India – 380015</div>
                      </div>
                    </div>

                    <div className="age-addressSection">
                      <div className="age-addressTitle">Factory Address</div>
                      <div className="age-addressLines">
                        <div>1, Mohan Estate, Ramol Road,</div>
                        <div>Ahmedabad, Gujarat, India – 382449</div>
                      </div>
                    </div>

                    <div className="age-addressSection">
                      <div className="age-addressTitle">Warehouse Address</div>
                      <div className="age-addressLines">
                        <div>Nr. Ambuja Synthetics, B/H Old Narol Court,</div>
                        <div>Narol, Ahmedabad, Gujarat, India – 382405</div>
                      </div>
                    </div>

                    <div className="age-addressSection age--noSep">
                      <div className="age-addressTitle">UAE Office Address</div>
                      <div className="age-addressLines">
                        <div>GSK Worldwide FZE, Ajman Free Zone, UAE</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* My Account */}
              <div className="age-col" role="listitem">
                <div className="age-widget">
                  <h4 className="age-title">My Account</h4>
                  <ul className="age-list">
                    <li><Link href="#" className="age-link">Track Orders</Link></li>
                    <li><Link href="#" className="age-link">Shipping</Link></li>
                    <li><Link href="#" className="age-link">Wishlist</Link></li>
                    <li><Link href="#" className="age-link">My Account</Link></li>
                    <li><Link href="#" className="age-link">Order History</Link></li>
                    <li><Link href="#" className="age-link">Returns</Link></li>
                  </ul>
                </div>
              </div>

              {/* Information */}
              <div className="age-col" role="listitem">
                <div className="age-widget">
                  <h4 className="age-title">Information</h4>
                  <ul className="age-list">
                    <li><Link href="#" className="age-link">Our Story</Link></li>
                    <li><Link href="#" className="age-link">Careers</Link></li>
                    <li><Link href="#" className="age-link">Privacy Policy</Link></li>
                    <li><Link href="#" className="age-link">Terms &amp; Conditions</Link></li>
                    <li><Link href="#" className="age-link">Latest News</Link></li>
                    <li><Link href="#" className="age-link">Contact Us</Link></li>
                  </ul>
                </div>
              </div>

              {/* Talk To Us */}
              <div className="age-col" role="listitem">
                <div className="age-widget">
                  <h4 className="age-title">Talk To Us</h4>

                  {/* Newsletter */}
                  <div className="age-newsMini">
                    <p className="age-newsDesc">Subscribe to our newsletter to get the latest news and offers.</p>
                    <form className="age-pill" action="#" method="post" onSubmit={(e) => e.preventDefault()}>
                      <input type="email" required placeholder="Subscribe with us" aria-label="Email address" />
                      <button type="submit" aria-label="Subscribe" className="age-pillBtn">
                        <span className="age-arrow">›</span>
                      </button>
                    </form>
                  </div>

                  {/* Phone / Email */}
                  <div className="age-talk">
                    <div className="age-talkRow">
                      <span className="age-talkIcon"><PhoneIcon /></span>
                      <a className="age-talkLink" href="tel:+919925155141">+91 9925155141</a>
                    </div>
                    <div className="age-talkRow">
                      <span className="age-talkIcon"><Email /></span>
                      <a className="age-talkLink" href="mailto:info@amrita-fashions.com">info@amrita-fashions.com</a>
                    </div>
                  </div>

                  {/* HQ quick line */}
                  <div className="age-talkAddress">
                    <div className="age-addrRow">
                      <span className="age-addrPin"><Location /></span>
                      <div className="age-addrLines">
                        <div>4th Floor, Safal Prelude</div>
                        <div>404 Corporate Road, Near YMCA Club,</div>
                        <div>Prahlad Nagar, Ahmedabad, Gujarat</div>
                        <div>380015</div>
                      </div>
                    </div>
                  </div>

                  {/* Social */}
                  <div className="age-social" role="group" aria-label="Social links">
                    {socials.map((s) => {
                      const isYouTube =
                        /youtube/i.test(`${s?.label ?? ''} ${s?.icon ?? ''} ${s?.link ?? ''}`);
                      return (
                        <a
                          key={s.id}
                          href={s.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={s.label || 'Social link'}
                          title={s.label || undefined}
                          className="age-socialBtn"
                        >
                          {isYouTube ? (
                            <YouTubeSvg />
                          ) : (
                            <i className={s.icon} aria-hidden="true" />
                          )}
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ===== Bottom ===== */}
        <div className="age-footer__bottom">
          <div className="age-container">
            <div className="age-bottomWrap">
              <div className="age-topbar" />
              <p className="age-copy">
                <strong>© {new Date().getFullYear()} Amrita Global Enterprises</strong>
                <span className="age-dot">•</span>
                All rights reserved
                <span className="age-dot">•</span>
                Crafting quality textiles for a better tomorrow
              </p>

              <div className="age-trust">
                {trustedLogos.map((l, i) => (
                  <div key={i} className="age-trustCard" title={l.alt}>
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

      {/* ===== styles ===== */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Poppins:wght@600;700;800&display=swap');

        .age-footer { font-family:'Plus Jakarta Sans', system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, sans-serif; color:${TEXT_MAIN}; }
        .age-footer__gradient{ background:linear-gradient(180deg,${BG_TOP},${BG_BOTTOM}); border-top:1px solid ${BORDER_SOFT}; }

        .age-container{ max-width:1200px; margin:0 auto; padding:0 16px; }
        .age-grid{ display:grid; grid-template-columns: 1.2fr .8fr .9fr .9fr; gap:28px; }
        @media (max-width: 991px){ .age-grid{ grid-template-columns: 1fr 1fr; } }
        @media (max-width: 575px){ .age-grid{ grid-template-columns: 1fr; } }
        .age-col{ min-width:0; }

        .age-footer__top{ padding:56px 0 28px; }
        .age-footer__bottom{ background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,0)); border-top:1px solid ${BORDER_SOFT}; padding:16px 0 22px; }

        .age-title{
          font-family:'Poppins','Plus Jakarta Sans',system-ui,-apple-system,sans-serif;
          color:${TEXT_MAIN}; font-weight:800; font-size:20px; letter-spacing:.2px; margin:0 0 18px; position:relative;
        }
        .age-title::after{ content:''; position:absolute; left:0; bottom:-8px; width:36px; height:3px; border-radius:3px; background:linear-gradient(90deg,${BRAND_GOLD},${BRAND_BLUE}); opacity:.95; }

        /* Links – stronger specificity + !important to beat globals */
        .age-list{ list-style:none; margin:0; padding:0; }
        .age-list li{ margin:0 0 10px; }
        .age-footer :global(a.age-link){
          display:inline-block; font-weight:600; font-size:15px; text-decoration:none;
          color:${TEXT_MAIN} !important;
          border-bottom:1px dashed rgba(255,255,255,.25) !important;
          transition:color .22s ease, transform .15s ease, border-bottom-color .22s ease;
        }
        .age-footer :global(a.age-link:hover){
          color:${BRAND_GOLD} !important;
          border-bottom-color:${BRAND_GOLD} !important;
          transform:translateX(3px);
        }

        .age-addressBoard{
          background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.03));
          border:1px solid ${BORDER_SOFT}; border-radius:16px; padding:16px 16px 8px;
        }
        .age-addressSection{ position:relative; padding:10px 0 12px; }
        .age-addressSection:not(.age--noSep)::after{ content:''; position:absolute; left:0; right:0; bottom:0; height:1px; background:${BORDER_SOFT}; }
        .age-addressTitle{
          font-family:'Poppins','Plus Jakarta Sans',system-ui; font-weight:800; letter-spacing:.2px; margin:0 0 6px; color:${TEXT_MAIN};
          display:flex; align-items:center; gap:8px;
        }
        .age-addressTitle::before{ content:''; width:8px; height:8px; border-radius:50%; background:linear-gradient(90deg,${BRAND_GOLD},${BRAND_BLUE}); box-shadow:0 0 0 3px rgba(255,255,255,.06); }
        .age-addressLines{ color:${TEXT_SOFT}; line-height:1.65; }

        .age-newsMini{ margin:6px 0 12px; }
        .age-newsDesc{ color:${TEXT_SOFT}; margin:0 0 10px; font-size:18px; line-height:1.65; }
        .age-pill{ position:relative; display:flex; align-items:center; background:#fff; border:1px solid rgba(0,0,0,.04); border-radius:9999px; height:52px; padding:6px; box-shadow:0 10px 26px rgba(0,0,0,.18); }
        .age-pill input{ flex:1; height:100%; background:transparent; border:none; color:#0b1220; padding:0 18px; outline:none; font-size:15px; }
        .age-pill input::placeholder{ color:#6b7280; }
        .age-pillBtn{ width:40px; height:40px; border-radius:9999px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; background:${BRAND_GOLD}; color:#fff; box-shadow:0 10px 22px rgba(214,167,75,.35); }
        .age-arrow{ font-size:24px; line-height:1; transform:translateY(-1px); }

        .age-talk{ margin:12px 0 6px; }
        .age-talkRow{ display:flex; gap:10px; align-items:center; margin:6px 0; }
        .age-talkIcon{ color:${BRAND_GOLD}; display:inline-flex; align-items:center; justify-content:center; }
        .age-talkLink{ color:${TEXT_MAIN}; text-decoration:none; border-bottom:1px dashed rgba(255,255,255,.25); transition:color .22s ease, border-bottom-color .22s ease; }
        .age-talkLink:hover{ color:${BRAND_GOLD}; border-bottom-color:${BRAND_GOLD}; }

        .age-talkAddress{ margin-top:6px; }
        .age-addrRow{ display:flex; gap:10px; align-items:flex-start; }
        .age-addrPin{ color:${BRAND_GOLD}; display:inline-flex; align-items:center; justify-content:center; }
        .age-addrPin :global(svg){ width:18px; height:18px; stroke-width:1.8; }
        .age-addrLines{ line-height:1.65; color:${TEXT_SOFT}; }

        .age-social{ display:flex; gap:12px; margin-top:14px; flex-wrap:wrap; }
        .age-socialBtn{
          width:44px; height:44px; border-radius:12px; display:inline-flex; align-items:center; justify-content:center;
          color:${TEXT_MAIN}; border:1px solid ${BORDER_SOFT}; background:rgba(255,255,255,.06);
          transition:transform .15s ease, box-shadow .2s ease, background .2s;
        }
        .age-socialBtn:hover{ transform:translateY(-3px); background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.08)); box-shadow:0 10px 24px rgba(0,0,0,.35); }
        .age-social i { font-style: normal; color:${TEXT_MAIN}; }
        :global(.age-social .fa-brands){ font-family:"Font Awesome 6 Brands" !important; font-weight:400 !important; }
        :global(.age-social .fa-solid), :global(.age-social .fa-regular){ font-family:"Font Awesome 6 Free" !important; font-weight:900 !important; }

        .age-bottomWrap{ display:flex; flex-direction:column; align-items:center; text-align:center; gap:10px; }
        .age-topbar{ width:72px; height:3px; border-radius:3px; background:linear-gradient(90deg,${BRAND_BLUE},${BRAND_GOLD}); opacity:.9; }
        .age-copy{ margin:0; color:${TEXT_SOFT}; font-size:14.5px; letter-spacing:.25px; }
        .age-copy strong{ color:${TEXT_MAIN}; font-weight:800; }
        .age-dot{ margin:0 10px; color:rgba(255,255,255,.45); }

        .age-trust{ display:flex; gap:10px; margin-top:2px; }
        .age-trustCard{
          width:52px; height:52px; border-radius:12px; background:#fff;
          border:1px solid rgba(16,24,40,.08);
          box-shadow:0 6px 16px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.7);
          display:flex; align-items:center; justify-content:center;
          transition:transform .16s ease, box-shadow .16s ease, filter .16s ease;
        }
        .age-trustCard:hover{ transform:translateY(-2px); box-shadow:0 10px 22px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.85); }
        .age-trustCard :global(img){ max-height:36px; filter:grayscale(.05) saturate(.95) contrast(1.05); }
        .age-trustCard:hover :global(img){ filter:grayscale(0) saturate(1.2) contrast(1.1); }

        @media (max-width:991px){ .age-title{ font-size:18px; } }
        @media (max-width:575px){
          .age-footer__top{ padding:44px 0 24px; }
          .age-copy{ font-size:13.6px; }
          .age-trustCard{ width:42px; height:42px; border-radius:10px; }
          .age-trustCard :global(img){ max-height:30px; }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
