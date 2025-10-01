'use client';
import React from 'react';
import Link from 'next/link';
import styles from './AuthArea.module.css';

/* keep using your existing register form if present */
import RegisterForm from '../forms/register-form';

const RegisterArea: React.FC = () => {
  return (
    <section className={styles.authSection}>
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

      <div className={styles.rightPanel}>
        <div className={styles.formWrapper}>
          <button className={styles.closeBtn} aria-label="close">✕</button>

          <h3 className={styles.title}>Sign Up</h3>
          <p className={styles.subtitle}>
            Already have an account?{' '}
            <Link href="/login"><a style={{ color: '#e25a4a', fontWeight: 700 }}>Sign In</a></Link>
          </p>

          {/* Your RegisterForm will be styled by the module above */}
          <RegisterForm />
        </div>
      </div>
    </section>
  );
};

export default RegisterArea;
