'use client';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import WishlistItem from './wishlist-item';
import { Plus } from '@/svg';
import { add_to_wishlist } from '@/redux/features/wishlist-slice';

/* --------------------------- localStorage helpers --------------------------- */
const LS_GUEST_KEY = 'wishlist_guest';
const keyFrom = (sessionId, userId) =>
  sessionId && userId ? `wishlist_${userId}_${sessionId}` : LS_GUEST_KEY;

const readJSON = (key) => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeJSON = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value || []));
  } catch(e) {console.log("error",e)}
};

const dedupeById = (arr) => {
  const seen = new Set();
  return (arr || []).filter((it) => {
    const id = it?._id || it?.id;
    if (!id) return false;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const getSessionUser = () => {
  if (typeof window === 'undefined') return { sessionId: null, userId: null };
  return {
    sessionId: localStorage.getItem('sessionId') || null,
    userId: localStorage.getItem('userId') || null,
  };
};

const migrateGuestWishlistIfNeeded = () => {
  const { sessionId, userId } = getSessionUser();
  if (!sessionId || !userId) return null;

  const guest = readJSON(LS_GUEST_KEY);
  if (!guest.length) return null;

  const userKey = keyFrom(sessionId, userId);
  const existing = readJSON(userKey);
  const merged = dedupeById([...existing, ...guest]);

  writeJSON(userKey, merged);
  // keep guest list for future truly guest sessions? If you prefer clean-up, uncomment next line:
  localStorage.removeItem(LS_GUEST_KEY);

  return { userKey, merged };
};
/* --------------------------------------------------------------------------- */

const WishlistArea = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { wishlist } = useSelector((state) => state.wishlist) || { wishlist: [] };

  // track session/user to know which key to use
  const [{ sessionId, userId }, setSU] = useState(getSessionUser());

  const storageKey = useMemo(() => keyFrom(sessionId, userId), [sessionId, userId]);

  // On mount, if user just logged in, migrate guest → user-session list
  useEffect(() => {
    const migrated = migrateGuestWishlistIfNeeded();
    if (migrated?.merged?.length) {
      // Hydrate Redux if it doesn't already contain these items
      const byId = new Set((wishlist || []).map((x) => x?._id || x?.id));
      migrated.merged.forEach((item) => {
        const id = item?._id || item?.id;
        if (id && !byId.has(id)) dispatch(add_to_wishlist(item));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hydrate Redux from current storage key on mount/when session/user changes
  useEffect(() => {
    const fromKey = readJSON(storageKey);
    if (fromKey?.length) {
      const byId = new Set((wishlist || []).map((x) => x?._id || x?.id));
      fromKey.forEach((item) => {
        const id = item?._id || item?.id;
        if (id && !byId.has(id)) dispatch(add_to_wishlist(item));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Persist Redux wishlist → localStorage for the active key
  useEffect(() => {
    // only write if we have a key
    if (!storageKey) return;
    writeJSON(storageKey, dedupeById(wishlist || []));
  }, [wishlist, storageKey]);

  // Watch for login/logout updates done elsewhere (e.g., after LoginForm finishes)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'sessionId' || e.key === 'userId') {
        const next = getSessionUser();
        setSU(next);

        // When we gain both, migrate guest→user key
        if (next.sessionId && next.userId) {
          const migrated = migrateGuestWishlistIfNeeded();
          if (migrated?.merged?.length) {
            const byId = new Set((wishlist || []).map((x) => x?._id || x?.id));
            migrated.merged.forEach((item) => {
              const id = item?._id || item?.id;
              if (id && !byId.has(id)) dispatch(add_to_wishlist(item));
            });
          }
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddProduct = () => router.push('/shop');

  // ✅ Gate "Go To Cart" behind sessionId in Local Storage
  const handleGoToCart = () => {
    const hasSession =
      typeof window !== 'undefined' && !!localStorage.getItem('sessionId');
    router.push(hasSession ? '/cart' : '/login');
  };

  const handleContinueShopping = () => router.push('/shop');

  return (
    <>
      <section className="tp-cart-area pb-120">
        <div className="container">
          {(!wishlist || wishlist.length === 0) && (
            <div className="text-center pt-50">
              <h3>No Wishlist Items Found</h3>
              <button
                type="button"
                onClick={handleContinueShopping}
                className="btn-ghost-invert square mt-20"
                aria-label="Continue Shopping"
              >
                Continue Shopping
              </button>
            </div>
          )}

          {wishlist?.length > 0 && (
            <div className="row">
              <div className="col-xl-12">
                <div className="tp-cart-list mb-45 mr-30">
                  <table className="table">
                    <thead>
                      <tr>
                        <th colSpan={2} className="tp-cart-header-product">Product</th>
                        <th className="tp-cart-header-price">Price</th>
                        <th className="tp-cart-header-quantity">Quantity</th>
                        <th>Action</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {wishlist.map((item, i) => (
                        <WishlistItem key={(item?._id || item?.id || i) + '_wl'} product={item} />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bottom actions row */}
                <div className="tp-wishlist-bottom">
                  <div className="row align-items-end justify-content-between g-3">
                    {/* LEFT: Add Product */}
                    <div className="col-md-6">
                      <div className="wl-actions-left center-left">
                        <button
                          type="button"
                          onClick={handleAddProduct}
                          className="btn-ghost-invert square"
                          title="Browse products"
                          aria-label="Add Product"
                        >
                          <span className="btn-icon" aria-hidden="true"><Plus /></span>
                          <span>Add Product</span>
                        </button>
                      </div>
                    </div>

                    {/* RIGHT: Go To Cart (requires session) */}
                    <div className="col-md-6">
                      <div className="wl-actions-right text-md-end">
                        <button
                          type="button"
                          onClick={handleGoToCart}
                          className="btn-ghost-invert square"
                          title="Review cart"
                          aria-label="Go To Cart"
                        >
                          Go To Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Styles */}
      <style jsx>{`
        .center-left { display:flex; justify-content:center; align-items:center; }

        .btn-ghost-invert {
          --navy: #0b1620;
          --radius: 10px;

          display:inline-flex;
          align-items:center;
          gap:10px;
          min-height:48px;
          padding:12px 22px;
          border-radius:var(--radius);
          text-decoration:none;
          font-weight:600;
          font-size:15px;
          line-height:1;
          cursor:pointer;
          user-select:none;

          background:var(--navy);
          color:#fff;
          border:1px solid var(--navy);
          box-shadow:0 6px 18px rgba(0,0,0,0.25);
          transform:translateZ(0);

          transition:
            background 180ms ease,
            color 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease,
            transform 120ms ease;
        }

        .btn-ghost-invert.square { border-radius:0; }

        .btn-ghost-invert:hover {
          background:#fff;
          color:var(--navy);
          border-color:var(--navy);
          box-shadow:0 0 0 1px var(--navy) inset, 0 8px 20px rgba(0,0,0,0.12);
          transform:translateY(-1px);
        }
        .btn-ghost-invert:active {
          transform:translateY(0);
          background:#f8fafc;
          color:var(--navy);
          box-shadow:0 3px 10px rgba(0,0,0,0.15);
        }
        .btn-ghost-invert:focus-visible {
          outline:0;
          box-shadow:0 0 0 3px rgba(11,22,32,0.35);
        }

        .btn-icon { display:inline-flex; align-items:center; line-height:0; }

        .wl-actions-left, .wl-actions-right { display:flex; align-items:center; }
        .wl-actions-right { justify-content:flex-end; }

        @media (max-width:640px){
          .btn-ghost-invert { min-height:44px; padding:10px 18px; border-radius:8px; }
          .btn-ghost-invert.square { border-radius:0; }
          .wl-actions-right { justify-content:flex-start; }
        }

        .mt-20 { margin-top: 20px; }
      `}</style>
    </>
  );
};

export default WishlistArea;
