'use client';
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Close } from '@/svg';
import { toast } from 'react-toastify';

/* cart thunks */
import { add_to_cart, fetch_cart_products, openCartMini } from '@/redux/features/cartSlice';
import { removeWishlistItem, fetchWishlist } from '@/redux/features/wishlist-slice';

import LoginArea from '@/components/login-register/login-area';
import RegisterArea from '@/components/login-register/register-area';
import useWishlistManager from '@/hooks/useWishlistManager';

import useGlobalSearch from '@/hooks/useGlobalSearch';
import { buildSearchPredicate } from '@/utils/searchMiddleware';
import { useGetSeoByProductQuery } from '@/redux/features/seoApi';

/* ---------- helpers (JS only) ---------- */
const nonEmpty = (v) =>
  Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && String(v).trim() !== '';

const pick = (...xs) => xs.find(nonEmpty);

const looksLikeId = (s) =>
  /^[a-f0-9]{24}$/i.test(String(s || '')) || /^[0-9a-f-]{8,}$/i.test(String(s || ''));

const toLabel = (v) => {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') {
    const s = String(v).trim();
    return looksLikeId(s) ? '' : s;
  }
  if (Array.isArray(v)) return v.map(toLabel).filter(Boolean).join(', ');
  if (typeof v === 'object') return toLabel(v.name ?? v.title ?? v.value ?? v.label ?? '');
  return '';
};

const round = (n, d = 1) => (isFinite(n) ? Number(n).toFixed(d).replace(/\.0+$/, '') : '');
const gsmToOz = (gsm) => gsm * 0.0294935;
const cmToInch = (cm) => cm / 2.54;
const isNoneish = (s) => {
  if (!s) return true;
  const t = String(s).trim().toLowerCase().replace(/\s+/g, ' ');
  return ['none', 'na', 'none/ na', 'none / na', 'n/a', '-'].includes(t);
};

/* ---------- empty-banner manager ---------- */
function useEmptyBanner(listId, rowVisible, emptyText) {
  const rowRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.__listVis = window.__listVis || {};
    const bucket = (window.__listVis[listId] = window.__listVis[listId] || {
      vis: 0,
      banner: null,
    });

    const tbody = rowRef.current?.closest('tbody');
    if (!tbody) return;

    const ensureBannerExists = () => {
      if (bucket.banner && bucket.banner.isConnected) return bucket.banner;
      const tr = document.createElement('tr');
      tr.className = 'empty-row';
      const td = document.createElement('td');
      td.colSpan = 999;
      td.innerHTML = `
        <div class="empty-wrap" role="status" aria-live="polite">
          <svg class="empty-ic" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path fill="currentColor" d="M10 18a8 8 0 1 1 5.3-14.03l4.36-4.35 1.41 1.41-4.35 4.36A8 8 0 0 1 10 18zm0-2a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm10.59 6L16.3 17.7a8.96 8.96 0 0 0 1.41-1.41L22 20.59 20.59 22z"/>
          </svg>
          <span class="empty-text">${emptyText}</span>
        </div>
      `;
      tr.appendChild(td);
      bucket.banner = tr;
      return tr;
    };

    const prev = rowRef.current ? rowRef.current.__wasVisible : undefined;
    if (prev === undefined) {
      if (rowVisible) bucket.vis += 1;
    } else {
      if (rowVisible && !prev) bucket.vis += 1;
      if (!rowVisible && prev) bucket.vis -= 1;
    }
    if (rowRef.current) rowRef.current.__wasVisible = rowVisible;

    const banner = bucket.banner;
    if (bucket.vis <= 0) {
      const b = ensureBannerExists();
      if (!b.isConnected) tbody.appendChild(b);
    } else if (banner && banner.isConnected) {
      banner.remove();
    }

    return () => {
      const was = rowRef.current ? rowRef.current.__wasVisible : undefined;
      if (was) bucket.vis = Math.max(0, bucket.vis - 1);
      if (rowRef.current) rowRef.current.__wasVisible = false;

      if (bucket.vis <= 0) {
        const b = ensureBannerExists();
        if (!b.isConnected && tbody.isConnected) tbody.appendChild(b);
      } else if (bucket.banner && bucket.banner.isConnected && bucket.vis > 0) {
        banner.remove();
      }
    };
  }, [listId, rowVisible, emptyText]);

  return { rowRef };
}

/* ---------- Component ---------- */
const WishlistItem = ({ product }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const { cart_products } = useSelector((s) => s.cart) || {};
  const { userId, wishlist, loading } = useWishlistManager();
  const wlLoading = useSelector((s) => s.wishlist?.loading) ?? false;

  const _id =
    product?._id || product?.id || product?.product?._id || product?.productId || product?.product || null;

  const isInCart = cart_products?.find?.((item) => String(item?._id) === String(_id));

  const [moving, setMoving] = useState(false);
  const [authModal, setAuthModal] = useState(null);

  /* ---- HYDRATE ---- */
  const [hydrated, setHydrated] = useState(null);
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/+$/, '');

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!_id) return;

      const hasLabels =
        product?.content?.name ||
        product?.design?.name ||
        product?.subfinish?.name ||
        product?.substructure?.name ||
        (Array.isArray(product?.color) && product.color[0]?.name) ||
        product?.product?.content?.name;

      if (hasLabels) return;

      const slug = product?.slug || product?.product?.slug;

      const endpoints = [
        `${apiBase}/products/${_id}`,
        `${apiBase}/product/${_id}`,
        `${apiBase}/product/single/${_id}`,
        `${apiBase}/api/products/${_id}`,
        `${apiBase}/api/product/${_id}`,
        slug ? `${apiBase}/products/slug/${slug}` : null,
        slug ? `${apiBase}/product/slug/${slug}` : null,
        slug ? `${apiBase}/api/products/slug/${slug}` : null,
      ].filter(Boolean);

      for (const url of endpoints) {
        try {
          const res = await fetch(url, { credentials: 'include' });
          if (!res.ok) continue;
          const json = await res.json();
          const data = json?.data ?? json;
          if (data && typeof data === 'object' && !ignore) {
            setHydrated(data);
            break;
          }
        } catch {/*  */}
      }
    })();
    return () => {
      ignore = true;
    };
  }, [_id, product, apiBase]);

  /* SEO fallbacks */
  const { data: seoResp } = useGetSeoByProductQuery(_id, { skip: !_id });
  const seoDoc = Array.isArray(seoResp?.data) ? seoResp?.data?.[0] : seoResp?.data;

  // search
  const { debounced: globalQuery } = useGlobalSearch(150);
  const searchableFields = useMemo(
    () => [
      (p) => p?.title,
      (p) => p?.name,
      (p) => p?._id,
      (p) => p?.id,
      (p) => p?.slug,
      (p) => p?.fabricType || p?.fabric_type,
      (p) => toLabel(p?.content ?? hydrated?.content ?? seoDoc?.content),
      (p) => toLabel(p?.design ?? hydrated?.design ?? seoDoc?.design),
      (p) => toLabel(p?.subfinish ?? hydrated?.subfinish ?? seoDoc?.finish),
      (p) => toLabel(p?.substructure ?? hydrated?.substructure ?? seoDoc?.structure),
      (p) =>
        Array.isArray(p?.color)
          ? p.color.map((c) => toLabel(c?.name ?? c)).join(', ')
          : '',
      (p) => p?.widthLabel || p?.width_cm || p?.width,
      (p) => p?.tags,
      (p) => p?.sku,
    ],
    [hydrated, seoDoc]
  );

  const matchesQuery = useMemo(() => {
    const q = (globalQuery || '').trim();
    if (q.length < 2) return true;
    const pred = buildSearchPredicate(q, searchableFields, {
      mode: 'AND',
      normalize: true,
      minTokenLen: 2,
    });
    return pred(product);
  }, [globalQuery, product, searchableFields]);

  const showByServer = useMemo(() => {
    if (!Array.isArray(wishlist)) return false;
    return wishlist.some((it) => String(it?._id) === String(_id));
  }, [wishlist, _id]);

  const wlReady = Array.isArray(wishlist) && !wlLoading && !loading;
  const hidden = !wlReady || !matchesQuery || !showByServer;

  const { rowRef } = useEmptyBanner('wishlist', !hidden, 'No product found in wishlist');

  const currentUrlWithQuery = useMemo(() => {
    const url =
      typeof window !== 'undefined'
        ? new URL(window.location.href)
        : new URL('http://localhost');
    return url.pathname + url.search;
  }, [pathname, searchParams]);

  const pushAuthQuery = useCallback(
    (type) => {
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      if (type) {
        url.searchParams.set('auth', type);
        url.searchParams.set('redirect', currentUrlWithQuery);
      } else {
        url.searchParams.delete('auth');
        url.searchParams.delete('redirect');
      }
      const qs = url.searchParams.toString();
      router.push(qs ? `${url.pathname}?${qs}` : url.pathname, { scroll: false });
    },
    [currentUrlWithQuery, router]
  );

  const closeAuth = useCallback(() => {
    setAuthModal(null);
    pushAuthQuery(null);
  }, [pushAuthQuery]);
  const openLogin = useCallback(() => {
    setAuthModal('login');
    pushAuthQuery('login');
  }, [pushAuthQuery]);
  const openRegister = useCallback(() => {
    setAuthModal('register');
    pushAuthQuery('register');
  }, [pushAuthQuery]);

  /* ---------- actions ---------- */
  const handleAddProduct = async () => {
    if (!userId) {
      openLogin();
      return;
    }
    if (!_id) return;
    try {
      setMoving(true);
      await dispatch(
        add_to_cart({ userId, productId: String(_id), quantity: 1 })
      ).unwrap?.();
      await dispatch(fetch_cart_products({ userId }));
      dispatch(openCartMini());

      await dispatch(
        removeWishlistItem({
          userId,
          productId: String(_id),
          title: getDisplayTitle,
        })
      ).unwrap?.();

      dispatch(fetchWishlist(userId));

      // Toast: white card style (like your "Added to wishlist")
      toast.dismiss();
      toast.success(`${getDisplayTitle} moved to cart`, {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'light', // important for white card + green progress
        toastId: `moved-${_id}`,
      });
    } catch (e) {
      console.error('Move to cart failed', e);
      toast.error('Failed to move item to cart', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'light',
      });
    } finally {
      setTimeout(() => setMoving(false), 250);
    }
  };

  const handleRemovePrd = async (prd) => {
    if (!userId) {
      openLogin();
      return;
    }
    try {
      await dispatch(
        removeWishlistItem({
          userId,
          productId: String(prd?.id || prd?._id),
          title: getDisplayTitle,
        })
      ).unwrap?.();
      dispatch(fetchWishlist(userId));
    } catch (e) {
      console.error('Remove failed', e);
      alert('Failed to remove item from wishlist. Please try again.');
    }
  };

  /* ---------- presentation ---------- */
  const fallbackCdn = (process.env.NEXT_PUBLIC_CDN_BASE || 'https://test.amrita-fashions.com/shopy').replace(/\/+$/, '');

  const valueToUrlString = (v) => {
    if (!v) return '';
    if (typeof v === 'string') return v.trim();
    if (Array.isArray(v)) return valueToUrlString(v[0]);
    if (typeof v === 'object') return valueToUrlString(v.secure_url || v.url || v.path || v.key || v.img);
    return '';
  };

  const rawImg =
    valueToUrlString(product?.img) ||
    valueToUrlString(product?.image) ||
    valueToUrlString(product?.image1) ||
    valueToUrlString(product?.image2) ||
    valueToUrlString(product?.product?.img) ||
    valueToUrlString(hydrated?.img) ||
    '';

  const isHttpUrl = (s) => /^https?:\/\//i.test(s || '');
  const clean = (p) =>
    String(p || '')
      .replace(/^\/+/, '')
      .replace(/^api\/uploads\/?/, '')
      .replace(/^uploads\/?/, '');

  const imageUrl = rawImg
    ? isHttpUrl(rawImg)
      ? rawImg
      : `${apiBase || fallbackCdn}/uploads/${clean(rawImg)}`
    : '';

  const getDisplayTitle = useMemo(() => {
    const nameOptions = [
      product?.title,
      product?.name,
      product?.product?.name,
      hydrated?.name,
      seoDoc?.title,
      product?.productname,
      product?.productTitle,
      product?.seoTitle,
      product?.groupcode?.name,
      product?.fabricType,
      product?.content,
      product?.design,
    ].filter(Boolean);

    const firstNice = nameOptions.map(toLabel).find((s) => s && s.length > 0);
    if (firstNice) return firstNice;

    const parts = [
      toLabel(product?.color || product?.colorName || hydrated?.color),
      toLabel(product?.content || hydrated?.content),
      toLabel(product?.fabricType || hydrated?.fabricType),
      toLabel(product?.design || hydrated?.design),
    ].filter(Boolean);
    return parts.length ? parts.join(' ') + ' Fabric' : 'Product';
  }, [product, hydrated, seoDoc, _id]);

  const slug = product?.slug || product?.product?.slug || hydrated?.slug || _id;

  const src =
    hydrated || product || product?.product || {};
  const gsm = Number(
    src.gsm ?? product?.gsm ?? product?.weightGsm ?? product?.weight_gsm
  );
  const widthCm = Number(
    src.cm ??
      src.widthCm ??
      src.width_cm ??
      src.width ??
      product?.widthCm ??
      product?.width_cm ??
      product?.width
  );

  const fabricTypeVal =
    toLabel(pick(src.category?.name, src.fabricType, src.fabric_type)) ||
    'Woven Fabrics';
  const contentVal = toLabel(pick(src.content, seoDoc?.content));
  const designVal = toLabel(pick(src.design, seoDoc?.design));
  const finishVal = toLabel(pick(src.subfinish, seoDoc?.finish));
  const structureVal = toLabel(pick(src.substructure, seoDoc?.structure));
  const colorsVal = Array.isArray(src.color)
    ? toLabel(src.color.map((c) => c?.name ?? c))
    : toLabel(pick(src.colorName, src.color));

  const weightVal =
    isFinite(gsm) && gsm > 0
      ? `${round(gsm)} gsm / ${round(gsmToOz(gsm))} oz`
      : toLabel(src.weight);

  // FIX: check widthCm (not gsm) here
  const widthVal =
    isFinite(widthCm) && widthCm > 0
      ? `${round(widthCm, 0)} cm / ${round(cmToInch(widthCm), 0)} inch`
      : toLabel(src.widthLabel);

  const row1Parts = [fabricTypeVal, colorsVal, contentVal, finishVal, structureVal, designVal].filter(
    (v) => nonEmpty(v) && !isNoneish(v)
  );
  const row2Parts = [weightVal, widthVal].filter((v) => nonEmpty(v) && !isNoneish(v));

  return (
    <>
      <tr
        className="wishlist-row"
        ref={rowRef}
        style={hidden ? { display: 'none' } : undefined}
        aria-hidden={hidden ? 'true' : 'false'}
      >
        {/* img */}
        <td className="tp-cart-img wishlist-cell">
          <Link href={`/fabric/${slug}`} className="wishlist-img-link">
            {!!imageUrl && (
              <img
                src={imageUrl}
                alt={getDisplayTitle || 'product image'}
                width={70}
                height={100}
                className="wishlist-img"
                loading="lazy"
              />
            )}
          </Link>
        </td>

        {/* title + meta */}
        <td className="tp-cart-title wishlist-cell">
          <Link href={`/fabric/${slug}`} className="wishlist-title">
            {getDisplayTitle || 'Product'}
          </Link>

          {row1Parts.length || row2Parts.length ? (
            <div className="wishlist-meta">
              {row1Parts.length > 0 && (
                <div className="meta-row" title={row1Parts.join(' | ')}>
                  {row1Parts.map((txt, i) => (
                    <span className="meta-piece" key={`r1-${i}`}>
                      {txt}
                    </span>
                  ))}
                </div>
              )}
              {row2Parts.length > 0 && (
                <div className="meta-row subtle" title={row2Parts.join(' | ')}>
                  {row2Parts.map((txt, i) => (
                    <span className="meta-piece" key={`r2-${i}`}>
                      {txt}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </td>

        {/* price */}
        <td className="tp-cart-price wishlist-cell">
          {(() => {
            const priceRaw = pick(
              product?.salesPrice,
              product?.price,
              product?.product?.salesPrice,
              product?.product?.price,
              hydrated?.price
            );
            const price = Number(priceRaw || 0);
            return <span className="wishlist-price">{price.toFixed(2)}</span>;
          })()}
        </td>

        {/* add to cart */}
        <td className="tp-cart-add-to-cart wishlist-cell wishlist-cell-center">
          <button
            onClick={handleAddProduct}
            type="button"
            className={`btn-ghost-invert square ${moving ? 'is-loading' : ''}`}
            aria-busy={moving ? 'true' : 'false'}
            title="Move to Cart"
            disabled={!!isInCart && !moving}
          >
            {moving ? 'Moving…' : isInCart ? 'Already in Cart' : 'Move to Cart'}
          </button>
        </td>

        {/* remove */}
        <td className="tp-cart-action wishlist-cell">
          <button
            onClick={() => handleRemovePrd({ title: getDisplayTitle, id: _id })}
            className="btn-ghost-invert square"
            type="button"
            title="Remove from wishlist"
          >
            <Close />
            <span> Remove</span>
          </button>
        </td>
      </tr>

      {/* AUTH MODALS */}
      {authModal === 'login' && (
        <LoginArea onClose={closeAuth} onSwitchToRegister={openRegister} />
      )}
      {authModal === 'register' && (
        <RegisterArea onClose={closeAuth} onSwitchToLogin={openLogin} />
      )}

      <style jsx>{`
        .wishlist-row {
          border-bottom: 1px solid #eef0f3;
          transition: background-color 160ms ease, box-shadow 180ms ease;
        }
        .wishlist-row:hover {
          background: #fafbfc;
        }
        .wishlist-cell {
          padding: 14px 12px;
          vertical-align: middle;
        }
        .tp-cart-img.wishlist-cell {
          padding-right: 20px;
        }
        .wishlist-cell-center {
          text-align: center;
        }
        .tp-cart-title.wishlist-cell {
          padding-left: 0;
        }
        .wishlist-img-link {
          display: inline-block;
          line-height: 0;
        }
        .wishlist-img {
          width: 70px;
          height: 100px;
          object-fit: cover;
          border-radius: 10px;
          background: #f3f5f8;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
        }
        .wishlist-title {
          display: block;
          font-weight: 600;
          line-height: 1.3;
          color: #0f172a;
          text-decoration: none;
        }
        .wishlist-title:hover {
          text-decoration: underline;
        }
        .wishlist-price {
          font-weight: 600;
          color: #0f172a;
        }
        .wishlist-meta {
          margin-top: 8px;
          display: grid;
          gap: 4px;
          max-width: 980px;
        }
        .meta-row {
          font-size: 13.4px;
          font-weight: 700;
          color: var(--tp-text-2);
          line-height: 1.35;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .meta-row.subtle {
          font-weight: 600;
          opacity: 0.9;
        }
        .meta-piece {
          position: relative;
          padding-inline: 0.25rem 0.4rem;
        }
        .meta-piece:not(:last-child)::after {
          content: ' | ';
          color: color-mix(in lab, var(--tp-theme-secondary) 70%, var(--tp-text-2));
          font-weight: 800;
          margin-left: 0.25rem;
        }
        @media (max-width: 980px) {
          .meta-row {
            font-size: 12.8px;
          }
        }
        .btn-ghost-invert {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          padding: 10px 18px;
          font-weight: 600;
          font-size: 15px;
          line-height: 1;
          cursor: pointer;
          user-select: none;
          background: var(--tp-theme-primary);
          color: var(--tp-common-white);
          border: 1px solid var(--tp-theme-primary);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
          transition: color 0.18s, background-color 0.18s, border-color 0.18s,
            box-shadow 0.18s, transform 0.12s;
        }
        .btn-ghost-invert:hover {
          background-color: var(--tp-common-white);
          border-color: var(--tp-theme-primary);
          color: var(--tp-theme-primary);
          box-shadow: 0 0 0 1px var(--tp-theme-primary) inset,
            0 8px 20px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }
        .btn-ghost-invert:active {
          transform: translateY(0);
          background: #f8fafc;
          color: var(--tp-theme-primary);
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
        }
        .btn-ghost-invert:focus-visible {
          outline: 0;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--tp-theme-primary) 35%, transparent);
        }
        .btn-ghost-invert.is-loading {
          pointer-events: none;
          opacity: 0.9;
        }
        @media (max-width: 640px) {
          .wishlist-cell {
            padding: 10px 8px;
          }
          .tp-cart-title.wishlist-cell {
            padding-left: 0;
          }
          .wishlist-img {
            width: 56px;
            height: 80px;
            border-radius: 8px;
          }
          .btn-ghost-invert {
            min-height: 42px;
            padding: 9px 16px;
          }
        }
        .empty-row td {
          padding: 18px 12px;
        }
        .empty-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
          color: #6b7280;
          font-weight: 600;
        }
        .empty-ic {
          opacity: 0.8;
        }
        .empty-text {
          font-size: 14px;
        }
      `}</style>
    </>
  );
};

export default WishlistItem;
