/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
'use client';
import React from "react";
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
  // Permanent (always visible) “C-shape” social list — no toggle click.
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

      {/* ===== Right-center sticky SOCIAL — “C” layout (always visible) ===== */}
      <div className="socialC-root" aria-label="Share">
        {/* small share chip label at the center (optional) */}
        <div className="share-chip" title="Share">
          <FiShare2 size={18} />
        </div>

        <ul className="socialC-items">
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
          width: 220px;   /* canvas area for the C curve */
          height: 320px;
          pointer-events: none; /* enable only children */
        }

        .share-chip{
          pointer-events: auto;
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 46px;
          height: 46px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #0b1b2a;
          background:#60a5fa;
          box-shadow: 0 8px 20px rgba(0,0,0,.18);
        }

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

        /* Smaller, crisp circular chips */
        .socialC-items li{
          --size: 48px;                 /* reduced size */
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
          transition: transform .18s ease, box-shadow .18s ease;
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

        /* === “C” pattern positions (top→bottom wrapping around the right edge) ===
           Layout idea:      1
                           2
                       3
                           4
                             5
        */
        /* more compact spacing; adjust to taste */
        .socialC-items .pos-1{ right: 140px; top: 10px;   }
        .socialC-items .pos-2{ right: 170px; top: 70px;   }
        .socialC-items .pos-3{ right: 185px; top: 135px;  } /* deepest point of the C */
        .socialC-items .pos-4{ right: 170px; top: 200px;  }
        .socialC-items .pos-5{ right: 140px; top: 260px;  }

        /* Subtle entrance on mount */
        .socialC-items li{
          animation: popIn .35s both;
        }
        .socialC-items .pos-1{ animation-delay: .02s; }
        .socialC-items .pos-2{ animation-delay: .06s; }
        .socialC-items .pos-3{ animation-delay: .10s; }
        .socialC-items .pos-4{ animation-delay: .14s; }
        .socialC-items .pos-5{ animation-delay: .18s; }

        @keyframes popIn{
          from{ transform: scale(.85); opacity:.0; }
          to{ transform: scale(1); opacity:1; }
        }

        /* ===== Responsive tweaks ===== */
        @media (max-width: 768px){
          .socialC-root{ right: 14px; width: 200px; height: 300px; }
          .share-chip{ width: 42px; height: 42px; }
          .socialC-items li{ --size: 44px; }
          .socialC-items .pos-1{ right: 120px; top: 10px;  }
          .socialC-items .pos-2{ right: 145px; top: 65px;  }
          .socialC-items .pos-3{ right: 158px; top: 130px; }
          .socialC-items .pos-4{ right: 145px; top: 195px; }
          .socialC-items .pos-5{ right: 120px; top: 250px; }
        }

        @media (max-width: 480px){
          .socialC-root{ right: 10px; width: 180px; height: 280px; }
          .socialC-items li{ --size: 40px; }
          .socialC-items .pos-1{ right: 105px; top: 10px;  }
          .socialC-items .pos-2{ right: 125px; top: 60px;  }
          .socialC-items .pos-3{ right: 138px; top: 122px; }
          .socialC-items .pos-4{ right: 125px; top: 184px; }
          .socialC-items .pos-5{ right: 105px; top: 235px; }
          .call-float-btn{ right: 14px; bottom: 16px; }
        }
      `}</style>
    </Wrapper>
  );
}
