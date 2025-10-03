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
import { FiMessageCircle } from 'react-icons/fi';
import { FaWhatsapp, FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter, FaYoutube, FaTelegramPlane } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import Footer from '@/layout/footers/footer';
import styles from './FloatingButtons.module.scss';

export default function HomePageTwo() {
  const [showTrigger, setShowTrigger] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', phone: '', help: '', email: '', location: '' });

  // NEW: social share toggle state
  const [socialOpen, setSocialOpen] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleClose = () => { setShowTrigger(false); setStep(0); setForm({ name: '', phone: '', help: '', email: '', location: '' }); };

  // Close chat trigger on outside click
  useEffect(() => {
    if (!showTrigger) return;
    const handleClick = (e) => {
      const trigger = document.getElementById('chat-trigger-bubble');
      const btn = document.getElementById('chat-float-btn');
      if (trigger && !trigger.contains(e.target) && btn && !btn.contains(e.target)) {
        setShowTrigger(false);
        setStep(0);
        setForm({ name: '', phone: '', help: '', email: '', location: '' });
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showTrigger]);

  // Close social menu on outside click / ESC
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

  const renderChatStep = () => {
    const botBubble = {
      background: '#e3f2fd', color: '#1976d2', borderRadius: 18, padding: '10px 16px', marginBottom: 10, maxWidth: '90%', boxShadow: '0 2px 8px rgba(33,150,243,0.08)', alignSelf: 'flex-start', fontSize: 15, lineHeight: 1.5
    };
    const submitBtn = { background: '#1976d2', color: 'white', border: 'none', borderRadius: 14, padding: '7px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px rgba(25,118,210,0.10)', height: 34 };
    const skipBtn = { background: '#e0e0e0', color: '#333', border: 'none', borderRadius: 14, padding: '7px 16px', fontWeight: 600, fontSize: 14, marginLeft: 4, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', height: 34 };
    const closeBtn = { background: '#e53935', color: 'white', border: 'none', borderRadius: 14, padding: '9px 0', fontWeight: 600, fontSize: 15, marginTop: 16, width: '100%', cursor: 'pointer', boxShadow: '0 2px 8px rgba(229,57,53,0.10)', height: 38 };
    const formRow = { display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' };
    const inputStyle = { borderRadius: 14, border: '1.2px solid #e0e0e0', padding: '7px 12px', fontSize: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', flex: 1 };

    switch (step) {
      case 0:
        return (
          <div className="chat-step" style={{display: 'flex', flexDirection: 'column'}}>
            <div className="chat-message bot-message" style={botBubble}>
              <p style={{margin: 0}}>👋 Hi there! Welcome to Amrita Global Enterprise.</p>
              <p style={{margin: 0}}>What&apos;s your name?</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setStep(1); }} style={formRow}>
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Your name" className="chat-input" style={inputStyle} autoFocus />
              <button type="submit" className="chat-submit-btn" style={{...submitBtn, opacity: form.name.trim() ? 1 : 0.6, cursor: form.name.trim() ? 'pointer' : 'not-allowed'}} disabled={!form.name.trim()}>Submit</button>
            </form>
          </div>
        );
      case 1:
        return (
          <div className="chat-step" style={{display: 'flex', flexDirection: 'column'}}>
            <div className="chat-message bot-message" style={botBubble}>
              <p style={{margin: 0}}>Nice to meet you, <b>{form.name}</b>! 😊</p>
              <p style={{margin: 0}}>How can I help you today?</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} style={formRow}>
              <input type="text" name="help" value={form.help} onChange={handleChange} placeholder="Type your message..." className="chat-input" style={inputStyle} autoFocus />
              <button type="submit" className="chat-submit-btn" style={{...submitBtn, opacity: form.help.trim() ? 1 : 0.6, cursor: form.help.trim() ? 'pointer' : 'not-allowed'}} disabled={!form.help.trim()}>Submit</button>
            </form>
          </div>
        );
      case 2:
        return (
          <div className="chat-step" style={{display: 'flex', flexDirection: 'column'}}>
            <div className="chat-message bot-message" style={botBubble}>
              <p style={{margin: 0}}>Thank you for sharing, <b>{form.name}</b>!</p>
              <p style={{margin: 0}}>Could you please share your mobile number?</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} style={formRow}>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="Mobile number" className="chat-input" style={inputStyle} autoFocus />
              <button type="submit" className="chat-submit-btn" style={{...submitBtn, opacity: form.phone.trim() ? 1 : 0.6, cursor: form.phone.trim() ? 'pointer' : 'not-allowed'}} disabled={!form.phone.trim()}>Submit</button>
            </form>
          </div>
        );
      case 3:
        return (
          <div className="chat-step" style={{display: 'flex', flexDirection: 'column'}}>
            <div className="chat-message bot-message" style={botBubble}>
              <p style={{margin: 0}}>Awesome! At Amrita Global Enterprise, we connect you with the best products and services tailored to your needs.</p>
              <p style={{margin: 0}}>Could you please share your email address?</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setStep(4); }} style={formRow}>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email address" className="chat-input" style={inputStyle} autoFocus />
              <button type="submit" className="chat-submit-btn" style={{...submitBtn, opacity: form.email.trim() ? 1 : 0.6, cursor: form.email.trim() ? 'pointer' : 'not-allowed'}} disabled={!form.email.trim()}>Submit</button>
              <button type="button" className="chat-skip-btn" style={skipBtn} onClick={() => setStep(4)}>Skip</button>
            </form>
          </div>
        );
      case 4:
        return (
          <div className="chat-step" style={{display: 'flex', flexDirection: 'column'}}>
            <div className="chat-message bot-message" style={botBubble}>
              <p style={{margin: 0}}>Thank you! Could you let us know your location?</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setStep(5); }} style={formRow}>
              <input type="text" name="location" value={form.location} onChange={handleChange} placeholder="Your city or area" className="chat-input" style={inputStyle} autoFocus />
              <button type="submit" className="chat-submit-btn" style={{...submitBtn, opacity: form.location.trim() ? 1 : 0.6, cursor: form.location.trim() ? 'pointer' : 'not-allowed'}} disabled={!form.location.trim()}>Submit</button>
            </form>
          </div>
        );
      case 5:
        return (
          <div className="chat-step" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div className="chat-message bot-message" style={botBubble}>
              <p style={{margin: 0}}>Thank you, <b>{form.name}</b>! Our team will connect with you soon.</p>
              <p style={{marginTop: 8, fontWeight: 500}}>📞 +91 9999999999<br/>📧 info@amritaglobal.com<br/>🌐 www.amritaglobal.com</p>
            </div>
            <button className="chat-close-btn" style={closeBtn} onClick={handleClose}>Close</button>
          </div>
        );
      default:
        return null;
    }
  };

  // Social links (replace with your real URLs)
  const socialLinks = [
    { id: 'whats', icon: <FaWhatsapp />, color: '#25D366', href: 'https://wa.me/919999999999' },
    { id: 'fb',    icon: <FaFacebookF />, color: '#1877F2', href: 'https://facebook.com' },
    { id: 'ig',    icon: <FaInstagram />, color: '#E1306C', href: 'https://instagram.com' },
    { id: 'ln',    icon: <FaLinkedinIn />, color: '#0A66C2', href: 'https://linkedin.com' },
    { id: 'tw',    icon: <FaTwitter />, color: '#1DA1F2', href: 'https://twitter.com' },
    { id: 'yt',    icon: <FaYoutube />, color: '#FF0000', href: 'https://youtube.com' },
    { id: 'tg',    icon: <FaTelegramPlane />, color: '#26A5E4', href: 'https://t.me' },
    { id: 'mail',  icon: <MdEmail />, color: '#EA4335', href: 'mailto:info@amritaglobal.com' },
  ];

  return (
    <Wrapper>
      <HeaderTwo />
      <h1 style={{position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden'}}>Welcome to Amrita Global Enterprise - Quality Products & Services</h1>
      <FashionBanner />
      <PopularProducts />
      {/* <ProductArea /> */}
      <WeeksFeatured />
      <FashionTestimonial />
      <BlogArea />
      <FeatureAreaTwo />

      {/* WhatsApp Floating Button (existing) */}
      <a
        href="https://wa.me/919999999999"
        target="_blank"
        rel="noopener noreferrer"
        className={styles['whatsapp-float-btn']}
        aria-label="Chat on WhatsApp"
      >
        <FaWhatsapp size={28} />
      </a>

      {/* Floating Chat Button (existing) */}
      <button
        id="chat-float-btn"
        className={styles['message-float-btn']}
        onClick={() => setShowTrigger(true)}
        aria-label="Contact Us"
      >
        <FiMessageCircle size={28} />
      </button>

      {/* Chat bubble */}
      {showTrigger && (
        <div
          id="chat-trigger-bubble"
          style={{
            position: 'fixed',
            right: 40,
            bottom: 100,
            zIndex: 1100,
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            padding: 20,
            minWidth: 260,
            maxWidth: 340,
            animation: 'fadeIn 0.2s',
          }}
        >
          <div className="custom-chat-content">{renderChatStep()}</div>
          <div
            style={{
              position: 'absolute',
              right: 24,
              bottom: -12,
              width: 0, height: 0,
              borderLeft: '12px solid transparent',
              borderRight: '12px solid transparent',
              borderTop: '12px solid white',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.10))',
            }}
          />
        </div>
      )}

      {/* ===== Right-side Center Sticky Social Share ===== */}
      <div id="social-share-root" className="social-root">
        {/* Toggle Button */}
        <button
          id="social-toggle"
          className={`social-toggle ${socialOpen ? 'open' : ''}`}
          aria-label="Share"
          onClick={() => setSocialOpen((v) => !v)}
        >
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </button>

        {/* Radial Items */}
        <ul className={`social-items ${socialOpen ? 'show' : ''}`} aria-hidden={!socialOpen}>
          {socialLinks.map((s, idx) => (
            <li key={s.id} style={{ '--i': idx, '--clr': s.color }}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.id}>
                {s.icon}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <Footer />

      {/* Page-level styles for the social menu & responsive chat bubble */}
      <style jsx>{`
        .social-root {
          position: fixed;
          right: 28px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1200;
          width: 280px;
          height: 280px;
          pointer-events: none;
        }

        .social-toggle {
          pointer-events: auto;
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 0;
          background: #fff;
          color: #111827;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform .35s ease, box-shadow .35s ease, background .2s ease;
        }
        .social-toggle:hover {
          transform: translateY(-50%) scale(1.04);
          box-shadow: 0 14px 28px rgba(0,0,0,0.18);
        }
        .social-toggle.open {
          background: #60a5fa;
          color: #0b1b2a;
        }
        .social-toggle .dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: currentColor;
          margin: 0 2px;
          display: inline-block;
        }

        .social-items {
          pointer-events: auto;
          list-style: none;
          padding: 0;
          margin: 0;
          position: absolute;
          right: 28px;
          top: 50%;
          transform: translateY(-50%);
          width: 0; height: 0;
        }

        .social-items li {
          --size: 46px;
          position: absolute;
          width: var(--size);
          height: var(--size);
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #fff;
          color: #111827;
          box-shadow: 0 10px 24px rgba(0,0,0,0.15);
          transition: transform 0.5s ease, opacity 0.4s ease;
          opacity: 0;
          transform: translate(0,0) scale(0.5);
        }
        .social-items.show li {
          opacity: 1;
          transform: var(--pos, translate(0,0)) scale(1);
        }

        .social-items.show li:nth-child(1) { --pos: translate(-70px, -110px); }
        .social-items.show li:nth-child(2) { --pos: translate(-120px, -55px); }
        .social-items.show li:nth-child(3) { --pos: translate(-135px,   5px); }
        .social-items.show li:nth-child(4) { --pos: translate(-120px,  65px); }
        .social-items.show li:nth-child(5) { --pos: translate(-70px,  110px); }
        .social-items.show li:nth-child(6) { --pos: translate(-10px,  135px); }
        .social-items.show li:nth-child(7) { --pos: translate( 50px,  120px); }
        .social-items.show li:nth-child(8) { --pos: translate( 95px,   75px); }

        .social-items li a {
          width: 100%; height: 100%;
          display: grid; place-items: center;
          color: #111827;
          text-decoration: none;
          border-radius: 50%;
          transition: transform .2s ease;
          position: relative;
        }
        .social-items li a::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 50%;
          box-shadow: inset 0 0 0 2px var(--clr, #60a5fa);
          opacity: .6;
        }
        .social-items li svg {
          font-size: 18px;
        }
        .social-items li:hover a {
          transform: scale(1.08);
        }
        .social-items li:hover {
          box-shadow: 0 14px 28px rgba(0,0,0,0.18);
        }
        .social-items li:hover a { color: var(--clr, #0ea5e9); }

        @media (max-width: 768px) {
          .social-root {
            right: 16px;
            width: 240px; height: 240px;
          }
          .social-toggle { width: 52px; height: 52px; }
          .social-items.show li:nth-child(1) { --pos: translate(-60px, -95px); }
          .social-items.show li:nth-child(2) { --pos: translate(-105px, -45px); }
          .social-items.show li:nth-child(3) { --pos: translate(-115px,   0); }
          .social-items.show li:nth-child(4) { --pos: translate(-100px,  55px); }
          .social-items.show li:nth-child(5) { --pos: translate(-55px,   95px); }
          .social-items.show li:nth-child(6) { --pos: translate(-5px,   115px); }
          .social-items.show li:nth-child(7) { --pos: translate( 40px,  100px); }
          .social-items.show li:nth-child(8) { --pos: translate( 80px,   60px); }
        }

        @media (max-width: 600px) {
          #chat-trigger-bubble {
            right: 2vw !important;
            left: 2vw !important;
            width: 96vw !important;
            min-width: unset !important;
            max-width: 98vw !important;
            padding: 10px 6px !important;
          }
          .chat-input {
            font-size: 13px !important;
            padding: 6px 8px !important;
          }
          .chat-submit-btn, .chat-skip-btn, .chat-close-btn {
            font-size: 13px !important;
            padding: 6px 10px !important;
            height: 30px !important;
          }
          .chat-message.bot-message {
            font-size: 13px !important;
            padding: 8px 10px !important;
          }
        }
      `}</style>
    </Wrapper>
  );
}