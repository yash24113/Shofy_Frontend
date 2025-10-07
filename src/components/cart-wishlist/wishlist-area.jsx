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
  } catch (e) {
    console.log('localStorage write error', e);
  }
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
/* --------------------------- server (API) helpers --------------------------- */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

async function fetchServerWishlist(userId) {
  if (!userId || !API_BASE) return [];
  try {
    const res = await fetch(`${API_BASE}/api/wishlist?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`GET wishlist ${res.status}`);
    const data = await res.json();
    // expected { items: [...] } or just array; normalize
    const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
    return dedupeById(items);
  } catch (err) {
    console.warn('fetchServerWishlist failed', err);
    return [];
  }
}

async function pushServerWishlist(userId, items) {
  if (!userId || !API_BASE) return false;
  try {
    const res = await fetch(`${API_BASE}/api/wishlist`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, items: dedupeById(items || []) }),
    });
    return res.ok;
  } catch (err) {
    console.warn('pushServerWishlist failed', err);
    return false;
  }
}
/* --------------------------------------------------------------------------- */

const WishlistArea = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { wishlist } = useSelector((state) => state.wishlist) || { wishlist: [] };

  // session/user to know which key to use
  const [{ sessionId, userId }, setSU] = useState(getSessionUser());
  const storageKey = useMemo(() => keyFrom(sessionId, userId), [sessionId, userId]);

  // Merge helper
  const mergeLists = (...lists) => dedupeById([].concat(...lists.map((x) => x || [])));

  // On mount or when userId changes → sync with server (supports cross-device)
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { sessionId: sid, userId: uid } = getSessionUser();
      if (!uid) {
        // guest path: hydrate from guest local
        const fromGuest = readJSON(LS_GUEST_KEY);
        if (!fromGuest?.length) return;
        const byId = new Set((wishlist || []).map((x) => x?._id || x?.id));
        fromGuest.forEach((item) => {
          const id = item?._id || item?.id;
          if (id && !byId.has(id)) dispatch(add_to_wishlist(item));
        });
        return;
      }

      // logged-in: fetch server
      const serverItems = await fetchServerWishlist(uid);
      // also read guest + userKey locals to merge
      const guestLocal = readJSON(LS_GUEST_KEY);
      const userLocal = readJSON(keyFrom(sid, uid));

      const merged = mergeLists(serverItems, guestLocal, userLocal);

      // write back to server (source of truth across devices)
      await pushServerWishlist(uid, merged);

      // write to local (user-scoped) + clear guest
      writeJSON(keyFrom(sid, uid), merged);
      try {
        localStorage.removeItem(LS_GUEST_KEY);
      } catch(e) {console.log("error",e)}

      // hydrate redux
      if (!mounted) return;
      const byId = new Set((wishlist || []).map((x) => x?._id || x?.id));
      merged.forEach((item) => {
        const id = item?._id || item?.id;
        if (id && !byId.has(id)) dispatch(add_to_wishlist(item));
      });
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Persist Redux wishlist → localStorage for the active key, and to server when logged-in
  useEffect(() => {
    if (!storageKey) return;
    const clean = dedupeById(wishlist || []);
    writeJSON(storageKey, clean);

    // also mirror to server if logged in
    if (userId) {
      pushServerWishlist(userId, clean);
    }
  }, [wishlist, storageKey, userId]);

  // Watch for login/logout updates done elsewhere (e.g., LoginForm)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'sessionId' || e.key === 'userId') {
        const next = getSessionUser();
        setSU(next);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleAddProduct = () => router.push('/shop');

  // Gate "Go To Cart" behind sessionId
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

                    {/* RIGHT: Go To Cart */}
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
