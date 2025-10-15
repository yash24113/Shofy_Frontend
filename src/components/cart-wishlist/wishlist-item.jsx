'use client';
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Close } from "@/svg";
import { add_cart_product } from "@/redux/features/cartSlice";
import { remove_wishlist_product } from "@/redux/features/wishlist-slice";
import LoginArea from "@/components/login-register/login-area";
import RegisterArea from "@/components/login-register/register-area";

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

/* ---------- server & storage ---------- */
const WISHLIST_BASE = "https://test.amrita-fashions.com/shopy";
const WISHLIST_ITEMS_KEY = "wishlist_items";

const readUserIdFromLocal = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("userid") || localStorage.getItem("userId") || null;
};

const readWishlistLocal = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISHLIST_ITEMS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};
const writeWishlistLocal = (items) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WISHLIST_ITEMS_KEY, JSON.stringify(items || []));
    window.dispatchEvent(new CustomEvent("wishlist-local-changed", { detail: { count: items?.length || 0 } }));
  } catch(err) {console.warn("writeWishlistLocal failed", err);}
};

/** GET server wishlist */
async function fetchServerWishlist(userId) {
  if (!userId) return [];
  try {
    const url = `${WISHLIST_BASE}/wishlist/${encodeURIComponent(userId)}`;
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`GET wishlist ${res.status}`);
    const data = await res.json();

    if (Array.isArray(data?.data?.products)) return data.data.products;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data?.items)) return data.data.items;

    const idsA = data?.data?.productIds;
    const idsB = data?.productIds;
    if (Array.isArray(idsA)) return idsA.map((x) => ({ _id: x?._id || x?.id || x }));
    if (Array.isArray(idsB)) return idsB.map((x) => ({ _id: x?._id || x?.id || x }));

    return [];
  } catch (err) {
    console.warn("fetchServerWishlist failed", err);
    return [];
  }
}

/** PUT union to server */
async function putServerWishlist(userId, ids) {
  if (!userId) return false;
  try {
    const url = `${WISHLIST_BASE}/wishlist/${encodeURIComponent(userId)}`;
    const res = await fetch(url, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, productIds: ids }),
    });
    return res.ok;
  } catch (e) {
    console.warn("putServerWishlist failed", e);
    return false;
  }
}

/** One-shot bootstrap: merge local + server on login/return */
async function syncWishlistTwoWay(userId) {
  if (!userId) return { ok: false, ids: new Set() };

  const local = readWishlistLocal();
  const localIds = new Set(local.map((x) => String(x?._id || x?.id)).filter(Boolean));

  const serverList = await fetchServerWishlist(userId);
  const serverIds = new Set((serverList || []).map((x) => String(x?._id || x?.id || x)).filter(Boolean));

  const union = new Set([...localIds, ...serverIds]);
  const ok = await putServerWishlist(userId, Array.from(union));
  if (ok) {
    writeWishlistLocal(Array.from(union).map((id) => ({ _id: id })));
  }
  return { ok, ids: union };
}

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

/* ---------- Component (GET server is source of truth; with bootstrapped sync) ---------- */
const WishlistItem = ({ product }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dispatch = useDispatch();
  const { cart_products } = useSelector((state) => state.cart);
  useSelector((state) => state.wishlist); // keep subscription

  const [userId, setUserId] = useState(() => readUserIdFromLocal());
  const [authModal, setAuthModal] = useState(null);

  // Keep userId in sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "userid" || e.key === "userId") setUserId(e.newValue || null);
    };
    const onFocus = () => setUserId(readUserIdFromLocal());
    const onVisible = () => { if (document.visibilityState === "visible") setUserId(readUserIdFromLocal()); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const { _id, title, salesPrice } = product || {};
  const isInCart = cart_products?.find?.((item) => item?._id === _id);

  // server ids
  const [serverIds, setServerIds] = useState(null);
  const [loadingServer, setLoadingServer] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

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

  // Bootstrap sync when userId becomes available / changes
  useEffect(() => {
    let stop = false;
    (async () => {
      if (!userId) { setServerIds(new Set()); setLoadingServer(false); return; }

      setLoadingServer(true);
      await syncWishlistTwoWay(userId); // merge local + server

      if (stop) return;
      const list = await fetchServerWishlist(userId);
      if (stop) return;

      const ids = new Set(
        (Array.isArray(list) ? list : [])
          .map((x) => x?._id || x?.id || x)
          .filter(Boolean)
          .map(String)
      );

      setServerIds(ids);
      setLoadingServer(false);

      try { window.dispatchEvent(new CustomEvent("wishlist-synced", { detail: { count: ids.size } })); } catch(err) {console.log(err);}
    })();
    return () => { stop = true; };
  }, [userId, refreshTick]);

  // Re-fetch on focus/visible
  useEffect(() => {
    const refetch = () => setRefreshTick((n) => n + 1);
    const onFocus = () => refetch();
    const onVisible = () => document.visibilityState === "visible" && refetch();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

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

  // show row only if server contains it
  const serverReady = !loadingServer && serverIds instanceof Set;
  const showByServer = serverReady ? serverIds.has(String(_id)) : true;
  const hidden = !matchesQuery || !showByServer;

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

  const closeAuth = useCallback(() => { setAuthModal(null); pushAuthQuery(null); }, [pushAuthQuery]);
  const openLogin = useCallback(() => { setAuthModal("login"); pushAuthQuery("login"); }, [pushAuthQuery]);
  const openRegister = useCallback(() => { setAuthModal("register"); pushAuthQuery("register"); }, [pushAuthQuery]);

  /* ---------- Actions (UI-only; server is source of truth here) ---------- */
  const handleAddProduct = async (prd) => {
    if (!userId) { openLogin(); return; }
    try {
      // optimistic UI
      dispatch(add_cart_product(prd));
      dispatch(remove_wishlist_product({ title, id: _id }));
      setServerIds((prev) => {
        const s = new Set(prev || []);
        s.delete(String(_id));
        return s;
      });
      // Note: you can call PUT here to actually remove from server if desired
    } finally {console.log("handleAddProduct done");}
  };

  const handleRemovePrd = async (prd) => {
    dispatch(remove_wishlist_product(prd));
    const id = String(prd?.id || prd?._id);
    setServerIds((prev) => {
      const s = new Set(prev || []);
      s.delete(id);
      return s;
    });
    // Optional: PUT with remaining ids after removal
    if (userId) {
      const remaining = Array.from(serverIds || []).filter((x) => x !== id);
      await putServerWishlist(userId, remaining);
      writeWishlistLocal(remaining.map((x) => ({ _id: x })));
    }
  };

  /* ---------- presentation ---------- */
  const imageBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
  const imageUrl =
    product?.img?.startsWith?.("http") ? product.img : `${imageBase}/uploads/${product?.img || ""}`;
  const slug = product?.slug || _id;

  const gsm = Number(pick(product?.gsm, product?.weightGsm, product?.weight_gsm));
  const fabricTypeVal = toText(pick(product?.fabricType, product?.fabric_type)) || "Woven Fabrics";
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

  if (loadingServer && !serverIds) return null;

  return (
    <>
      <tr className="wishlist-row" ref={rowRef} style={hidden ? { display: "none" } : undefined}>
        {/* img */}
        <td className="tp-cart-img wishlist-cell">
          <Link href={`/fabric/${slug}`} className="wishlist-img-link">
            {product?.img && (
              <Image
                src={imageUrl}
                alt={title || "product img"}
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
            {title}
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
          <span className="wishlist-price">{Number(salesPrice || 0).toFixed(2)}</span>
        </td>

        {/* add to cart */}
        <td className="tp-cart-add-to-cart wishlist-cell wishlist-cell-center">
          <button
            onClick={() => (userId ? handleAddProduct(product) : openLogin())}
            type="button"
            className="btn-ghost-invert square"
            title={userId ? "Move to Cart" : "Login to move"}
          >
            {userId ? "Move to Cart" : "Login to continue"}
          </button>
        </td>

        {/* remove */}
        <td className="tp-cart-action wishlist-cell">
          <button
            onClick={() => (userId ? handleRemovePrd({ title, id: _id }) : openLogin())}
            className="btn-ghost-invert square"
            type="button"
            title={userId ? "Remove from wishlist" : "Login to remove"}
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
        .wishlist-img { width: 70px; height: 100px; object-fit: cover; border-radius: 10px; background: #f3f58; box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
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
