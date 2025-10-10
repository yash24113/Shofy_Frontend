'use client';
import React, { useEffect, useMemo, useState, useCallback } from "react";
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

/* ---------- helpers (JS only) ---------- */
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

/* ---------- ids / storage ---------- */
const getSessionId = () =>
  (typeof window !== "undefined" && localStorage.getItem("sessionId")) || null;

const selectUserId = (state) =>
  state?.auth?.user?._id ||
  state?.auth?.user?.id ||
  state?.auth?.userInfo?._id ||
  state?.auth?.userInfo?.id ||
  state?.user?.user?._id ||
  null;

const GUEST_KEY = "wishlist_guest";
const userKey = (uid, sid) => `wishlist_${uid || "anon"}_${sid || "nosid"}`;

const readFromKey = (key) => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

const writeToKey = (key, list) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(list || []));
  } catch (e) {
    console.log("localStorage write error", e);
  }
};

const mergeUniqueById = (a = [], b = []) => {
  const map = new Map();
  [...a, ...b].forEach((item) => {
    const id = item?._id || item?.id;
    if (id) map.set(id, item);
  });
  return Array.from(map.values());
};

const removeById = (arr = [], id) => arr.filter((x) => (x?._id || x?.id) !== id);

/* ---------- server (API) ---------- */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

async function fetchServerWishlist(userId) {
  if (!userId || !API_BASE) return [];
  try {
    const res = await fetch(
      `${API_BASE}/api/wishlist?userId=${encodeURIComponent(userId)}`,
      { method: "GET", credentials: "include", headers: { Accept: "application/json" }, cache: "no-store" }
    );
    if (!res.ok) throw new Error(`GET wishlist ${res.status}`);
    const data = await res.json();
    const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
    return items;
  } catch (err) {
    console.warn("fetchServerWishlist failed", err);
    return [];
  }
}

async function pushServerWishlist(userId, items) {
  if (!userId || !API_BASE) return false;
  try {
    const res = await fetch(`${API_BASE}/api/wishlist`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, items }),
    });
    return res.ok;
  } catch (err) {
    console.warn("pushServerWishlist failed", err);
    return false;
  }
}

/* ---------- Component ---------- */
const WishlistItem = ({ product }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dispatch = useDispatch();
  const { cart_products } = useSelector((state) => state.cart);
  const { wishlist } = useSelector((state) => state.wishlist) || { wishlist: [] };
  const userId = useSelector(selectUserId);

  const { _id, img, title, salesPrice } = product || {};
  const isInCart = cart_products?.find?.((item) => item?._id === _id);

  const [moving, setMoving] = useState(false);
  const [authModal, setAuthModal] = useState(null); // 'login' | 'register' | null
  const [migratedOnce, setMigratedOnce] = useState(false);

  // 🔎 subscribe to global search
  const { debounced: globalQuery } = useGlobalSearch(150);

  const searchableFields = useMemo(() => ([
    (p) => p?.title, (p) => p?.name, (p) => p?._id, (p) => p?.id, (p) => p?.slug,
    (p) => p?.fabricType || p?.fabric_type,
    (p) => p?.content || p?.contentName || p?.content_label,
    (p) => p?.design || p?.designName,
    (p) => p?.colors || p?.color || p?.colorName,
    (p) => p?.finish || p?.subfinish?.name || p?.finishName,
    (p) => p?.structure || p?.substructure?.name || p?.structureName,
    (p) => p?.widthLabel || p?.width_cm || p?.width,
    (p) => p?.tags, (p) => p?.sku,
  ]), []);

  const matchesQuery = useMemo(() => {
    const q = (globalQuery || "").trim();
    if (q.length < 2) return true; // don't filter tiny queries
    const pred = buildSearchPredicate(q, searchableFields, {
      mode: "AND", normalize: true, minTokenLen: 2,
    });
    return pred(product);
  }, [globalQuery, product, searchableFields]);

  // current page url (for redirect after auth)
  const currentUrlWithQuery = useMemo(() => {
    const url =
      typeof window !== "undefined" ? new URL(window.location.href) : new URL("http://localhost");
    return url.pathname + url.search;
  }, [pathname, searchParams]);

  const pushAuthQuery = useCallback((type) => {
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
  }, [currentUrlWithQuery, router]);

  const closeAuth = useCallback(() => { setAuthModal(null); pushAuthQuery(null); }, [pushAuthQuery]);
  const openLogin = useCallback(() => { setAuthModal("login"); pushAuthQuery("login"); }, [pushAuthQuery]);
  const openRegister = useCallback(() => { setAuthModal("register"); pushAuthQuery("register"); }, [pushAuthQuery]);

  // ensure guest->user migration once on login
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sid = getSessionId();
    if (!sid || !userId || migratedOnce) return;

    const guestList = readFromKey(GUEST_KEY);
    if (guestList.length > 0) {
      const uKey = userKey(userId, sid);
      const userScoped = readFromKey(uKey);
      (async () => {
        const serverItems = await fetchServerWishlist(userId);
        const merged = mergeUniqueById(mergeUniqueById(userScoped, guestList), serverItems);
        writeToKey(uKey, merged);
        try { localStorage.removeItem(GUEST_KEY); } catch(e) { console.log("error", e); }
        await pushServerWishlist(userId, merged);
        setMigratedOnce(true);
      })();
    } else {
      (async () => {
        const uKey = userKey(userId, sid);
        const userScoped = readFromKey(uKey);
        const serverItems = await fetchServerWishlist(userId);
        const merged = mergeUniqueById(userScoped, serverItems);
        writeToKey(uKey, merged);
        await pushServerWishlist(userId, merged);
        setMigratedOnce(true);
      })();
    }
  }, [userId, migratedOnce]);

  // deep-link auth modal (?auth=login|register)
  useEffect(() => {
    const auth = searchParams.get("auth");
    if (auth === "login" || auth === "register") {
      setAuthModal(auth);
    }
  }, [searchParams]);

  // helpers for storage/server sync
  const getActiveKey = () => {
    const sid = getSessionId();
    if (sid && userId) return userKey(userId, sid);
    return GUEST_KEY;
  };

  const mirrorRemoveEverywhere = async (id) => {
    const key = getActiveKey();
    const list = readFromKey(key);
    const next = removeById(list, id);
    writeToKey(key, next);
    if (userId) await pushServerWishlist(userId, next);
  };

  const handleAddProduct = async (prd) => {
    const sid = getSessionId();
    if (!sid) { openLogin(); return; }
    try {
      setMoving(true);
      dispatch(add_cart_product(prd));
      dispatch(remove_wishlist_product({ title, id: _id }));
      await mirrorRemoveEverywhere(_id);
    } finally {
      setTimeout(() => setMoving(false), 250);
    }
  };

  const handleRemovePrd = async (prd) => {
    dispatch(remove_wishlist_product(prd));
    const id = prd?.id || prd?._id;
    if (id) await mirrorRemoveEverywhere(id);
  };

  /* --------- IMPORTANT: do NOT return before all hooks run --------- */
  if (!matchesQuery) return null;

  /* ---------- image / slug (can be computed after hooks) ---------- */
  const imageUrl = img?.startsWith?.("http")
    ? img
    : `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${img}`;
  const slug = product?.slug || _id;

  // details for display
  const gsm = Number(pick(product?.gsm, product?.weightGsm, product?.weight_gsm));
  const fabricTypeVal =
    toText(pick(product?.fabricType, product?.fabric_type)) || "Woven Fabrics";
  const contentVal = toText(pick(product?.content, product?.contentName, product?.content_label));
  const weightVal =
    isFinite(gsm) && gsm > 0
      ? `${round(gsm)} gsm / ${round(gsmToOz(gsm))} oz`
      : toText(product?.weight);
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
    fabricTypeVal, contentVal, weightVal, designVal,
    colorsVal, widthVal, finishVal, structureVal,
  ].filter((v) => nonEmpty(v) && !isNoneish(v));
  const topFourDetails = allDetails.slice(0, 4);
  const mid4 = Math.ceil(topFourDetails.length / 2);
  const left4 = topFourDetails.slice(0, mid4);
  const right4 = topFourDetails.slice(mid4);

  return (
    <>
      <tr className="wishlist-row">
        {/* img */}
        <td className="tp-cart-img wishlist-cell">
          <Link href={`/fabric/${slug}`} className="wishlist-img-link">
            {img && (
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
          <Link href={`/fabric/${slug}`} className="wishlist-title">{title}</Link>
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
          <span className="wishlist-price">{(Number(salesPrice || 0)).toFixed(2)}</span>
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
            {moving ? "Moving…" : "Move to Cart"}
          </button>
        </td>

        {/* remove */}
        <td className="tp-cart-action wishlist-cell">
          <button
            onClick={() => handleRemovePrd({ title, id: _id })}
            className="btn-ghost-invert square"
            type="button"
            title="Remove from wishlist"
          >
            <Close /><span> Remove</span>
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
      `}</style>
    </>
  );
};

export default WishlistItem;
