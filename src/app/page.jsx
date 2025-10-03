/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
'use client';
import React, { useEffect, useState } from "react";
import Wrapper from "@/layout/wrapper";
import HeaderTwo from '@/layout/headers/header-2';
import FashionBanner from '@/components/banner/fashion-banner';
import PopularProducts from '@/components/products/fashion/popular-products';
/* import ProductArea from '@/components/products/fashion/product-area'; */
import WeeksFeatured from '@/components/products/fashion/weeks-featured';
import BestSellerProducts from '@/components/products/fashion/best-seller-products';
import FashionTestimonial from '@/components/testimonial/fashion-testimonial';
import BlogArea from '@/components/blog/fashion/blog-area';
import FeatureAreaTwo from '@/components/features/feature-area-2';
import { FiShare2, FiPhoneCall } from 'react-icons/fi';
import { FaWhatsapp, FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import Footer from '@/layout/footers/footer';
import styles from './FloatingButtons.module.scss';

export default function HomePageTwo() {
  // chat removed from the UI per request; (kept state code minimal)
  const [showTrigger] = useState(false);

  // sticky social toggle state
  const [socialOpen, setSocialOpen] = useState(false);

  // close social on outside click / ESC
  useEffect(() => {
    if (!socialOpen) return;
    const onDocClick = (e) => {
      const root = document.getElementById('social-share-root');
      if (root && !root.contains(e.target)) setSocialOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setSocialOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [socialOpen]);

  // social links (Facebook, Instagram, YouTube, X/Twitter, LinkedIn)
  const socialLinks = [
    { id: 'fb', icon: <FaFacebookF />,  color: '#1877F2', href: 'https://facebook.com' },
    { id: 'ig', icon: <FaInstagram />,  color: '#E1306C', href: 'https://instagram.com' },
    { id: 'yt', icon: <FaYoutube />,    color: '#FF0000', href: 'https://youtube.com' },
    { id: 'tw', icon: <FaXTwitter />,   color: '#000000', href: 'https://twitter.com' },
    { id: 'ln', icon: <FaLinkedinIn />, color: '#0A66C2', href: 'https://linkedin.com' },
  ];

  return (
    <Wrapper>
      <HeaderTwo />
      <h1 style={{position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden'}}>
        Welcome to Amrita Global Enterprise - Quality Products & Services
      </h1>

      <FashionBanner />
      <PopularProducts />
      <WeeksFeatured />
      <FashionTestimonial />
      <BlogArea />
      <FeatureAreaTwo />

      {/* WhatsApp Floating Button (kept on left bottom per your styles file) */}
      <a
        href="https://wa.me/919999999999"
        target="_blank"
        rel="noopener noreferrer"
        className={styles['whatsapp-float-btn']}
        aria-label="Chat on WhatsApp"
      >
        <FaWhatsapp size={28} />
      </a>

      {/* ===== Call button at bottom-right (replaces message icon) ===== */}
      <a
        href="tel:+919999999999"
        aria-label="Call us"
        className="call-float-btn"
      >
        <FiPhoneCall size={26} />
      </a>

      {/* ===== Right-center sticky social menu ===== */}
      <div id="social-share-root" className="social-root">
        {/* Toggle Button (Share icon) */}
        <button
          id="social-toggle"
          className={`social-toggle ${socialOpen ? 'open' : ''}`}
          aria-label="Share"
          onClick={() => setSocialOpen(v => !v)}
          title="Share"
        >
          <FiShare2 size={22} />
        </button>

        {/* Radial Items */}
        <ul className={`social-items ${socialOpen ? 'show' : ''}`} aria-hidden={!socialOpen}>
          {socialLinks.map((s, idx) => (
            <li key={s.id} style={{ '--i': idx, '--clr': s.color }}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.id} title={s.id}>
                {s.icon}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <Footer />

      {/* Styles */}
      <style jsx>{`
        /* ======= CALL BUTTON (bottom-right) ======= */
        .call-float-btn{
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 1300;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #fff;
          background: #0ea5e9; /* light blue */
          box-shadow: 0 12px 28px rgba(14,165,233,.35);
          text-decoration: none;
          transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
        }
        .call-float-btn:hover{
          transform: translateY(-2px) scale(1.03);
          background: #0284c7;
          box-shadow: 0 16px 34px rgba(2,132,199,.35);
        }
        .call-float-btn:active{
          transform: translateY(0);
        }

        /* ======= RIGHT-CENTER STICKY SOCIAL ======= */
        .social-root{
          position: fixed;
          right: 34px;             /* give more breathing room from edge */
          top: 50%;
          transform: translateY(-50%);
          z-index: 1200;
          width: 360px;            /* larger canvas so items never clip */
          height: 360px;
          pointer-events: none;    /* children will re-enable */
        }

        .social-toggle{
          pointer-events: auto;
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%) rotate(0deg);
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 0;
          background: #111827;     /* dark pill as in screenshot */
          color: #fff;
          box-shadow: 0 14px 34px rgba(0,0,0,0.28);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform .35s ease, box-shadow .35s ease, background .2s ease;
        }
        .social-toggle:hover{
          transform: translateY(-50%) scale(1.05);
        }
        .social-toggle.open{
          background: #60a5fa;
          color: #0b1b2a;
          transform: translateY(-50%) rotate(45deg) scale(1.03);
        }

        .social-items{
          pointer-events: auto;
          list-style: none;
          padding: 0;
          margin: 0;
          position: absolute;
          right: 34px;             /* from the same anchor as toggle */
          top: 50%;
          transform: translateY(-50%);
          width: 0; height: 0;
        }

        /* Each item is a crisp, perfectly round white chip with colored ring */
        .social-items li{
          --size: 64px;                           /* bigger circle like screenshot */
          position: absolute;
          width: var(--size);
          height: var(--size);
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #ffffff;
          color: #111827;
          border: 3px solid var(--clr, #60a5fa);  /* colored ring */
          box-shadow: 0 12px 30px rgba(0,0,0,0.16),
                      inset 0 0 0 2px rgba(255,255,255,.9);
          opacity: 0;
          transform: translate(0,0) scale(.6);
          transition: transform 560ms cubic-bezier(.22,.8,.27,1),
                      opacity 420ms ease,
                      box-shadow .25s ease;
          backdrop-filter: blur(1px);
        }

        /* icon inside */
        .social-items li a{
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          border-radius: 50%;
          text-decoration: none;
          color: #111827;
          transition: transform .2s ease, color .2s ease;
        }
        .social-items li svg{
          font-size: 22px;
        }
        .social-items li:hover{ box-shadow: 0 18px 40px rgba(0,0,0,0.22); }
        .social-items li:hover a{ transform: scale(1.06); color: var(--clr, #0ea5e9); }

        /* show state + stagger animation */
        .social-items.show li{ opacity: 1; transform: var(--pos, translate(0,0)) scale(1); }
        .social-items li:nth-child(1){ transition-delay: 60ms; }
        .social-items li:nth-child(2){ transition-delay: 110ms; }
        .social-items li:nth-child(3){ transition-delay: 160ms; }
        .social-items li:nth-child(4){ transition-delay: 210ms; }
        .social-items li:nth-child(5){ transition-delay: 260ms; }

        /* Radial layout with more spacing so circles never overlap */
        .social-items.show li:nth-child(1){ --pos: translate(-150px, -120px); }
        .social-items.show li:nth-child(2){ --pos: translate(-200px,  -20px); }
        .social-items.show li:nth-child(3){ --pos: translate(-160px,   90px); }
        .social-items.show li:nth-child(4){ --pos: translate( -70px,  150px); }
        .social-items.show li:nth-child(5){ --pos: translate(  30px,  115px); }

        /* ===== Responsive ===== */
        @media (max-width: 768px){
          .social-root{ right: 16px; width: 300px; height: 300px; }
          .social-toggle{ width: 56px; height: 56px; }
          .social-items li{ --size: 56px; }
          .social-items.show li:nth-child(1){ --pos: translate(-130px, -100px); }
          .social-items.show li:nth-child(2){ --pos: translate(-170px,  -10px); }
          .social-items.show li:nth-child(3){ --pos: translate(-135px,   80px); }
          .social-items.show li:nth-child(4){ --pos: translate( -55px,  130px); }
          .social-items.show li:nth-child(5){ --pos: translate(  20px,  100px); }
        }

        @media (max-width: 480px){
          .social-root{ right: 12px; width: 260px; height: 260px; }
          .social-items li{ --size: 52px; }
          .social-items.show li:nth-child(1){ --pos: translate(-110px, -90px); }
          .social-items.show li:nth-child(2){ --pos: translate(-145px,  -5px); }
          .social-items.show li:nth-child(3){ --pos: translate(-115px,  70px); }
          .social-items.show li:nth-child(4){ --pos: translate( -45px, 115px); }
          .social-items.show li:nth-child(5){ --pos: translate(  15px,  88px); }
          .call-float-btn{ right: 16px; bottom: 16px; }
        }
      `}</style>
    </Wrapper>
  );
}
