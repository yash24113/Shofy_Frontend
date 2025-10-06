'use client';
import React, { useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiSearch, FiEye, FiPackage } from 'react-icons/fi';
import { TbBadge } from 'react-icons/tb';
import RegisterForm from '../forms/register-form';
import styles from '../../components/auth/AuthArea.module.css';

const RegisterArea: React.FC = () => {
  const router = useRouter();

  // Lock page scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleClose = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/');
  }, [router]);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose]);

  return (
    <>
      <div className={styles.modalOverlay} onClick={handleClose} />

      <section
        className={styles.modalCard}
        data-auth="register"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <div className={styles.modalGrid}>
          {/* ✕ inside the card */}
          <button className={styles.modalClose} onClick={handleClose} aria-label="Close">✕</button>

          {/* Left hero */}
          <div className={styles.leftPanel}>
            <div className={styles.leftContent}>
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJM0g6DS-JDkn7VvBDb6KfRzbS8ZiZfnuHJQ&s"
                alt="Logo"
                className={styles.logo}
              />
              <h2 className={styles.heading}>One-Stop Solution For All Your Fabric Sourcing Needs</h2>
              <ul className={styles.features}>
                <li><FiSearch className={styles.icon} /> Browse through 1000s of ready fabrics</li>
                <li><TbBadge className={styles.icon} /> Free swatches for better decision making</li>
                <li><FiEye className={styles.icon} /> End-to-end order visibility</li>
                <li><FiPackage className={styles.icon} /> Lowest MOQs in the industry</li>
              </ul>
            </div>
          </div>

          {/* Right form (scrolls on small screens) */}
          <div className={styles.rightPanel}>
            <div className={styles.header}>
              <h3 id="auth-title" className={styles.title}>Signup</h3>
              <p className={styles.subtitle}>
                Already a member? <Link href="/login" className={styles.linkBtn}>Login</Link>
              </p>
            </div>

            <div className={`${styles.formWrapper} ${styles.isRegister}`}>
              <RegisterForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default RegisterArea;
