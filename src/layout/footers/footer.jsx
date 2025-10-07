'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import logo from '@assets/img/logo/my_logo.png';
import pay from '@assets/img/footer/footer-pay.png';
import social_data from '@/data/social-data';
import { Email, Location } from '@/svg';

const Footer = ({ style_2 = false, style_3 = false, primary_style = false }) => {
  const [hasSession, setHasSession] = useState(false);

  // detect login state from localStorage
  useEffect(() => {
    const check = () =>
      setHasSession(typeof window !== 'undefined' && !!localStorage.getItem('sessionId'));
    check();
    const onStorage = (e) => { if (e.key === 'sessionId') check(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('sessionId');
      try {
        const Cookies = (await import('js-cookie')).default;
        Cookies.remove('userInfo');
      } catch {}
    } finally {
      setHasSession(false);
      window.location.href = '/';
    }
  };

  // Quick Links (change with auth)
  const quickLinks = hasSession
    ? [
        { label: 'Products', href: '/shop' },
        { label: 'Wishlist', href: '/wishlist' },
        { label: 'My Account', href: '/profile' },
        { label: 'My Orders', href: '/orders' },
        { label: 'Logout', href: '#', onClick: handleLogout, isButton: true },
      ]
    : [
        { label: 'Products', href: '/shop' },
        { label: 'Wishlist', href: '/wishlist' },
        { label: 'Login', href: '/login' },
        { label: 'Signup', href: '/register' },
      ];

  return (
    <footer>
      <div
        className={`tp-footer-area ${
          primary_style ? 'tp-footer-style-2 tp-footer-style-primary tp-footer-style-6' : ''
        } ${style_2 ? 'tp-footer-style-2' : style_3 ? 'tp-footer-style-2 tp-footer-style-3' : ''}`}
        data-bg-color={`${style_2 ? 'footer-bg-white' : 'footer-bg-grey'}`}
      >
        {/* ===== Top ===== */}
        <div className="tp-footer-top pt-80 pb-40">
          <div className="container">
            <div className="row g-4">
              {/* Brand + social */}
              <div className="col-xl-4 col-lg-4 col-md-6">
                <div className="tp-footer-widget footer-col-1">
                  <div className="tp-footer-logo mb-16">
                    <Link href="/" className="footer-brand">
                      <Image
                        src={logo}
                        alt="Amrita Global Enterprises"
                        width={140}
                        height={46}
                        style={{ height: 'auto', width: 'auto', maxWidth: '140px' }}
                        priority
                      />
                      <span className="brand-name">Amrita Global Enterprises</span>
                    </Link>
                  </div>
                  <p className="tp-footer-desc">
                    Where premium yarns meet inspired design—crafted fabrics, ethical sourcing, and a truly global reach.
                  </p>

                  <div className="tp-footer-social">
                    {social_data.map((s) => (
                      <a key={s.id} href={s.link} target="_blank" rel="noreferrer" aria-label={s.label || 'Social'}>
                        <i className={s.icon} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="col-xl-3 col-lg-3 col-md-6">
                <div className="tp-footer-widget footer-col-2">
                  <h4 className="tp-footer-widget-title">Quick Links</h4>
                  <ul className="tp-footer-links">
                    {quickLinks.map((item, idx) =>
                      item.isButton ? (
                        <li key={`ql-${idx}`}>
                          <button type="button" onClick={item.onClick} className="footer-link-btn">
                            {item.label}
                          </button>
                        </li>
                      ) : (
                        <li key={`ql-${idx}`}>
                          <Link href={item.href} className="footer-link">
                            {item.label}
                          </Link>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>

              {/* Company */}
              <div className="col-xl-2 col-lg-2 col-md-6">
                <div className="tp-footer-widget footer-col-3">
                  <h4 className="tp-footer-widget-title">Company</h4>
                  <ul className="tp-footer-links">
                    <li><Link href="/about" className="footer-link">Our Story</Link></li>
                    <li><Link href="/careers" className="footer-link">Careers</Link></li>
                    <li><Link href="/privacy-policy" className="footer-link">Privacy Policy</Link></li>
                    <li><Link href="/terms" className="footer-link">Terms &amp; Conditions</Link></li>
                    <li><Link href="/blog" className="footer-link">Latest News</Link></li>
                    <li><Link href="/contact" className="footer-link">Contact Us</Link></li>
                  </ul>
                </div>
              </div>

              {/* Contact */}
              <div className="col-xl-3 col-lg-3 col-md-6">
                <div className="tp-footer-widget footer-col-4">
                  <h4 className="tp-footer-widget-title">Talk To Us</h4>

                  <div className="tp-footer-talk mb-14">
                    <span>Got Questions? Call us</span>
                    <h4><a href="tel:+919925155141" className="footer-strong">+91 99251 55141</a></h4>
                  </div>

                  <div className="tp-footer-contact">
                    <div className="tp-footer-contact-item d-flex align-items-start">
                      <div className="tp-footer-contact-icon">
                        <span><Email /></span>
                      </div>
                      <div className="tp-footer-contact-content">
                        <p>
                          <a href="mailto:support@amritafashions.com" className="footer-link">
                            support@amritafashions.com
                          </a>
                        </p>
                      </div>
                    </div>

                    <div className="tp-footer-contact-item d-flex align-items-start">
                      <div className="tp-footer-contact-icon">
                        <span><Location /></span>
                      </div>
                      <div className="tp-footer-contact-content">
                        <p>
                          <a
                            href="https://www.google.com/maps?q=Safal+Prelude,+Corporate+Rd,+Prahlad+Nagar,+Ahmedabad,+Gujarat+380015"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="footer-link"
                          >
                            4<sup>th</sup> Floor, Safal Prelude<br />
                            404 Corporate Road, Near YMCA Club<br />
                            Prahlad Nagar, Ahmedabad, Gujarat 380015
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>{/* row */}
          </div>
        </div>

        {/* ===== Bottom ===== */}
        <div className="tp-footer-bottom py-20">
          <div className="container">
            <div className="tp-footer-bottom-wrapper d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
              <div className="tp-footer-copyright">
                <p>
                  © {new Date().getFullYear()} Amrita Global Enterprises. All rights reserved. |
                  &nbsp;Crafting quality textiles for a better tomorrow.
                </p>
              </div>
              <div className="tp-footer-payment text-md-end">
                <Image src={pay} alt="Payment methods" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Styles (scoped) ===== */}
      <style jsx>{`
        .tp-footer-top { border-top: 1px solid #eef0f3; }
        .footer-brand { display:flex; align-items:center; gap:10px; color:#0f172a; text-decoration:none; }
        .brand-name { font-weight:800; font-size:18px; letter-spacing:.2px; }
        .tp-footer-desc { color:#4b5563; margin: 8px 0 14px; }

        .tp-footer-widget-title {
          font-weight:700; font-size:16px; margin-bottom:12px; color:#0f172a;
          text-transform: uppercase; letter-spacing: .6px;
        }

        .tp-footer-social a {
          display:inline-flex; align-items:center; justify-content:center;
          width:36px; height:36px; border-radius:8px; background:#0f172a; color:#fff;
          margin-right:8px; transition: transform .12s ease, opacity .15s ease;
        }
        .tp-footer-social a:hover { transform: translateY(-1px); opacity: .9; }

        .tp-footer-links { list-style:none; padding:0; margin:0; display:grid; gap:8px; }
        .footer-link, .footer-link-btn {
          display:inline-flex; align-items:center; gap:8px;
          color:#0f172a; text-decoration:none; padding:6px 0; border:0; background:transparent; cursor:pointer;
          position:relative;
        }
        .footer-link::before, .footer-link-btn::before {
          content: '›'; font-size:16px; line-height:1; color:#9ca3af; transform: translateY(1px);
        }
        .footer-link:hover, .footer-link-btn:hover { color:#111827; text-decoration: underline; }

        .tp-footer-contact-icon span { display:inline-flex; width:28px; height:28px; align-items:center; justify-content:center; }
        .tp-footer-contact-content a { text-decoration:none; }
        .footer-strong { font-weight:800; text-decoration:none; }

        .tp-footer-bottom { border-top: 1px solid #eef0f3; }
        .tp-footer-bottom p { margin:0; color:#6b7280; font-size:14px; }

        @media (max-width: 575px) {
          .brand-name { display:none; } /* keep footer compact on small phones */
        }
      `}</style>
    </footer>
  );
};

export default Footer;
