'use client';
import React from 'react';
import Link from 'next/link';
import { FiSearch, FiEye, FiPackage } from 'react-icons/fi';
import { TbBadge } from 'react-icons/tb';
import RegisterForm from '../forms/register-form';
import styles from '../../components/auth/AuthArea.module.css';

const RegisterArea: React.FC = () => {
  return (
    <section className={styles.authSection}>
      {/* Left Side */}
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

      {/* Right Side */}
      <div className={styles.rightPanel}>
        <div className={styles.formWrapper}>
          <button className={styles.closeBtn} aria-label="close">
            ✕
          </button>

          <h3 className={styles.title}>Signup</h3>
          <p className={styles.subtitle}>
            Already a member?{' '}
            <Link href="/login">
              <span className={styles.loginLink}>Login</span>
            </Link>
          </p>

          <div className={styles.formScroll}>
            <RegisterForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegisterArea;
