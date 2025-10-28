'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';

import { Minus, Plus } from '@/svg';
import { selectUserId } from '@/utils/userSelectors';
import { buildSearchPredicate } from '@/utils/searchMiddleware';
import useGlobalSearch from '@/hooks/useGlobalSearch';
import { useGetSeoByProductQuery } from '@/redux/features/seoApi';
import {
  useUpdateCartItemMutation,
  useGetCartDataQuery,
} from '@/redux/features/cartApi';
import { fetch_cart_products } from '@/redux/features/cartSlice';

/* -------------------------- tiny helpers (no any) -------------------------- */
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

const valueToUrlString = (v) => {
  if (!v) return '';
  if (typeof v === 'string') return v.trim();
  if (Array.isArray(v)) return valueToUrlString(v[0]);
  if (typeof v === 'object') return valueToUrlString(v.secure_url || v.url || v.path || v.key || v.img || v.image);
  return '';
};
const isHttpUrl = (s) => /^https?:\/\//i.test(s || '');
const clean = (p) =>
  String(p || '').replace(/^\/+/, '').replace(/^api\/uploads\/?/, '').replace(/^uploads\/?/, '');

/* ------------------------------ empty banner ------------------------------ */
function useEmptyBanner(listId, rowVisible, emptyText) {
  const rowRef = useRef(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const buckets = (window.__listVis = window.__listVis || {});
    const bucket = (buckets[listId] = buckets[listId] || { vis: 0, banner: null });
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
        </div>`;
      tr.appendChild(td);
      bucket.banner = tr;
      return tr;
    };

    const prevStr = rowRef.current?.dataset.wasVisible;
    const prev =
      prevStr === 'true' ? true : prevStr === 'false' ? false : undefined;

    if (prev === undefined) {
      if (rowVisible) bucket.vis += 1;
    } else {
      if (rowVisible && !prev) bucket.vis += 1;
      if (!rowVisible && prev) bucket.vis -= 1;
    }
    if (rowRef.current) rowRef.current.dataset.wasVisible = String(rowVisible);

    const banner = bucket.banner;
    if (bucket.vis <= 0) {
      const b = ensureBannerExists();
      if (!b.isConnected) tbody.appendChild(b);
    } else if (banner && banner.isConnected) {
      banner.remove();
    }

    return () => {
      const was = rowRef.current?.dataset.wasVisible === 'true';
      if (was) bucket.vis = Math.max(0, bucket.vis - 1);
      if (rowRef.current) rowRef.current.dataset.wasVisible = 'false';

      if (bucket.vis <= 0) {
        const b = ensureBannerExists();
        if (!b.isConnected && tbody.isConnected) tbody.appendChild(b);
      } else if (bucket.banner && bucket.banner.isConnected && bucket.vis > 0) {
        bucket.banner.remove();
      }
    };
  }, [listId, rowVisible, emptyText]);

  return { rowRef };
}

/* ----------------------------- inline icons ---------------------------- */
const TrashIcon = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
    <path
      fill="currentColor"
      d="M9 3h6a1 1 0 0 1 1 1v1h5v2h-1l-1.2 12.4A3 3 0 0 1 15.8 23H8.2a3 3 0 0 1-2.98-3.59L4 7H3V5h5V4a1 1 0 0 1 1-1Zm2 0v1h2V3h-2ZM6 7l1.18 12.1A1 1 0 0 0 8.2 20h7.6a1 1 0 0 0 1.02-.9L18 7H6Zm3 3h2v8H9v-8Zm4 0h2v8h-2v-8Z"
    />
  </svg>
);

/** Clean heart icon for wishlist (stroke to match theme) */
const HeartIcon = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
    <path
      fill="currentColor"
      d="M12 21s-6.72-4.13-9.33-7.29C.92 11.6 1.19 8.7 3.2 6.98c2.09-1.78 5.06-1.34 6.84.75L12 9.87l1.96-2.14c1.78-2.09 4.75-2.53 6.84-.75 2.01 1.72 2.28 4.62.53 6.73C18.72 16.87 12 21 12 21z"
    />
  </svg>
);

/* --------------------------------- row ----------------------------------- */
const CartItem = ({ product }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const userId = useSelector(selectUserId);

  // keep cart query in sync (for hard refresh)
  const { refetch: refetchCart } = useGetCartDataQuery(userId, {
    skip: !userId,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const [updateCartItem, { isLoading: isUpdating }] = useUpdateCartItemMutation();
  const [isRemoving, setIsRemoving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGone, setIsGone] = useState(false);

  // Map incoming shape (your API sometimes nests product)
  const { productId, _id, id, slug, img, image, title, salesPrice, price, orderQuantity } =
    product || {};
  const nested = typeof productId === 'object' && productId ? productId : null;
  const PID = (nested && nested._id) || (typeof productId === 'string' ? productId : null) || _id || id || '';

  // Hydrate like wishlist (for labels)
  const [hydrated, setHydrated] = useState(null);
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/+$/, '');
  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!PID && !(nested?.slug || slug)) return;
      const pslug = nested?.slug || slug || product?.product?.slug;
      const endpoints = [
        PID ? `${apiBase}/products/${PID}` : null,
        PID ? `${apiBase}/product/${PID}` : null,
        PID ? `${apiBase}/product/single/${PID}` : null,
        PID ? `${apiBase}/api/products/${PID}` : null,
        PID ? `${apiBase}/api/product/${PID}` : null,
        pslug ? `${apiBase}/products/slug/${pslug}` : null,
        pslug ? `${apiBase}/product/slug/${pslug}` : null,
        pslug ? `${apiBase}/api/products/slug/${pslug}` : null,
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
        } catch { /* noop */ }
      }
    })();
    return () => { ignore = true; };
  }, [PID, slug, nested, product, apiBase]);

  const { data: seoResp } = useGetSeoByProductQuery(PID, { skip: !PID });
  const seoDoc = Array.isArray(seoResp?.data) ? seoResp?.data?.[0] : seoResp?.data;

  const name = useMemo(() => {
    const firstNice = [
      nested?.name,
      title,
      hydrated?.name,
      seoDoc?.title,
      product?.product?.name,
      product?.productTitle,
      product?.productname,
      product?.groupcode?.name,
      product?.fabricType,
      product?.content,
      product?.design,
    ]
      .filter(Boolean)
      .map(toLabel)
      .find(Boolean);
    if (firstNice) return firstNice;

    const parts = [
      toLabel(product?.color || product?.colorName || hydrated?.color || nested?.color),
      toLabel(product?.content || hydrated?.content || nested?.content),
      toLabel(product?.fabricType || hydrated?.fabricType || nested?.fabricType),
      toLabel(product?.design || hydrated?.design || nested?.design),
    ].filter(Boolean);
    return parts.length ? parts.join(' ') + ' Fabric' : 'Product';
  }, [product, nested, hydrated, seoDoc, title]);

  const safeSlug = nested?.slug || slug || hydrated?.slug || PID || '';
  const href = `/fabric/${safeSlug}`;

  // image
  const fallbackCdn = (process.env.NEXT_PUBLIC_CDN_BASE || 'https://test.amrita-fashions.com/shopy').replace(/\/+$/, '');
  const rawImg =
    valueToUrlString(nested?.img || nested?.image || nested?.image1) ||
    valueToUrlString(product?.product?.img || product?.product?.image || product?.product?.image1) ||
    valueToUrlString(img) ||
    valueToUrlString(image) ||
    valueToUrlString(hydrated?.img) ||
    '';
  const imageUrl = rawImg
    ? isHttpUrl(rawImg)
      ? rawImg
      : `${apiBase || fallbackCdn}/uploads/${clean(rawImg)}`
    : '/images/placeholder-portrait.webp';

  // meta (same as wishlist)
  const src = hydrated || product || product?.product || {};
  const gsm = Number(src.gsm ?? product?.gsm ?? product?.weightGsm ?? product?.weight_gsm);
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
    toLabel(pick(src.category?.name, src.fabricType, src.fabric_type)) || 'Woven Fabrics';
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
  const widthVal =
    isFinite(widthCm) && widthCm > 0
      ? `${round(widthCm, 0)} cm / ${round(cmToInch(widthCm), 0)} inch`
      : toLabel(src.widthLabel);

  const row1Parts = [fabricTypeVal, colorsVal, contentVal, finishVal, structureVal, designVal].filter(
    (v) => nonEmpty(v) && !isNoneish(v)
  );
  const row2Parts = [weightVal, widthVal].filter((v) => nonEmpty(v) && !isNoneish(v));

  // pricing/qty
  const unit = typeof salesPrice === 'number' ? salesPrice : Number.parseFloat(String(salesPrice)) || price || 0;
  const lineTotal = (unit || 0) * (orderQuantity || 0);

  // actions
  const removeFromCart = useCallback(
    async (productIdToRemove) => {
      const url = `https://test.amrita-fashions.com/shopy/cart/remove/${productIdToRemove}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error('Cart remove failed');
      await res.json().catch(() => ({}));
    },
    [userId]
  );

  const addToWishlist = useCallback(async (uId, pId) => {
    const base = `https://test.amrita-fashions.com/shopy/wishlist/add`;
    const attempts = [
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: new URLSearchParams({ userId: String(uId), productId: String(pId) }),
      },
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ userId: uId, productId: pId }),
      },
      {
        method: 'POST',
        body: (() => {
          const fd = new FormData();
          fd.append('userId', String(uId));
          fd.append('productId', String(pId));
          return fd;
        })(),
      },
      { method: 'POST', url: `${base}?userId=${encodeURIComponent(String(uId))}&productId=${encodeURIComponent(String(pId))}` },
    ];
    let last = null;
    for (const opt of attempts) {
      try {
        const target = opt.url ? opt.url : base;
        const { url: _u, ...fetchOpts } = opt;
        const res = await fetch(target, { ...fetchOpts, credentials: 'include' });
        if (res.ok) {
          await res.json().catch(() => ({}));
          return;
        }
      } catch (e) {
        last = e;
      }
    }
    throw last || new Error('Failed to add to wishlist');
  }, []);

  const hardRefreshCart = useCallback(() => {
    if (userId) dispatch(fetch_cart_products({ userId }));
    refetchCart?.();
    router.refresh?.();
  }, [dispatch, refetchCart, router, userId]);

  const inc = async () => {
    if (!PID || isUpdating) return;
    try {
      await updateCartItem({ productId: PID, quantity: (orderQuantity || 0) + 1, userId }).unwrap();
      hardRefreshCart();
    } catch { /* noop */ }
  };
  const dec = async () => {
    if (!PID || isUpdating || (orderQuantity || 0) <= 1) return;
    try {
      await updateCartItem({ productId: PID, quantity: Math.max(1, (orderQuantity || 0) - 1), userId }).unwrap();
      hardRefreshCart();
    } catch { /* noop */ }
  };

  const removeOnly = async () => {
    if (!PID || isRemoving || isSaving) return;
    setIsRemoving(true);
    try {
      await removeFromCart(PID);
      setIsGone(true);
      hardRefreshCart();
      if (typeof window !== 'undefined' && window.toast) window.toast.success('Removed from cart');
    } catch {
      if (typeof window !== 'undefined' && window.toast) window.toast.error('Failed to remove item');
    } finally {
      setIsRemoving(false);
    }
  };

  const saveForWishlist = async () => {
    if (!PID || !userId || isSaving || isRemoving) return;
    setIsSaving(true);
    try {
      await addToWishlist(userId, PID);
      await removeFromCart(PID);
      setIsGone(true);
      hardRefreshCart();
      if (typeof window !== 'undefined' && window.toast) window.toast.success('Moved to wishlist');
    } catch {
      if (typeof window !== 'undefined')
        (window.toast ? window.toast.error('Failed to save to wishlist') : alert('Failed to save to wishlist.'));
    } finally {
      setIsSaving(false);
    }
  };

  // search visibility
  const { debounced: q } = useGlobalSearch();
  const searchVisible = useMemo(() => {
    const query = (q || '').trim();
    if (query.length < 2) return true;
    const fields = [() => name || '', () => safeSlug || '', () => String(product?.design ?? ''), () => String(product?.color ?? '')];
    const pred = buildSearchPredicate(query, fields, { mode: 'AND', normalize: true });
    return pred(product);
  }, [q, product, name, safeSlug]);

  const rowVisible = searchVisible && !isGone;
  const { rowRef } = useEmptyBanner('cart', !!rowVisible, 'No product found in cart');

  return (
    <>
      <tr className="cart-row" ref={rowRef} style={!rowVisible ? { display: 'none' } : undefined}>
        {/* Product (image + title + meta) */}
        <td className="col-product" data-label="Product">
          <Link href={href} className="thumb-wrap" aria-label={name}>
            <span className="thumb">
              <Image src={imageUrl} alt={name} width={84} height={84} className="thumb-img" />
            </span>
          </Link>
          <div className="prod-body">
            <Link href={href} className="title-link">
              <span className="title-text">{name}</span>
            </Link>

            {(row1Parts.length || row2Parts.length) ? (
              <div className="cart-meta">
                {row1Parts.length > 0 && (
                  <div className="meta-row" title={row1Parts.join(' | ')}>
                    {row1Parts.map((txt, i) => (
                      <span className="meta-piece" key={`r1-${i}`}>{txt}</span>
                    ))}
                  </div>
                )}
                {row2Parts.length > 0 && (
                  <div className="meta-row subtle" title={row2Parts.join(' | ')}>
                    {row2Parts.map((txt, i) => (
                      <span className="meta-piece" key={`r2-${i}`}>{txt}</span>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </td>

        {/* Price */}
        <td className="col-price" data-label="Price">
          <span className="price">{unit ? `₹${(lineTotal || 0).toFixed(2)}` : '0.00'}</span>
        </td>

        {/* Quantity */}
        <td className="col-qty" data-label="Quantity">
          <div className="qty">
            <button type="button" className={`qty-btn ${isUpdating ? 'loading' : ''}`} onClick={dec} disabled={isUpdating || (orderQuantity || 0) <= 1} aria-label={`Decrease ${name}`}>
              <Minus />
            </button>
            <span className="qty-value" aria-live="polite" aria-label={`Quantity of ${name}`}>{orderQuantity}</span>
            <button type="button" className={`qty-btn ${isUpdating ? 'loading' : ''}`} onClick={inc} disabled={isUpdating} aria-label={`Increase ${name}`}>
              <Plus />
            </button>
          </div>
        </td>

        {/* Actions (trash + move to wishlist ICON) */}
        <td className="col-action" data-label="Actions">
          <div className="action-stack">
            <button
              type="button"
              onClick={removeOnly}
              disabled={isRemoving || isSaving}
              className={`btn-ghost-invert square icon-only ${isRemoving ? 'is-loading' : ''}`}
              title="Remove item"
              aria-label="Remove item"
            >
              <TrashIcon />
            </button>

            {/* CHANGED: icon-only heart instead of text */}
            <button
              type="button"
              onClick={saveForWishlist}
              disabled={isSaving || isRemoving || !userId}
              className={`btn-ghost-invert square icon-only ${isSaving ? 'is-loading' : ''}`}
              title="Move to wishlist"
              aria-label="Move to wishlist"
            >
              <HeartIcon />
            </button>
          </div>
        </td>
      </tr>

      {/* styling – mirrors wishlist, aligns columns, responsive labels */}
      <style jsx>{`
        .cart-row :global(td){ vertical-align: middle; padding:16px 12px; }
        .cart-row { border-bottom:1px solid #e5e7eb; background:#fff; }

        /* column widths to match Wishlist header alignment */
        .col-product { display:flex; align-items:flex-start; gap:14px; min-width: 420px; }
        .col-price   { width:160px; white-space:nowrap; text-align:right; }
        .col-qty     { width:220px; }
        .col-action  { width:300px; text-align:right; }

        .thumb-wrap{ display:inline-block; }
        .thumb{ width:84px; height:84px; border-radius:12px; overflow:hidden; background:#f3f4f6; display:block; flex:none; }
        .thumb-img{ width:100%; height:100%; object-fit:cover; display:block; }

        .prod-body{ min-width:0; }
        .title-link{ text-decoration:none; color:#0f172a; }
        .title-text{
          display:block;
          font-weight:700; font-size:18px; line-height:1.35; color:#0f172a;
          white-space:normal; overflow:visible;
        }

        .cart-meta{ margin-top:8px; display:grid; gap:6px; max-width:980px; }
        .meta-row{
          font-size:13.6px; font-weight:700; color:var(--tp-text-2);
          line-height:1.45;
          white-space:normal; overflow:visible; text-overflow:clip;
        }
        .meta-row.subtle{ font-weight:600; opacity:.9; }
        .meta-piece{ display:inline; padding-inline:0.25rem 0.4rem; }
        .meta-piece:not(:last-child)::after{
          content:" | ";
          color: color-mix(in lab, var(--tp-theme-secondary) 70%, var(--tp-text-2));
          font-weight:800;
          margin-left:.25rem;
        }

        .price{ font-weight:700; font-size:16px; color:#0f172a; }

        .qty{
          display:inline-flex; align-items:center; gap:14px;
          border:1px solid #e5e7eb; border-radius:999px; background:#fff; padding:8px 14px;
        }
        .qty-btn{
          display:inline-flex; align-items:center; justify-content:center;
          width:32px; height:32px; border-radius:999px; border:0; background:#f3f4f6;
          cursor:pointer; transition:background .15s ease, transform .04s ease;
        }
        .qty-btn:hover:not(:disabled){ background:#e5e7eb; }
        .qty-btn:active:not(:disabled){ transform:scale(.98); }
        .qty-btn:disabled{ opacity:0.6; cursor:not-allowed; }
        .qty-btn.loading{ opacity:0.7; }
        .qty-value{ min-width:28px; text-align:center; font-weight:700; font-size:16px; color:#0f172a; line-height:1; letter-spacing:.2px; }

        .action-stack{ display:flex; align-items:center; gap:10px; justify-content:flex-end; flex-wrap:wrap; }

        /* === Buttons – consistent with Wishlist === */
        .btn-ghost-invert {
          display:inline-flex; align-items:center; gap:8px;
          min-height:44px; padding:10px 18px;
          font-weight:600; font-size:15px; line-height:1;
          cursor:pointer; user-select:none;
          background: var(--tp-theme-primary);
          color: var(--tp-common-white);
          border: 1px solid var(--tp-theme-primary);
          box-shadow: 0 6px 18px rgba(0,0,0,0.12);
          transition: color .18s, background-color .18s, border-color .18s, box-shadow .18s, transform .12s;
        }
        .btn-ghost-invert.square{ border-radius:0; }
        .btn-ghost-invert.icon-only{ width:44px; padding:0; justify-content:center; }
        .btn-ghost-invert:hover{
          background-color: var(--tp-common-white);
          border-color: var(--tp-theme-primary);
          color: var(--tp-theme-primary);
          box-shadow: 0 0 0 1px var(--tp-theme-primary) inset, 0 8px 20px rgba(0,0,0,0.08);
          transform: translateY(-1px);
        }
        .btn-ghost-invert.is-loading { pointer-events:none; opacity:.9; }

        /* --------- mobile table: show headers as labels, stacked ---------- */
        @media (max-width: 992px){
          .col-product{ min-width: unset; }
          .col-action{ width:260px; }
        }
        @media (max-width:760px){
          .cart-row { display:block; padding:12px 10px; }
          .cart-row :global(td){
            display:flex; align-items:center; justify-content:space-between;
            padding:10px 0; border-bottom:1px dashed #eef0f3;
          }
          .cart-row :global(td:last-child){ border-bottom:0; }

          .col-product { display:grid; grid-template-columns:84px 1fr; gap:12px; }
          .col-product::before,
          .col-price::before,
          .col-qty::before,
          .col-action::before{
            content: attr(data-label);
            font-size:12px; color:#6b7280; margin-right:12px; min-width:90px;
            font-weight:600; text-transform:uppercase; letter-spacing:.4px;
            grid-column: 1 / -1; margin-bottom:6px;
          }
          .thumb{ width:72px; height:72px; border-radius:10px; }
          .title-text{ font-size:16px; }
          .col-price, .col-qty, .col-action { text-align:left; width:auto; }
          .action-stack{ justify-content:flex-start; gap:8px; }
        }

        .empty-row td { padding: 18px 12px; }
        .empty-wrap { display:flex; align-items:center; gap:10px; justify-content:center; color:#6b7280; font-weight:600; }
        .empty-ic { opacity:.8; }
        .empty-text { font-size:14px; }
      `}</style>
    </>
  );
};

export default CartItem;
