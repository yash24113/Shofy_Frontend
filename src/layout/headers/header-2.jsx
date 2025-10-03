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

const sanitizePhone = (v) => (v || '').replace(/[^\d+]/g, '');

const HeaderTwo = ({ style_2 = false }) => {
  const dispatch = useDispatch();
  const { sticky } = useSticky();
  const { wishlist } = useSelector((state) => state.wishlist);
  const { quantity } = useCartInfo();

  const [isOffCanvasOpen, setIsCanvasOpen] = useState(false);
  const { searchText, setSearchText, handleSubmit: handleSearchSubmit } = useSearchFormSubmit();

  // ---- Session & user dropdown ----
  const [hasSession, setHasSession] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userBtnRef = useRef(null);
  const userMenuRef = useRef(null);

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

  // close dropdown on outside click / ESC
  useEffect(() => {
    if (!userOpen) return;
    const onDoc = (e) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target) &&
        userBtnRef.current &&
        !userBtnRef.current.contains(e.target)
      ) {
        setUserOpen(false);
      }
    };
    const onEsc = (e) => e.key === 'Escape' && setUserOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [userOpen]);

  const handleLogout = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sessionId');
        try {
          import('js-cookie')
            .then((Cookies) => Cookies.default.remove('userInfo'))
            .catch(() => {});
        } catch {}
      }
    } finally {
      setHasSession(false);
      setUserOpen(false);
      if (typeof window !== 'undefined') window.location.href = '/';
    }
  };

  const phonePrimary = sanitizePhone('+919925155141');

  return (
    <>
      <header>
        <div className={`tp-header-area tp-header-style-${style_2 ? 'primary' : 'darkRed'} tp-header-height`}>
          {/* Header Top — intentionally hidden */}

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
                          style={{ height: 'auto', width: 'auto', maxWidth: '140px', maxHeight: '44px' }}
                          sizes="(max-width: 600px) 110px, 140px"
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
                                      <span>My Account</span>
                                    </Link>
                                    <Link className="user-item" href="/wishlist" role="menuitem" onClick={() => setUserOpen(false)}>
                                      <span>Wishlist</span>
                                    </Link>
                                    <button
                                      className="user-item"
                                      type="button"
                                      role="menuitem"
                                      onClick={() => {
                                        setUserOpen(false);
                                        dispatch(openCartMini());
                                      }}
                                    >
                                      <span>Cart</span>
                                    </button>
                                    <div className="user-divider" />
                                    <button className="user-item danger" type="button" role="menuitem" onClick={handleLogout}>
                                      <span>Logout</span>
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <Link className="user-item" href="/wishlist" role="menuitem" onClick={() => setUserOpen(false)}>
                                      <span>Wishlist</span>
                                    </Link>
                                    <Link className="user-item" href="/login" role="menuitem" onClick={() => setUserOpen(false)}>
                                      <span>Login</span>
                                    </Link>
                                    <Link className="user-item" href="/register" role="menuitem" onClick={() => setUserOpen(false)}>
                                      <span>Sign Up</span>
                                    </Link>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Wishlist icon (header) */}
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

      {/* Polished dropdown styles */}
      <style jsx>{`
        .user-menu-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 12px);
          z-index: 1000;
          min-width: 220px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow:
            0 20px 40px rgba(0,0,0,.14),
            0 2px 6px rgba(0,0,0,.06);
          overflow: hidden; /* keep rounded corners on focus ring */
          animation: menuPop .14s ease-out;
        }
        .user-menu-dropdown::before {
          /* caret triangle */
          content: "";
          position: absolute;
          right: 16px;
          top: -8px;
          width: 14px;
          height: 14px;
          background: #ffffff;
          transform: rotate(45deg);
          box-shadow: -2px -2px 6px rgba(0,0,0,.05);
        }
        .user-menu-inner {
          padding: 6px;
        }

        .user-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.2;
          color: #111827;
          text-decoration: none;
          text-align: left;
          background: transparent;
          border: 0;
          cursor: pointer;
          outline: none;
          transition: background .15s ease, color .15s ease, transform .02s ease;
        }
        .user-item:hover {
          background: #f3f4f6;
        }
        .user-item:focus-visible {
          background: #eef2ff;
          box-shadow: 0 0 0 3px rgba(99,102,241,.25) inset;
        }
        .user-item:active {
          transform: scale(.995);
        }
        .user-item.danger {
          color: #b91c1c;
        }
        .user-item.danger:hover {
          background: #fee2e2;
        }

        .user-divider {
          height: 1px;
          background: #e5e7eb;
          margin: 6px 8px;
          border-radius: 1px;
        }

        @keyframes menuPop {
          from { transform: translateY(-4px); opacity: .0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        /* Small screens: make sure menu doesn't overflow the edge */
        @media (max-width: 480px) {
          .user-menu-dropdown {
            min-width: 200px;
            right: -8px;
          }
          .user-menu-dropdown::before { right: 24px; }
        }
      `}</style>
    </>
  );
};

export default HeaderTwo;
