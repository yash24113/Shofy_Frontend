'use client';
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Close } from "@/svg";
import { add_cart_product } from "@/redux/features/cartSlice";
import { removeWishlistItem, fetchWishlist } from "@/redux/features/wishlist-slice";
import LoginArea from "@/components/login-register/login-area";
import RegisterArea from "@/components/login-register/register-area";
import useWishlistManager from "@/hooks/useWishlistManager";

import useGlobalSearch from "@/hooks/useGlobalSearch";
import { buildSearchPredicate } from "@/utils/searchMiddleware";

/* ---------- helpers ---------- */
const nonEmpty = (v) =>
  Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && String(v).trim() !== "";
const pick = (...xs) => xs.find(nonEmpty);
const toText = (v) => {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (Array.isArray(v)) return v.map(toText).filter(Boolean).join(", ");
  if (typeof v === "object") return toText(v.name ?? v.value ?? v.title ?? v.label ?? "");
  return "";
};
const round = (n, d = 1) => (isFinite(n) ? Number(n).toFixed(d).replace(/\.0+$/, "") : "");
const gsmToOz = (gsm) => gsm * 0.0294935;
const cmToInch = (cm) => cm / 2.54;
const isNoneish = (s) => {
  if (!s) return true;
  const t = String(s).trim().toLowerCase().replace(/\s+/g, " ");
  return ["none", "na", "none/ na", "none / na", "n/a", "-"].includes(t);
};

/* ---------- empty-banner manager (DOM only) ---------- */
function useEmptyBanner(listId, rowVisible, emptyText) {
  const rowRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.__listVis = window.__listVis || {};
    const bucket = (window.__listVis[listId] = window.__listVis[listId] || { vis: 0, banner: null });

    const tbody = rowRef.current?.closest("tbody");
    if (!tbody) return;

    const ensureBannerExists = () => {
      if (bucket.banner && bucket.banner.isConnected) return bucket.banner;
      const tr = document.createElement("tr");
      tr.className = "empty-row";
      const td = document.createElement("td");
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

    let prev = rowRef.current ? rowRef.current.__wasVisible : undefined;
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

/* ---------- Component (server is source of truth) ---------- */
const WishlistItem = ({ product }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dispatch = useDispatch();

  // cart slice
  const { cart_products } = useSelector((s) => s.cart) || {};

  // wishlist manager (provides userId, wishlist, loading)
  const { userId, wishlist, loading } = useWishlistManager();

  // also read slice.loading to know fetch state
  const wlLoading = useSelector((s) => s.wishlist?.loading) ?? false;

  // Normalize id early
  const _id = product?._id || product?.id || product?.product?._id || product?.productId || product?.product || null;
  const isInCart = cart_products?.find?.((item) => String(item?._id) === String(_id));

  const [moving, setMoving] = useState(false);
  const [authModal, setAuthModal] = useState(null);

  // 🔎 global search
  const { debounced: globalQuery } = useGlobalSearch(150);

  const searchableFields = useMemo(
    () => [
      (p) => p?.title,
      (p) => p?.name,
      (p) => p?._id,
      (p) => p?.id,
      (p) => p?.slug,
      (p) => p?.fabricType || p?.fabric_type,
      (p) => p?.content || p?.contentName || p?.content_label,
      (p) => p?.design || p?.designName,
      (p) => p?.colors || p?.color || p?.colorName,
      (p) => p?.finish || p?.subfinish?.name || p?.finishName,
      (p) => p?.structure || p?.substructure?.name || p?.structureName,
      (p) => p?.widthLabel || p?.width_cm || p?.width,
      (p) => p?.tags,
      (p) => p?.sku,
    ],
    []
  );

  const matchesQuery = useMemo(() => {
    const q = (globalQuery || "").trim();
    if (q.length < 2) return true;
    const pred = buildSearchPredicate(q, searchableFields, {
      mode: "AND",
      normalize: true,
      minTokenLen: 2,
    });
    return pred(product);
  }, [globalQuery, product, searchableFields]);

  // Only show if slice says this product is in wishlist
  const showByServer = useMemo(() => {
    if (!Array.isArray(wishlist)) return false;
    return wishlist.some((it) => String(it?._id) === String(_id));
  }, [wishlist, _id]);

  // ✅ Gating without early return: decide visibility at render time
  const wlReady = Array.isArray(wishlist) && !wlLoading && !loading;
  const hiddenBecauseNotReady = !wlReady;
  const hidden = hiddenBecauseNotReady || !matchesQuery || !showByServer;

  const { rowRef } = useEmptyBanner("wishlist", !hidden, "No product found in wishlist");

  const currentUrlWithQuery = useMemo(() => {
    const url =
      typeof window !== "undefined" ? new URL(window.location.href) : new URL("http://localhost");
    return url.pathname + url.search;
  }, [pathname, searchParams]);

  const pushAuthQuery = useCallback(
    (type) => {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      if (type) {
        url.searchParams.set("auth", type);
        url.searchParams.set("redirect", currentUrlWithQuery);
      } else {
        url.searchParams.delete("auth");
        url.searchParams.delete("redirect");
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
    setAuthModal("login");
    pushAuthQuery("login");
  }, [pushAuthQuery]);
  const openRegister = useCallback(() => {
    setAuthModal("register");
    pushAuthQuery("register");
  }, [pushAuthQuery]);

  /* ---------- Actions (server-backed) ---------- */
  const handleAddProduct = async (prd) => {
    if (!userId) { openLogin(); return; }
    try {
      setMoving(true);
      // 1) Call Add to Cart API
      const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/+$/, '');
      const url = `${base}/cart/add`;
      try {
        await fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, productId: String(_id), quantity: 1 }),
        });
      } catch(_) { /* proceed to local update regardless */ }

      // 2) Optimistically update local cart slice (and persist to localStorage)
      const priceRaw = pick(
        prd?.salesPrice,
        prd?.price,
        prd?.product?.salesPrice,
        prd?.product?.price
      );
      const normalizedCartItem = {
        ...prd,
        _id,
        id: _id,
        title:
          toText(pick(
            prd?.title,
            prd?.name,
            prd?.product?.name,
            prd?.productname,
            prd?.productTitle,
            prd?.seoTitle,
            prd?.groupcode?.name,
          )) || 'Product',
        price: Number(priceRaw || 0),
        image: prd?.image || prd?.img || prd?.image1 || prd?.product?.img || '',
        quantity: 1, // default quantity 1
      };
      dispatch(add_cart_product(normalizedCartItem));

      // 3) Remove from wishlist on server and refresh
      await dispatch(
        removeWishlistItem({ userId, productId: String(_id), title: getDisplayTitle })
      ).unwrap();
      dispatch(fetchWishlist(userId));
    } catch (e) {
      console.error("Move to cart failed", e);
    } finally {
      setTimeout(() => setMoving(false), 250);
    }
  };

  const handleRemovePrd = async (prd) => {
    if (!userId) { openLogin(); return; }
    try {
      await dispatch(
        removeWishlistItem({ userId, productId: String(prd?.id || prd?._id), title: getDisplayTitle })
      ).unwrap();
      dispatch(fetchWishlist(userId));
    } catch (e) {
      console.error("Remove failed", e);
      alert("Failed to remove item from wishlist. Please try again.");
    }
  };

  /* ---------- presentation ---------- */
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
  const fallbackCdn = (process.env.NEXT_PUBLIC_CDN_BASE || 'https://test.amrita-fashions.com/shopy').replace(/\/+$/, "");
  // Image resolution with robust cleaning similar to ProductItem
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
    valueToUrlString(product?.product?.img) || '';
  const isHttpUrl = (s) => /^https?:\/\//i.test(s || '');
  const clean = (p) => String(p || '')
    .replace(/^\/+/, '')
    .replace(/^api\/uploads\/?/, '')
    .replace(/^uploads\/?/, '');
  const imageUrl = rawImg
    ? (isHttpUrl(rawImg)
        ? rawImg
        : `${(apiBase || fallbackCdn)}/uploads/${clean(rawImg)}`)
    : '';

  // Title and slug fallbacks
  const getDisplayTitle =
    toText(pick(
      product?.title,
      product?.name,
      product?.product?.name,
      product?.productname,
      product?.productTitle,
      product?.seoTitle,
      product?.groupcode?.name,
    ));
  const slug = product?.slug || product?.product?.slug || _id;

  const gsm = Number(pick(product?.gsm, product?.weightGsm, product?.weight_gsm));
  const fabricTypeVal = toText(pick(product?.fabricType, product?.fabric_type)); // no default
  const contentVal = toText(pick(product?.content, product?.contentName, product?.content_label));
  const weightVal =
    isFinite(gsm) && gsm > 0 ? `${round(gsm)} gsm / ${round(gsmToOz(gsm))} oz` : toText(product?.weight);
  const designVal = toText(pick(product?.design, product?.designName));
  const colorsVal = toText(pick(product?.colors, product?.color, product?.colorName));
  const widthCm = Number(pick(product?.widthCm, product?.width_cm, product?.width));
  const widthVal =
    isFinite(widthCm) && widthCm > 0
      ? `${round(widthCm, 0)} cm / ${round(cmToInch(widthCm), 0)} inch`
      : toText(product?.widthLabel);
  const finishVal = toText(pick(product?.finish, product?.subfinish?.name, product?.finishName));
  const structureVal = toText(pick(product?.structure, product?.substructure?.name, product?.structureName));

  // Build top details only when available
  const allDetails = [
    fabricTypeVal,
    contentVal,
    weightVal,
    designVal,
    colorsVal,
    widthVal,
    finishVal,
    structureVal,
  ].filter((v) => nonEmpty(v) && !isNoneish(v));
  const topFourDetails = allDetails.slice(0, 4);
  const mid4 = Math.ceil(topFourDetails.length / 2);
  const left4 = topFourDetails.slice(0, mid4);
  const right4 = topFourDetails.slice(mid4);

  return (
    <>
      <tr
        className="wishlist-row"
        ref={rowRef}
        style={hidden ? { display: "none" } : undefined}
        aria-hidden={hidden ? "true" : "false"}
      >
        {/* img */}
        <td className="tp-cart-img wishlist-cell">
          <Link href={`/fabric/${slug}`} className="wishlist-img-link">
            {!!imageUrl && (
              <img
                src={imageUrl}
                alt={getDisplayTitle || "product image"}
                width={70}
                height={100}
                className="wishlist-img"
                priority={false}
              />
            )}
          </Link>
        </td>

        {/* title */}
        <td className="tp-cart-title wishlist-cell">
          <Link href={`/fabric/${slug}`} className="wishlist-title">
            {getDisplayTitle || 'Product'}
          </Link>
          {topFourDetails.length ? (
            <div className="wishlist-specs">
              <ul className="wishlist-spec-col">
                {left4.map((v, i) => (
                  <li key={i} className="wishlist-spec-row" title={v}>
                    <span className="wishlist-spec-value">{v}</span>
                  </li>
                ))}
              </ul>
              <ul className="wishlist-spec-col">
                {right4.map((v, i) => (
                  <li key={i} className="wishlist-spec-row" title={v}>
                    <span className="wishlist-spec-value">{v}</span>
                  </li>
                ))}
              </ul>
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
              product?.product?.price
            );
            const price = Number(priceRaw || 0);
            return <span className="wishlist-price">{price.toFixed(2)}</span>;
          })()}
        </td>

        {/* add to cart */}
        <td className="tp-cart-add-to-cart wishlist-cell wishlist-cell-center">
          <button
            onClick={() => handleAddProduct(product)}
            type="button"
            className={`btn-ghost-invert square ${moving ? "is-loading" : ""}`}
            aria-busy={moving ? "true" : "false"}
            title="Move to Cart"
            disabled={!!isInCart && !moving}
          >
            {moving ? "Moving…" : (isInCart ? "Already in Cart" : "Move to Cart")}
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
      {authModal === "login" && (
        <LoginArea onClose={closeAuth} onSwitchToRegister={openRegister} />
      )}
      {authModal === "register" && (
        <RegisterArea onClose={closeAuth} onSwitchToLogin={openLogin} />
      )}

      <style jsx>{`
        .wishlist-row { border-bottom: 1px solid #eef0f3; transition: background-color 160ms ease, box-shadow 180ms ease; }
        .wishlist-row:hover { background: #fafbfc; }
        .wishlist-cell { padding: 14px 12px; vertical-align: middle; }
        .tp-cart-img.wishlist-cell { padding-right: 20px; }
        .wishlist-cell-center { text-align: center; }
        .tp-cart-title.wishlist-cell { padding-left: 0; }
        .wishlist-img-link { display: inline-block; line-height: 0; }
        .wishlist-img { width: 70px; height: 100px; object-fit: cover; border-radius: 10px; background: #f3f5f8; box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
        .wishlist-title { display:block; font-weight:600; line-height:1.3; color:#0f172a; text-decoration:none; }
        .wishlist-title:hover { text-decoration: underline; }
        .wishlist-price { font-weight:600; color:#0f172a; }
        .wishlist-specs{ display:grid; grid-template-columns:1fr 1fr; gap:0 14px; margin-top:8px; max-width:620px; margin-left:8px; }
        .wishlist-spec-col{ list-style:none; margin:0; padding:0; }
        .wishlist-spec-row{ padding:4px 0; border-bottom:1px dashed rgba(17,24,39,.08); }
        .wishlist-spec-row:last-child{ border-bottom:0; }
        .wishlist-spec-value{ font-size:12.5px; font-weight:500; color:#374151; }
        @media (max-width:640px){ .wishlist-specs{ grid-template-columns:1fr; } }
        .btn-ghost-invert { --navy:#0b1620; display:inline-flex; align-items:center; gap:8px; min-height:44px; padding:10px 18px; border-radius:0; font-weight:600; font-size:15px; line-height:1; cursor:pointer; user-select:none; background:var(--navy); color:#fff; border:1px solid var(--navy); box-shadow:0 6px 18px rgba(0,0,0,0.22); transition: background .18s, color .18s, border-color .18s, box-shadow .18s, transform .12s; }
        .btn-ghost-invert:hover { background:#fff; color:var(--navy); border-color:var(--navy); box-shadow:0 0 0 1px var(--navy) inset, 0 8px 20px rgba(0,0,0,0.12); transform: translateY(-1px); }
        .btn-ghost-invert:active { transform: translateY(0); background:#f8fafc; color:var(--navy); box-shadow:0 3px 10px rgba(0,0,0,0.15); }
        .btn-ghost-invert:focus-visible { outline:0; box-shadow:0 0 0 3px rgba(11,22,32,0.35); }
        .btn-ghost-invert.is-loading { pointer-events:none; opacity:.9; }
        @media (max-width: 640px) {
          .wishlist-cell { padding: 10px 8px; }
          .tp-cart-title.wishlist-cell { padding-left: 0; }
          .wishlist-img { width: 56px; height: 80px; border-radius: 8px; }
          .btn-ghost-invert { min-height: 42px; padding: 9px 16px; }
        }
        .empty-row td { padding: 18px 12px; }
        .empty-wrap { display:flex; align-items:center; gap:10px; justify-content:center; color:#6b7280; font-weight:600; }
        .empty-ic { opacity:.8; }
        .empty-text { font-size:14px; }
      `}</style>
    </>
  );
};

export default WishlistItem;
