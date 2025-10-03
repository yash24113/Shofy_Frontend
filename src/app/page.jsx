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
import { FiPhoneCall, FiShare2 } from 'react-icons/fi';
import { FaWhatsapp, FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import Footer from '@/layout/footers/footer';
import styles from './FloatingButtons.module.scss';

export default function HomePageTwo() {
  // Toggle for the “C” social menu
  const [open, setOpen] = useState(false);

  // Close on outside click or ESC
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      const root = document.getElementById('socialC-root');
      if (root && !root.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

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
      <h1 style={{position:'absolute',left:'-9999px',top:'auto',width:'1px',height:'1px',overflow:'hidden'}}>
        Welcome to Amrita Global Enterprise - Quality Products & Services
      </h1>

      <FashionBanner />
      <PopularProducts />
      <WeeksFeatured />
      <FashionTestimonial />
      <BlogArea />
      <FeatureAreaTwo />

      {/* WhatsApp (kept per your styles) */}
      <a
        href="https://wa.me/919999999999"
        target="_blank"
        rel="noopener noreferrer"
        className={styles['whatsapp-float-btn']}
        aria-label="Chat on WhatsApp"
      >
        <FaWhatsapp size={26} />
      </a>

      {/* Call button at bottom-right */}
      <a href="tel:+919999999999" aria-label="Call us" className="call-float-btn">
        <FiPhoneCall size={24} />
      </a>

      {/* ===== Right-center sticky SOCIAL — “C” layout (toggle) ===== */}
      <div id="socialC-root" className="socialC-root" aria-label="Share">
        {/* Share chip toggles menu */}
        <button
          type="button"
          className={`share-chip ${open ? 'open' : ''}`}
          title="Share"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <FiShare2 size={18} />
        </button>

        <ul className={`socialC-items ${open ? 'open' : ''}`} aria-hidden={!open}>
          {socialLinks.map((s, idx) => (
            <li key={s.id} className={`pos-${idx+1}`} style={{ '--clr': s.color }}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.id} title={s.id}>
                {s.icon}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <Footer />

      <style jsx>{`
        /* ===== Call button ===== */
        .call-float-btn{
          position: fixed;
          right: 20px;
          bottom: 20px;
          z-index: 1300;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #0ea5e9;
          color: #fff;
          text-decoration: none;
          box-shadow: 0 10px 24px rgba(14,165,233,.35);
          transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
        }
        .call-float-btn:hover{ transform: translateY(-2px); background:#0284c7; }

        /* ===== Social C menu (right center) ===== */
        .socialC-root{
          position: fixed;
          right: 22px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1200;
          width: 220px;   /* canvas for the C curve */
          height: 320px;
          pointer-events: none; /* children will enable */
        }

        .share-chip{
          pointer-events: auto;
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%) rotate(0deg);
          width: 46px;
          height: 46px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #0b1b2a;
          background:#60a5fa;
          border: 0;
          box-shadow: 0 8px 20px rgba(0,0,0,.18);
          cursor: pointer;
          transition: transform .25s ease, background .2s ease, box-shadow .25s ease;
        }
        .share-chip:hover{ transform: translateY(-50%) scale(1.05); }
        .share-chip.open{ transform: translateY(-50%) rotate(45deg) scale(1.03); }

        .socialC-items{
          list-style: none;
          padding: 0;
          margin: 0;
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 100%;
          height: 100%;
          pointer-events: auto;
        }

        /* default (closed) state: hide chips near the button */
        .socialC-items li{
          --size: 48px;
          position: absolute;
          width: var(--size);
          height: var(--size);
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #fff;
          color: #111827;
          border: 2px solid var(--clr, #60a5fa);
          box-shadow: 0 10px 22px rgba(0,0,0,.14);
          transform: translate(0,0) scale(.6);
          opacity: 0;
          transition:
            transform 420ms cubic-bezier(.22,.8,.27,1),
            opacity 280ms ease,
            box-shadow .2s ease;
        }
        .socialC-items li a{
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: #111827;
          text-decoration: none;
          transition: transform .15s ease, color .15s ease;
        }
        .socialC-items li a :global(svg){ font-size: 18px; }
        .socialC-items li:hover{ box-shadow: 0 14px 30px rgba(0,0,0,.2); }
        .socialC-items li:hover a{ transform: scale(1.06); color: var(--clr, #0ea5e9); }

        /* OPEN state: reveal chips in “C” positions with staggered animation */
        .socialC-items.open li{ opacity: 1; transform: var(--pos, translate(0,0)) scale(1); }
        .socialC-items.open li:nth-child(1){ transition-delay: 40ms; }
        .socialC-items.open li:nth-child(2){ transition-delay: 80ms; }
        .socialC-items.open li:nth-child(3){ transition-delay: 120ms; }
        .socialC-items.open li:nth-child(4){ transition-delay: 160ms; }
        .socialC-items.open li:nth-child(5){ transition-delay: 200ms; }

        /* “C” pattern positions (top → bottom wrap) */
        .socialC-items .pos-1{ --pos: translate(-140px,  -10px); }
        .socialC-items .pos-2{ --pos: translate(-170px,   55px); }
        .socialC-items .pos-3{ --pos: translate(-185px,  120px); } /* deepest point */
        .socialC-items .pos-4{ --pos: translate(-170px,  185px); }
        .socialC-items .pos-5{ --pos: translate(-140px,  245px); }

        /* ===== Responsive tweaks ===== */
        @media (max-width: 768px){
          .socialC-root{ right: 14px; width: 200px; height: 300px; }
          .share-chip{ width: 42px; height: 42px; }
          .socialC-items li{ --size: 44px; }
          .socialC-items .pos-1{ --pos: translate(-120px,  -8px); }
          .socialC-items .pos-2{ --pos: translate(-145px,  50px); }
          .socialC-items .pos-3{ --pos: translate(-158px, 115px); }
          .socialC-items .pos-4{ --pos: translate(-145px, 178px); }
          .socialC-items .pos-5{ --pos: translate(-120px, 232px); }
        }

        @media (max-width: 480px){
          .socialC-root{ right: 10px; width: 180px; height: 260px; }
          .socialC-items li{ --size: 40px; }
          .socialC-items .pos-1{ --pos: translate(-105px,  -6px); }
          .socialC-items .pos-2{ --pos: translate(-125px,  44px); }
          .socialC-items .pos-3{ --pos: translate(-138px, 102px); }
          .socialC-items .pos-4{ --pos: translate(-125px, 160px); }
          .socialC-items .pos-5{ --pos: translate(-105px, 210px); }
          .call-float-btn{ right: 14px; bottom: 16px; }
        }
      `}</style>
    </Wrapper>
  );
}
