'use client';
import React from 'react';
import ContactForm from '../forms/contact-form';

export default function ContactArea() {
  return (
    <section className="contact-section light-brand">
      <div className="contact-wrapper">
        <div className="contact-grid">
          {/* Left: Info / Addresses */}
          <div className="info-side">
            <h2 className="info-heading">Get in Touch</h2>
            <p className="info-subtitle">
              We’d love to hear from you. Reach out to us through any of the following channels.
            </p>

            <div className="contact-info-lines">
              <div className="info-line">
                <div className="info-icon-wrapper">✉️</div>
                <div className="info-content">
                  <span className="info-label">Email</span>
                  <span className="info-value">info@amritafashions.com</span>
                </div>
              </div>

              <div className="info-line">
                <div className="info-icon-wrapper">📞</div>
                <div className="info-content">
                  <span className="info-label">Phone</span>
                  <span className="info-value">+91 99251 55141</span>
                </div>
              </div>

              <div className="info-line address-line">
                <div className="info-icon-wrapper">📍</div>
                <div className="info-content">
                  <span className="info-label">Office Address</span>
                  <span className="info-value">
                    404, 4th Floor, Safal Prelude,<br />
                    Behind YMCA Club, Corporate Road,<br />
                    Prahlad Nagar, Ahmedabad, Gujarat, India — 380015
                  </span>
                </div>
              </div>

              <div className="info-line address-line">
                <div className="info-icon-wrapper">🏭</div>
                <div className="info-content">
                  <span className="info-label">Factory Address</span>
                  <span className="info-value">
                    1, Mohan Estate, Ramol Road,<br />
                    Ahmedabad, Gujarat, India — 382449
                  </span>
                </div>
              </div>

              <div className="info-line address-line">
                <div className="info-icon-wrapper">📦</div>
                <div className="info-content">
                  <span className="info-label">Warehouse Address</span>
                  <span className="info-value">
                    Nr. Ambuja Synthetics, B/H Old Narol Court,<br />
                    Narol, Ahmedabad, Gujarat, India — 382405
                  </span>
                </div>
              </div>

              <div className="info-line address-line">
                <div className="info-icon-wrapper">🌍</div>
                <div className="info-content">
                  <span className="info-label">UAE Office Address</span>
                  <span className="info-value">GSK Worldwide FZE, Ajman Free Zone, UAE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="form-side">
            <div className="form-header">
              <h3 className="form-title">Send us a Message</h3>
              <p className="form-subtitle">Fill out the form below and we’ll get back to you shortly.</p>
            </div>
            <ContactForm />
          </div>
        </div>
      </div>

      <style jsx>{`
        /* --- Brand tokens (match your footer palette, but for light UI) --- */
        .light-brand{
          --navy: #0F2235;          /* footer/header deep */
          --ink: #142A42;           /* darker text accent */
          --accent: #2C4C97;        /* CTA/link blue */
          --gold: #D6A74B;          /* small highlights/underlines */
          --bg: #F7F9FC;            /* light page background */
          --surface: #FFFFFF;       /* cards */
          --border: #E6ECF2;        /* soft borders */
          --text-main: #0F2235;     /* headings on light */
          --text-soft: #475569;     /* body text */
          --shadow: 0 10px 24px rgba(15,34,53,.08);
        }

        /* Section: LIGHT (contrasts with dark footer) */
        .contact-section{
          background: var(--bg);
          padding: 80px 0;
          width: 100vw;
          position: relative;
          left: 50%;
          right: 50%;
          margin-left: -50vw;
          margin-right: -50vw;
          color: var(--text-main);
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, 'Plus Jakarta Sans', sans-serif;
        }

        .contact-wrapper{ max-width:1200px; margin:0 auto; padding:0 24px; }

        .contact-grid{
          display:grid;
          grid-template-columns: 1.05fr .95fr;
          gap:48px;
          align-items:start;
        }
        @media (max-width:1024px){ .contact-grid{ grid-template-columns:1fr; } }

        /* Headings: navy + gold underline (footer vibe, light context) */
        .info-heading{
          font-size:40px; font-weight:800; color:var(--text-main);
          margin:0 0 14px; position:relative; letter-spacing:.2px;
        }
        .info-heading::after{
          content:''; position:absolute; left:0; bottom:-10px;
          width:64px; height:4px; border-radius:2px; background:var(--gold);
        }
        .info-subtitle{ color:var(--text-soft); margin:22px 0 28px; max-width:560px; line-height:1.7; }

        /* Cards (white on light) */
        .contact-info-lines{ display:flex; flex-direction:column; gap:16px; }
        .info-line{
          display:flex; gap:14px; align-items:flex-start;
          background:var(--surface);
          border:1px solid var(--border);
          border-radius:14px; padding:18px;
          box-shadow: var(--shadow);
          transition: border-color .2s ease, transform .2s ease;
        }
        .info-line:hover{ border-color:var(--accent); transform: translateY(-2px); }

        .info-icon-wrapper{
          width:44px; height:44px; border-radius:10px;
          display:flex; align-items:center; justify-content:center;
          background: linear-gradient(135deg, var(--accent), #1f3f80);
          color:#fff; font-size:20px; line-height:1; flex-shrink:0;
          box-shadow: 0 6px 16px rgba(44,76,151,.20);
        }

        .info-content{ flex:1; }
        .info-label{ display:block; font-weight:800; font-size:15px; color:var(--ink); margin-bottom:4px; }
        .address-line .info-label{ color:var(--gold); }
        .info-value{ color:var(--text-soft); font-size:14.5px; line-height:1.6; }

        /* Form card: white with accent top bar */
        .form-side{
          background:var(--surface);
          border:1px solid var(--border);
          border-radius:16px; padding:32px;
          box-shadow: var(--shadow);
          position:relative; overflow:hidden;
        }
        .form-side::before{
          content:''; position:absolute; top:0; left:0; right:0; height:4px;
          background: linear-gradient(90deg, var(--gold), var(--accent), var(--gold));
          background-size:200% 100%; animation: shimmer 4s ease-in-out infinite;
        }
        .form-header{ text-align:center; margin-bottom:22px; }
        .form-title{ color:var(--text-main); font-size:26px; font-weight:800; margin:0 0 6px; }
        .form-subtitle{ color:var(--text-soft); margin:0; }

        /* Make buttons inside your ContactForm follow brand accent */
        :global(button[type="submit"]),
        :global(.btn-primary){
          background: var(--accent) !important;
          border-color: var(--accent) !important;
          color: #fff !important;
        }
        :global(button[type="submit"]:hover),
        :global(.btn-primary:hover){ filter: brightness(.94); }

        @keyframes shimmer{ 0%,100%{background-position:-200% 0} 50%{background-position:200% 0} }

        @media (max-width:480px){
          .contact-section{ padding:64px 0; }
          .form-side{ padding:24px; }
          .info-heading{ font-size:32px; }
        }
      `}</style>
    </section>
  );
}
