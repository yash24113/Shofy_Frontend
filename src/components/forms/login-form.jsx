'use client';

import React, { useState } from 'react';
import Cookies from 'js-cookie';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useRouter, useSearchParams } from 'next/navigation';
import ErrorMsg from '../common/error-msg';
import { notifyError, notifySuccess } from '@/utils/toast';

// validation schemas
const passwordSchema = Yup.object().shape({
  email: Yup.string().required('Email is required').email('Enter a valid email'),
  password: Yup.string().required('Password is required').min(6, 'At least 6 characters'),
});
const otpRequestSchema = Yup.object().shape({
  email: Yup.string().required('Email is required').email('Enter a valid email'),
});

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/profile';

  // modes: 'password' | 'otpRequest' | 'otpVerify'
  const [mode, setMode] = useState('password');
  const [savedEmail, setSavedEmail] = useState('');
  const [otp, setOtp] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // password form
  const {
    register: regPass,
    handleSubmit: onPassSubmit,
    formState: { errors: passErr },
    reset: resetPass,
  } = useForm({ resolver: yupResolver(passwordSchema) });

  // OTP request form
  const {
    register: regOtp,
    handleSubmit: onOtpReqSubmit,
    formState: { errors: otpErrReq },
    reset: resetOtpReq,
  } = useForm({ resolver: yupResolver(otpRequestSchema) });

  const API = process.env.NEXT_PUBLIC_API_BASE_URL;
  const KEY = process.env.NEXT_PUBLIC_API_KEY;

  // 1) Email/password login
  const handlePasswordLogin = async (data) => {
    try {
      const res = await fetch(`${API}/users/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(KEY ? { 'x-api-key': KEY } : {}),
        },
        body: JSON.stringify({ identifier: data.email, password: data.password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Login failed');

      // store user for UI
      Cookies.set('userInfo', JSON.stringify({ user: json.user }), { expires: 0.5 });

      // store sessionId for logout
      if (typeof window !== 'undefined' && json.sessionId) {
        localStorage.setItem('sessionId', json.sessionId);
      }

      notifySuccess(json.message || 'Login successful');
      resetPass();

      // go to same page if redirect was provided by opener
      if (redirect) router.push(redirect);
      else router.push('/');
    } catch (err) {
      notifyError(err?.message || 'Login failed');
    }
  };

  // 2) Request OTP
  const handleOtpRequest = async (data) => {
    try {
      setSavedEmail(data.email);
      const res = await fetch(`${API}/users/request-login-otp`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(KEY ? { 'x-api-key': KEY } : {}),
        },
        body: JSON.stringify({ email: data.email }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'OTP send failed');

      notifySuccess('OTP sent to your email');
      setMode('otpVerify');
      resetOtpReq();
    } catch (err) {
      notifyError(err?.message || 'OTP request failed');
    }
  };

  // 3) Verify OTP & login
  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/users/verify-login-otp`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(KEY ? { 'x-api-key': KEY } : {}),
        },
        body: JSON.stringify({ email: savedEmail, otp }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Invalid OTP');

      // store user for UI
      Cookies.set('userInfo', JSON.stringify({ user: json.user }), { expires: 0.5 });

      // store sessionId for logout
      if (typeof window !== 'undefined' && json.sessionId) {
        localStorage.setItem('sessionId', json.sessionId);
      }

      notifySuccess('Logged in successfully');
      setOtp('');
      if (redirect) {
        router.push(redirect);
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Email & Password Login */}
      {mode === 'password' && (
        <form onSubmit={onPassSubmit(handlePasswordLogin)} className="space-y-4">
          <div className="tp-input-box">
            <label className="tp-label" htmlFor="lp-email">Email</label>
            <input
              id="lp-email"
              autoFocus
              {...regPass('email')}
              type="email"
              placeholder="you@example.com"
              className="tp-input"
            />
            <ErrorMsg msg={passErr?.email?.message} />
          </div>

          <div className="tp-input-box">
            <label className="tp-label" htmlFor="lp-pass">Password</label>
            <input
              id="lp-pass"
              {...regPass('password')}
              type="password"
              placeholder="Your password"
              className="tp-input"
              autoComplete="current-password"
            />
            <ErrorMsg msg={passErr?.password?.message} />
          </div>

          <div className="tp-actions">
            <button type="submit" className="tp-btn tp-btn-black">Login</button>
          </div>
        </form>
      )}

      {/* Divider + Toggle */}
      <div className="tp-divider">
        {mode === 'password' ? (
          <button
            onClick={() => setMode('otpRequest')}
            className="tp-link"
            type="button"
          >
            or login with OTP
          </button>
        ) : (
          <button
            onClick={() => setMode('password')}
            className="tp-link"
            type="button"
          >
            or Sign in with Email
          </button>
        )}
      </div>

      {/* OTP Request */}
      {mode === 'otpRequest' && (
        <form onSubmit={onOtpReqSubmit(handleOtpRequest)} className="space-y-4 mb-6">
          <div className="tp-input-box">
            <label className="tp-label" htmlFor="lo-email">Email</label>
            <input
              id="lo-email"
              autoFocus
              {...regOtp('email')}
              type="email"
              placeholder="you@example.com"
              className="tp-input"
            />
            <ErrorMsg msg={otpErrReq?.email?.message} />
          </div>

          <div className="tp-actions">
            <button type="submit" className="tp-btn tp-btn-black">Get OTP</button>
          </div>
        </form>
      )}

      {/* OTP Verify */}
      {mode === 'otpVerify' && (
        <form onSubmit={handleOtpVerify} className="space-y-4 mb-6">
          <div className="tp-input-box">
            <label className="tp-label" htmlFor="lv-otp">OTP</label>
            <input
              id="lv-otp"
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="tp-input"
              inputMode="numeric"
              pattern="[0-9]*"
              required
            />
          </div>

          {error ? <ErrorMsg msg={error} /> : null}

          <div className="tp-actions">
            <button type="submit" disabled={loading} className="tp-btn tp-btn-black">
              {loading ? 'Verifying…' : 'Verify OTP'}
            </button>
          </div>

          <div className="tp-divider">
            <button
              onClick={() => setMode('password')}
              className="tp-link"
              type="button"
            >
              back to password login
            </button>
          </div>
        </form>
      )}

      {/* Scoped styles for inputs & buttons */}
      <style jsx>{`
        .tp-input-box { display:flex; flex-direction:column; gap:6px; }
        .tp-label { font-weight:600; color:#0f172a; }
        .tp-input {
          width:100%;
          padding:12px 14px;
          border:1px solid #d6dae1;
          border-radius:0;            /* square */
          background:#fff;
          color:#0f172a;
          outline:none;
          transition:border-color .15s ease, box-shadow .15s ease;
        }
        .tp-input:focus {
          border-color:#0f172a;
          box-shadow:0 0 0 2px rgba(15,23,42,.15);
        }

        .tp-actions { margin-top:8px; }
        .tp-btn {
          width:100%;
          padding:12px 18px;
          border:1px solid transparent;
          border-radius:0;            /* square */
          font-weight:700;
          cursor:pointer;
          transition:all .18s ease;
        }
        .tp-btn-black {
          background:#000;
          color:#fff;
          border-color:#000;
        }
        .tp-btn-black:hover {
          background:#fff;
          color:#000;
          border-color:#000;
        }

        .tp-divider {
          text-align:center;
          margin:18px 0;
        }
        .tp-link {
          background:none;
          border:0;
          color:#475569;
          text-decoration:underline;
          cursor:pointer;
        }
      `}</style>
    </div>
  );
}
