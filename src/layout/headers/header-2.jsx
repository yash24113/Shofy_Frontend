'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import useSticky from '@/hooks/use-sticky';
import useCartInfo from '@/hooks/use-cart-info';
import { openCartMini } from '@/redux/features/cartSlice';
import CartMiniSidebar from '@/components/common/cart-mini-sidebar';
import OffCanvas from '@/components/common/off-canvas';
import Menus from './header-com/menus';
import { CartTwo, Search } from '@/svg';
import useSearchFormSubmit from '@/hooks/use-search-form-submit';
import { FaHeart, FaUser } from 'react-icons/fa';
import { FiMenu } from 'react-icons/fi';

/* Use your existing modal components and CSS as-is */
import LoginArea from '@/components/login-register/login-area';
import RegisterArea from '@/components/login-register/register-area';

const HeaderTwo = ({ style_2 = false }) => {
  const dispatch = useDispatch();
  const { sticky } = useSticky();
  const { wishlist } = useSelector((state) => state.wishlist);
  const { quantity } = useCartInfo();
  const { searchText, setSearchText, handleSubmit: handleSearchSubmit } = useSearchFormSubmit();

  const [isOffCanvasOpen, setIsCanvasOpen] = useState(false);

  // ---- Session & user dropdown ----
  const [hasSession, setHasSession] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userBtnRef = useRef(null);
  const userMenuRef = useRef(null);

  // ---- Auth modal toggles (no routing) ----
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  // swallow-next-click flag to prevent click-through after closing on pointerdown
  const swallowNextClickRef = useRef(false);

  /* Watch localStorage for session */
  useEffect(() => {
    const check = () =>
      setHasSession(
        typeof window !== 'undefined' && !!window.localStorage.getItem('sessionId')
      );
    check();
    const onStorage = (e) => { if (e.key === 'sessionId') check(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  /* Close dropdown on outside click / escape / etc. */
  useEffect(() => {
    const close = () => setUserOpen(false);

    const onPointer = (e) => {
      const btn = userBtnRef.current;
      const menu = userMenuRef.current;
      const target = e.target;
      if (btn && btn.contains(target)) return;
      if (menu && menu.contains(target)) return;
      close();
    };
    const onEsc = (e) => { if (e.key === 'Escape') close(); };
    const onScroll = () => close();
    const onResize = () => close();
    const onVisibility = () => { if (document.visibilityState === 'hidden') close(); };

    if (userOpen) {
      document.addEventListener('mousedown', onPointer, true);
      document.addEventListener('touchstart', onPointer, true);
      document.addEventListener('keydown', onEsc);
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize);
      document.addEventListener('visibilitychange', onVisibility);
    }
    return () => {
      document.removeEventListener('mousedown', onPointer, true);
      document.removeEventListener('touchstart', onPointer, true);
      document.removeEventListener('keydown', onEsc);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [userOpen]);

  const handleLogout = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sessionId');
        try {
          import('js-cookie')
            .then((Cookies) => Cookies.default.remove('userInfo'))
            .catch((err) => console.error('Failed to remove userInfo cookie:', err));
        } catch (err) {
          console.error('Error importing js-cookie:', err);
        }
      }
    } finally {
      setHasSession(false);
      setUserOpen(false);
      if (typeof window !== 'undefined') window.location.href = '/';
    }
  };

  /* 1) Intercept Login<->Signup links INSIDE your modal so they toggle view instead of routing */
  useEffect(() => {
    if (!authOpen) return;

    const onIntercept = (e) => {
      const el = e.target.closest?.('a');
      if (!el) return;
      const href = el.getAttribute('href');

      // Only handle links inside your auth modals
      const inAuth = !!el.closest?.('[data-auth="login"], [data-auth="register"]');
      if (!inAuth) return;

      if (href === '/register') {
        e.preventDefault();
        e.stopPropagation();
        setAuthMode('register'); // swap to Signup tab
        return;
      }
      if (href === '/login') {
        e.preventDefault();
        e.stopPropagation();
        setAuthMode('login'); // swap to Login tab
        return;
      }
    };

    // capture phase beats Next.js Link
    document.addEventListener('click', onIntercept, true);
    return () => document.removeEventListener('click', onIntercept, true);
  }, [authOpen]);

  /* 2) Intercept CLOSE actions (✕ / overlay / ESC) using pointerdown + swallow next click */
  useEffect(() => {
    if (!authOpen) return;

    const closeModal = () => {
      setAuthOpen(false);
      // optionally reset: setAuthMode('login');
    };

    const onPointerDownCapture = (e) => {
      const t = e.target;
      const withinAuth = t.closest?.('[data-auth="login"], [data-auth="register"]');
      if (!withinAuth) return;

      const isOverlay = t.closest?.('.modalOverlay');
      const isCloseBtn = t.closest?.('.modalClose');
      if (isOverlay || isCloseBtn) {
        // stop event *before* click happens to prevent click-through
        e.preventDefault();
        e.stopPropagation();
        // mark to swallow the very next 'click' event the browser may still fire
        swallowNextClickRef.current = true;
        closeModal();
      }
    };

    const onKeydownCapture = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      }
    };

    // swallow the first click after we closed on pointerdown
    const onClickSwallow = (e) => {
      if (swallowNextClickRef.current) {
        e.preventDefault();
        e.stopPropagation();
        swallowNextClickRef.current = false;
      }
    };

    document.addEventListener('pointerdown', onPointerDownCapture, true);
    document.addEventListener('keydown', onKeydownCapture, true);
    document.addEventListener('click', onClickSwallow, true);

    return () => {
      document.removeEventListener('pointerdown', onPointerDownCapture, true);
      document.removeEventListener('keydown', onKeydownCapture, true);
      document.removeEventListener('click', onClickSwallow, true);
    };
  }, [authOpen]);

  return (
    <>
      <header>
        <div className={`tp-header-area tp-header-style-${style_2 ? 'primary' : 'darkRed'} tp-header-height`}>
          {/* Header Bottom */}
          <div
            id="header-sticky"
            className={`tp-header-bottom-2 tp-header-sticky ${sticky ? 'header-sticky' : ''}`}
          >
            <div className="container">
              <div className="tp-mega-menu-wrapper p-relative">
                <div className="row align-items-center">
                  {/* Logo */}
                  <div className="col-6 col-sm-4 col-md-4 col-lg-3 col-xl-2">
                    <div className="logo d-flex align-items-center" style={{ gap: '12px' }}>
                      <Link href="/" className="d-flex align-items-center" style={{ gap: '12px' }}>
                        <img
                          src="https://amritafashions.com/wp-content/uploads/amrita-fashions-small-logo-india.webp"
                          alt="Company Logo"
                          width={140}
                          height={44}
                          style={{ height: 'auto', width: 'auto', maxWidth: 140, maxHeight: 44 }}
                        />
                      </Link>
                    </div>
                  </div>

                  {/* Menu */}
                  <div className="d-none d-xl-block col-xl-5">
                    <div className="main-menu menu-style-2">
                      <nav className="tp-main-menu-content">
                        <Menus />
                      </nav>
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="col-6 col-sm-8 col-md-8 col-lg-9 col-xl-5">
                    <div className="tp-header-bottom-right d-flex align-items-center justify-content-end">
                      <div className="tp-header-search-2 d-none d-sm-block me-3">
                        <form onSubmit={handleSearchSubmit}>
                          <input
                            onChange={(e) => setSearchText(e.target.value)}
                            value={searchText}
                            type="text"
                            placeholder="Search for Products..."
                            aria-label="Search products"
                          />
                          <button type="submit" aria-label="Search">
                            <Search />
                          </button>
                        </form>
                      </div>

                      <div className="tp-header-action d-flex align-items-center">
                        {/* User dropdown */}
                        <div className="tp-header-action-item me-2 position-relative">
                          <button
                            ref={userBtnRef}
                            onClick={() => setUserOpen((v) => !v)}
                            className="tp-header-action-btn"
                            aria-haspopup="menu"
                            aria-expanded={userOpen}
                            aria-label="Account menu"
                            type="button"
                          >
                            <FaUser />
                          </button>

                          {userOpen && (
                            <div ref={userMenuRef} role="menu" className="user-menu-dropdown">
                              <div className="user-menu-inner">
                                {hasSession ? (
                                  <>
                                    <Link className="user-item" href="/profile" role="menuitem" onClick={() => setUserOpen(false)}>
                                      My Account
                                    </Link>
                                    <Link className="user-item" href="/wishlist" role="menuitem" onClick={() => setUserOpen(false)}>
                                      Wishlist
                                    </Link>
                                    <button
                                      className="user-item"
                                      type="button"
                                      role="menuitem"
                                      onClick={() => { setUserOpen(false); dispatch(openCartMini()); }}
                                    >
                                      My Booking
                                    </button>
                                    <div className="user-divider" />
                                    <button className="user-item danger" type="button" role="menuitem" onClick={handleLogout}>
                                      Logout
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <Link className="user-item" href="/wishlist" role="menuitem" onClick={() => setUserOpen(false)}>
                                      Wishlist
                                    </Link>

                                    {/* Open your modals (no routing) */}
                                    <button
                                      className="user-item"
                                      type="button"
                                      role="menuitem"
                                      onClick={() => { setUserOpen(false); setAuthMode('login'); setAuthOpen(true); }}
                                    >
                                      Login
                                    </button>
                                    <button
                                      className="user-item"
                                      type="button"
                                      role="menuitem"
                                      onClick={() => { setUserOpen(false); setAuthMode('register'); setAuthOpen(true); }}
                                    >
                                      Sign Up
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Wishlist */}
                        <div className="tp-header-action-item d-none d-lg-block me-2">
                          <Link href="/wishlist" className="tp-header-action-btn" aria-label="Wishlist">
                            <FaHeart />
                            <span className="tp-header-action-badge">{wishlist.length}</span>
                          </Link>
                        </div>

                        {/* Cart */}
                        <div className="tp-header-action-item me-2">
                          <button
                            onClick={() => dispatch(openCartMini())}
                            className="tp-header-action-btn cartmini-open-btn"
                            aria-label="Open cart"
                          >
                            <CartTwo />
                            <span className="tp-header-action-badge">{quantity}</span>
                          </button>
                        </div>

                        {/* Mobile hamburger */}
                        <div className="tp-header-action-item tp-header-hamburger d-xl-none">
                          <button
                            onClick={() => setIsCanvasOpen(true)}
                            type="button"
                            className="tp-offcanvas-open-btn"
                            aria-label="Open menu"
                          >
                            <FiMenu />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* end */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <CartMiniSidebar />
      <OffCanvas
        isOffCanvasOpen={isOffCanvasOpen}
        setIsCanvasOpen={setIsCanvasOpen}
        categoryType="fashion"
      />

      {/* Render your existing modal components conditionally */}
      {authOpen && (authMode === 'login' ? <LoginArea /> : <RegisterArea />)}

      {/* Only ONE styled-jsx block */}
      <style jsx>{`
        .user-menu-dropdown{
          position:absolute;
          right:0;
          top:calc(100% + 12px);
          z-index:1000;
          min-width: 230px;
          background:#fff;
          border-radius:12px;
          box-shadow:
            0 18px 40px rgba(0,0,0,.14),
            0 2px 6px rgba(0,0,0,.06);
          overflow:hidden;
          animation:menuPop .14s ease-out both;
        }
        .user-menu-dropdown::before{
          content:"";
          position:absolute;
          right:18px;
          top:-7px;
          width:14px;height:14px;
          background:#fff;
          transform:rotate(45deg);
          box-shadow:-2px -2px 6px rgba(0,0,0,.05);
        }

        .user-menu-inner{
          display:flex;
          flex-direction:column;
          gap:6px;
          padding:8px;
        }

        .user-item{
          display:block !important;
          width:100%;
          padding:10px 14px;
          border-radius:8px;
          font-size:14px;
          line-height:1.25;
          color:#111827;
          text-decoration:none;
          background:transparent;
          border:0;
          text-align:left;
          cursor:pointer;
          transition:background .15s ease,color .15s ease,transform .02s ease;
        }
        .user-item:hover{ background:#f3f4f6; }
        .user-item:focus-visible{
          outline:none;
          background:#eef2ff;
          box-shadow:0 0 0 3px rgba(99,102,241,.25) inset;
        }
        .user-item:active{ transform:scale(.995); }
        .user-item.danger{ color:#b91c1c; }
        .user-item.danger:hover{ background:#fee2e2; }

        .user-divider{
          height:1px;
          background:#e5e7eb;
          margin:2px 6px;
          border-radius:1px;
        }

        @keyframes menuPop{
          from{ transform:translateY(-4px); opacity:0; }
          to{   transform:translateY(0);    opacity:1; }
        }

        @media (max-width:480px){
          .user-menu-dropdown{ min-width:210px; right:-8px; }
          .user-menu-dropdown::before{ right:24px; }
        }
      `}</style>
    </>
  );
};

export default HeaderTwo;
