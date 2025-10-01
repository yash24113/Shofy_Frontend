'use client';
import React from 'react';
import Link from 'next/link';
import LoginForm from '../forms/login-form';

const LoginArea: React.FC = () => {
  return (
    <section className="authSection">
      {/* Left info / image panel */}
      <div className="leftPanel">
        <div className="leftOverlay" />
        <div className="leftContent">
          <div className="brand">
            <span className="logoBox">Fabrito</span>
          </div>
          <h2 className="heading">One-Stop Solution For All Your Fabric Sourcing Needs</h2>
          <ul className="features">
            <li><span className="icon">🔍</span> Browse through 1000s of ready fabrics</li>
            <li><span className="icon">🎁</span> Free swatches for better decision making</li>
            <li><span className="icon">👁️</span> End-to-end order visibility</li>
            <li><span className="icon">📦</span> Lowest MOQs in the industry</li>
          </ul>
        </div>
      </div>

      {/* Right form panel */}
      <div className="rightPanel">
        <div className="formWrapper">
          <button className="closeBtn" aria-label="close">✕</button>

          <h3 className="title">Login</h3>
          <p className="subtitle">
            Don’t have an account?{' '}
            <Link href="/register" legacyBehavior>
              <a className="signupLink">Signup</a>
            </Link>
          </p>

          <LoginForm />
        </div>
      </div>

      {/* Internal CSS */}
      <style jsx>{`
        .authSection {
          display: flex;
          min-height: 100vh;
          font-family: Arial, sans-serif;
        }

        /* Left Panel */
        .leftPanel {
          flex: 1;
          background: url('/images/fabrics-bg.jpg') center/cover no-repeat;
          position: relative;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .leftOverlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.6);
        }

        .leftContent {
          position: relative;
          z-index: 2;
          max-width: 400px;
        }

        .logoBox {
          background: #e25a4a;
          color: #fff;
          font-weight: bold;
          padding: 6px 14px;
          border-radius: 4px;
          font-size: 18px;
        }

        .heading {
          margin: 20px 0;
          font-size: 24px;
          font-weight: 700;
          line-height: 1.4;
        }

        .features {
          list-style: none;
          padding: 0;
          margin: 20px 0 0;
        }

        .features li {
          margin-bottom: 12px;
          font-size: 15px;
          display: flex;
          align-items: center;
        }

        .features .icon {
          margin-right: 8px;
        }

        /* Right Panel */
        .rightPanel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: #fff;
        }

        .formWrapper {
          width: 100%;
          max-width: 380px;
          position: relative;
        }

        .closeBtn {
          position: absolute;
          top: -10px;
          right: -10px;
          background: #eee;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          cursor: pointer;
        }

        .title {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .subtitle {
          font-size: 14px;
          margin-bottom: 20px;
        }

        .signupLink {
          color: #e25a4a;
          font-weight: 700;
          text-decoration: none;
        }

        .signupLink:hover {
          text-decoration: underline;
        }
      `}</style>
    </section>
  );
};

export default LoginArea;
