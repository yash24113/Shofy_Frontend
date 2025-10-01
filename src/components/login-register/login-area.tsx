'use client';
import React from 'react';
import Link from 'next/link';
import { FiSearch, FiEye, FiPackage } from 'react-icons/fi';
import { TbBadge } from 'react-icons/tb';
import LoginForm from '../forms/login-form';
import styles from '../../components/auth/AuthArea.module.css';

const LoginArea: React.FC = () => {
  return (
    <section className={styles.authSection}>
      {/* Left info / image panel */}
      <div className={styles.leftPanel}>
        <div className={styles.leftOverlay} />
        <div className={styles.leftContent}>
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJM0g6DS-JDkn7VvBDb6KfRzbS8ZiZfnuHJQ&s"
            alt="Logo"
            className={styles.logo}
          />
          <h2 className={styles.heading}>
            One-Stop Solution For All Your Fabric Sourcing Needs
          </h2>
          <ul className={styles.features}>
            <li>
              <FiSearch className={styles.icon} /> Browse through 1000s of ready fabrics
            </li>
            <li>
               <TbBadge className={styles.icon} /> Free swatches for better decision making
            </li>
            <li>
              <FiEye className={styles.icon} /> End-to-end order visibility
            </li>
            <li>
              <FiPackage className={styles.icon} /> Lowest MOQs in the industry
            </li>
          </ul>
        </div>
      </div>

      {/* Right form panel */}
      <div className={styles.rightPanel}>
        <div className={styles.formWrapper}>
          <button className={styles.closeBtn} aria-label="close">
            ✕
          </button>

          <h3 className={styles.title}>Login</h3>
          <p className={styles.subtitle}>
            Don’t have an account?{' '}
            <Link href="/register">
              <span className={styles.signupLink}>Signup</span>
            </Link>
          </p>

          <LoginForm />
        </div>
      </div>
    </section>
  );
};

export default LoginArea;
