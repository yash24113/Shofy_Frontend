'use client';
import React from 'react';
import Link from 'next/link';
import styles from './AuthArea.module.css';

/* keep using your existing login form if present */
import LoginForm from '../forms/login-form';

const LoginArea: React.FC = () => {
  return (
    <section className={styles.authSection}>
      {/* Left info / image panel */}
      <div className={styles.leftPanel}>
        <div className={styles.leftOverlay} />
        <div className={styles.leftContent}>
          <img src="/images/logo.png" alt="Logo" className={styles.logo} />
          <h2 className={styles.heading}>One-Stop Solution For All Your Fabric Sourcing Needs</h2>
          <ul className={styles.features}>
            <li>Browse through 1000s of ready fabrics</li>
            <li>Free swatches for better decision making</li>
            <li>End-to-end order visibility</li>
            <li>Lowest MOQs in the industry</li>
          </ul>
        </div>
      </div>

      {/* Right form panel */}
      <div className={styles.rightPanel}>
        <div className={styles.formWrapper}>
          <button className={styles.closeBtn} aria-label="close">✕</button>

          <h3 className={styles.title}>Login</h3>
          <p className={styles.subtitle}>
            Don’t have an account?{' '}
            <Link href="/register"><a style={{ color: '#e25a4a', fontWeight: 700 }}>Signup</a></Link>
          </p>

          {/* If you already have LoginForm component it will be styled by the CSS above.
              If not, you may replace this with a simple form (see RegisterArea sample). */}
          <LoginForm />
        </div>
      </div>
    </section>
  );
};

export default LoginArea;
