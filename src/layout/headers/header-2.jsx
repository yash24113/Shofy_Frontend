'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import useSticky from '@/hooks/use-sticky';
import useCartInfo from '@/hooks/use-cart-info';
import {
  openCartMini,
  get_cart_products,
  selectCartDistinctCount
} from '@/redux/features/cartSlice';
import CartMiniSidebar from '@/components/common/cart-mini-sidebar';
import OffCanvas from '@/components/common/off-canvas';
import Menus from './header-com/menus';
import { CartTwo, Search } from '@/svg';
import { FaHeart, FaUser } from 'react-icons/fa';
import { FiMenu } from 'react-icons/fi';

/* ------------------ small helpers ------------------ */
const baseApi = () => {
  const b = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  return b.endsWith('/') ? b.slice(0, -1) : b;
};
const nonEmpty = (v) => v !== undefined && v !== null && String(v).trim() !== '';

/* Debounce hook (for input typing) */
function useDebounced(value, delay = 250) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

/* Shape normalizer so any backend shape works */
function normalizeProduct(p) {
  // Try common fields; keep it defensive
  const id = p._id || p.id || p.slug || String(Math.random());
  const slug = p.slug || p.seoSlug || p.handle || '';
  const name = p.name || p.title || p.productname || p.productName || 'Untitled';
  const img =
    p.image ||
    p.img ||
    p.thumbnail ||
    p.images?.[0] ||
    p.mainImage ||
    p.picture ||
    '/assets/img/product/default-product-img.jpg';
  const price = p.price || p.mrp || p.minPrice || null;
  return { id, slug, name, img, price };
}

/* Try a few endpoints, first one that returns ok+json wins */
async function searchProducts(q, limit = 10, signal) {
  const b = baseApi();
  const queries = [
    `${b}/product/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    `${b}/product?q=${encodeURIComponent(q)}&limit=${limit}`,
    `/api/search?q=${encodeURIComponent(q)}&limit=${limit}`,
  ];
  for (const url of queries) {
    try {
      const res = await fetch(url, { signal });
      if (!res.ok) continue;
      const data = await res.json();
      const arr =
        Array.isArray(data) ? data
          : Array.isArray(data?.data) ? data.data
          : Array.isArray(data?.results) ? data.results
          : Array.isArray(data?.items) ? data.items
          : [];
      if (arr.length >= 0) {
        return arr.map(normalizeProduct);
      }
    } catch {
      /* ignore & try next */
    }
  }
  return [];
}

const HeaderTwo = ({ style_2 = false }) => {
  const dispatch = useDispatch();
  const { sticky } = useSticky();

  const { wishlist } = useSelector((state) => state.wishlist || { wishlist: [] });
  const wishlistCount = Array.isArray(wishlist) ? wishlist.length : 0;

  // still present for compatibility
  const { quantity } = useCartInfo();
  const distinctCount = useSelector(selectCartDistinctCount) ?? 0;

  useEffect(() => { dispatch(get_cart_products()); }, [dispatch]);

  const [isOffCanvasOpen, setIsCanvasOpen] = useState(false);

  // ---- Inline search state (new) ----
  const [searchText, setSearchText] = useState('');
  const debouncedQ = useDebounced(searchText, 250);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selIndex, setSelIndex] = useState(-1);   // keyboard selection
  const searchWrapRef = useRef(null);

  // Fetch as you type (2+ chars)
  useEffect(() => {
    const controller = new AbortController();
    const q = (debouncedQ || '').trim();
    if (q.length < 2) {
      setResults([]);
      setSelIndex(-1);
      setLoading(false);
      return;
    }
    setLoading(true);
    setSearchOpen(true);
    searchProducts(q, 10, controller.signal)
      .then((arr) => {
        setResults(arr);
        setSelIndex(arr.length ? 0 : -1);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [debouncedQ]);

  // Close popover on outside click / ESC
  useEffect(() => {
    const onDoc = (e) => {
      const w = searchWrapRef.current;
      if (!w) return;
      if (!w.contains(e.target)) setSearchOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setSearchOpen(false); };
    document.addEventListener('mousedown', onDoc, true);
    document.addEventListener('touchstart', onDoc, true);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc, true);
      document.removeEventListener('touchstart', onDoc, true);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const onSearchSubmit = (e) => {
    e.preventDefault(); // stay in place
    if (selIndex >= 0 && results[selIndex]) {
      const p = results[selIndex];
      const href = p.slug ? `/product-details/${p.slug}` : `/product-details?id=${encodeURIComponent(p.id)}`;
      window.location.href = href; // explicit navigate only when user presses Enter on a selection
    } else {
      setSearchOpen(true); // just keep panel open
    }
  };

  // Keyboard navigation
  const onSearchKeyDown = (e) => {
    if (!searchOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelIndex((i) => Math.min((results.length || 0) - 1, (i < 0 ? 0 : i + 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelIndex((i) => Math.max(-1, i - 1));
    } else if (e.key === 'Enter') {
      // handled in onSearchSubmit
    }
  };

  // ---- Session & user dropdown ----
  const [hasSession, setHasSession] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userBtnRef = useRef(null);
  const userMenuRef = useRef(null);

  // Build current URL for redirect query
  const currentUrl = useMemo(() => {
    if (typeof window === 'undefined') return '/';
    const url = new URL(window.location.href);
    return url.pathname + url.search;
  }, []);

  useEffect(() => {
    const check = () =>
      setHasSession(typeof window !== 'undefined' && !!window.localStorage.getItem('sessionId'));
    check();
    const onStorage = (e) => { if (e.key === 'sessionId') check(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Close account dropdown on outside click / ESC / etc.
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

  return (
    <>
      <header>
        <div className={`tp-header-area tp-header-style-${style_2 ? 'primary' : 'darkRed'} tp-header-height`}>
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
                      {/* ======= SEARCH (inline) ======= */}
                      <div className="tp-header-search-2 d-none d-sm-block me-3 search-spacer" ref={searchWrapRef}>
                        <form onSubmit={onSearchSubmit}>
                          <input
                            onChange={(e) => { setSearchText(e.target.value); if (!searchOpen) setSearchOpen(true); }}
                            value={searchText}
                            onKeyDown={onSearchKeyDown}
                            type="text"
                            placeholder="Search for Products..."
                            aria-label="Search products"
                            onFocus={() => { if (nonEmpty(searchText)) setSearchOpen(true); }}
                          />
                          <button type="submit" aria-label="Search">
                            <Search />
                          </button>
                        </form>

                        {/* Results popover */}
                        {searchOpen && (
                          <div className="search-drop">
                            {loading ? (
                              <div className="search-empty">Searching…</div>
                            ) : results.length ? (
                              <ul className="search-list" role="listbox">
                                {results.map((p, idx) => {
                                  const href = p.slug
                                    ? `/product-details/${p.slug}`
                                    : `/product-details?id=${encodeURIComponent(p.id)}`;
                                  return (
                                    <li
                                      key={p.id || p.slug || idx}
                                      className={`search-item ${idx === selIndex ? 'is-active' : ''}`}
                                      role="option"
                                      aria-selected={idx === selIndex}
                                      onMouseEnter={() => setSelIndex(idx)}
                                    >
                                      <Link href={href} className="search-link" onClick={() => setSearchOpen(false)}>
                                        <img src={p.img} alt={p.name} width={44} height={44} loading="lazy" />
                                        <span className="search-meta">
                                          <span className="search-name">{p.name}</span>
                                          {p.price ? <span className="search-price">₹{p.price}</span> : null}
                                        </span>
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <div className="search-empty">
                                No results. {nonEmpty(searchText) ? 'Refine your keywords.' : 'Type at least 2 letters.'}
                                <div className="search-hint">If this persists, check your /product search API.</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="tp-header-action d-flex align-items-center">
                        {/* User area / Auth CTA */}
                        <div className="tp-header-action-item me-2 position-relative">
                          {hasSession ? (
                            <>
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
                                    <button
                                      className="user-item"
                                      type="button"
                                      role="menuitem"
                                      onClick={() => {
                                        setUserOpen(false);
                                        window.location.href = '/profile';
                                      }}
                                    >
                                      My Profile
                                    </button>

                                    <div className="user-divider" />
                                    <button
                                      className="user-item danger"
                                      type="button"
                                      role="menuitem"
                                      onClick={handleLogout}
                                    >
                                      Logout
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <Link
                              href={`/login?redirect=${encodeURIComponent(currentUrl)}`}
                              className="tp-auth-cta"
                              aria-label="Login or Sign Up"
                            >
                              <span className="tp-auth-cta-text">
                                <FaUser className="tp-auth-cta-icon" />
                                <span>Login&nbsp;/&nbsp;SignUp</span>
                              </span>
                            </Link>
                          )}
                        </div>

                        {/* Wishlist icon */}
                        <div className="tp-header-action-item d-none d-lg-block me-2">
                          <Link href="/wishlist" className="tp-header-action-btn" aria-label="Wishlist">
                            <FaHeart />
                            <span className="tp-header-action-badge">{wishlistCount}</span>
                          </Link>
                        </div>

                        {/* Cart — hidden when not logged in */}
                        {hasSession && (
                          <div className="tp-header-action-item me-2">
                            <button
                              onClick={() => dispatch(openCartMini())}
                              className="tp-header-action-btn cartmini-open-btn"
                              aria-label="Open cart"
                              type="button"
                            >
                              <CartTwo />
                              <span className="tp-header-action-badge">{distinctCount}</span>
                            </button>
                          </div>
                        )}

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

      {/* Polished dropdown styles + auth CTA styles + search spacing */}
      <style jsx>{`
        /* ===== extra spacing to the right of the search box ===== */
        .search-spacer { margin-right: 24px !important; }
        @media (min-width: 992px)  { .search-spacer { margin-right: 32px !important; } }
        @media (min-width: 1200px) { .search-spacer { margin-right: 40px !important; } }

        /* ===== Search icon position ===== */
        .tp-header-search-2 form { position: relative; }
        .tp-header-search-2 input { padding-right: 44px; }
        .tp-header-search-2 button {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: 0;
          display: inline-flex;
          align-items: center;
        }

        /* ====== Search dropdown ====== */
        .search-drop{
          position:absolute;
          z-index: 1100;
          width:min(560px, 70vw);
          max-height:60vh;
          overflow:auto;
          margin-top: 10px;
          background:#fff;
          border:1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 18px 40px rgba(0,0,0,.12), 0 2px 6px rgba(0,0,0,.06);
          padding: 6px;
        }
        .search-empty{
          padding:14px 16px;
          font-size:14px;
          color:#374151;
        }
        .search-hint{ font-size:12px; color:#6b7280; margin-top:4px; }

        .search-list{ list-style:none; padding:0; margin:0; }
        .search-item{ border-radius:10px; }
        .search-item + .search-item{ margin-top:4px; }
        .search-item.is-active{ background:#eef2ff; }
        .search-link{
          display:flex; align-items:center; gap:12px;
          padding:10px 12px; text-decoration:none; color:#111827;
        }
        .search-link img{
          width:44px; height:44px; object-fit:cover; border-radius:8px; flex:0 0 auto;
          background:#f3f4f6; border:1px solid #f3f4f6;
        }
        .search-meta{ display:flex; flex-direction:column; min-width:0; }
        .search-name{ font-weight:600; font-size:14px; line-height:1.1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width: 360px; }
        .search-price{ font-size:12px; color:#6b7280; margin-top:2px; }

        /* ===== Dropdown ===== */
        .user-menu-dropdown{
          position:absolute;
          right:0;
          top:calc(100% + 12px);
          z-index:1000;
          min-width: 230px;
          background:#fff;
          border-radius:12px;
          box-shadow: 0 18px 40px rgba(0,0,0,.14), 0 2px 6px rgba(0,0,0,.06);
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
        .user-menu-inner{ display:flex; flex-direction:column; gap:6px; padding:8px; }
        .user-item{
          display:block !important; width:100%; padding:10px 14px; border-radius:8px;
          font-size:14px; line-height:1.25; color:#111827; background:transparent; border:0; text-align:left;
          cursor:pointer; transition:background .15s ease,color .15s ease,transform .02s ease;
        }
        .user-item:hover{ background:#f3f4f6; }
        .user-item:focus-visible{ outline:none; background:#eef2ff; box-shadow:0 0 0 3px rgba(99,102,241,.25) inset; }
        .user-item:active{ transform:scale(.995); }
        .user-item.danger{ color:#b91c1c; }
        .user-item.danger:hover{ background:#fee2e2; }
        .user-divider{ height:1px; background:#e5e7eb; margin:2px 6px; border-radius:1px; }
        @keyframes menuPop{ from{ transform:translateY(-4px); opacity:0; } to{ transform:translateY(0); opacity:1; } }
        @media (max-width:480px){ .user-menu-dropdown{ min-width:210px; right:-8px; } .user-menu-dropdown::before{ right:24px; } }

        /* ===== Auth CTA (logged-out) ===== */
        .tp-auth-cta{
          display:inline-flex;
          align-items:center;
          gap:10px;
          padding:10px 16px;
          min-height:40px;
          background:#eef2f7;
          color:#111827;
          border:1px solid #cfd6df;
          border-radius:12px;
          text-decoration:none;
          font-weight:600;
          line-height:1;
          white-space:nowrap;
          transition:background .15s ease, box-shadow .15s ease, transform .02s ease;
        }
        .tp-auth-cta:hover{
          background:#e7ecf3;
          box-shadow:0 1px 0 rgba(17,24,39,.06) inset;
        }
        .tp-auth-cta:active{ transform:translateY(0.5px); }

        .tp-auth-cta-text{
          display:inline-flex;
          align-items:center;
          gap:8px;
          white-space:nowrap;
          line-height:1;
        }
        .tp-auth-cta-text svg,
        .tp-auth-cta-icon{
          width:18px;
          height:18px;
          flex:0 0 auto;
          display:inline-block;
          vertical-align:middle;
        }
      `}</style>
    </>
  );
};

export default HeaderTwo;
