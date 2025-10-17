'use client';
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
// icons
import { Close, Minus, Plus } from "@/svg";
import { selectUserId } from "@/utils/userSelectors";
import { useUpdateCartItemMutation } from "@/redux/features/cartApi";
/* refresh cart after mutations — SERVER ONLY */
import { fetch_cart_products } from "@/redux/features/cartSlice";
/* search */
import useGlobalSearch from "@/hooks/useGlobalSearch";
import { buildSearchPredicate } from "@/utils/searchMiddleware";

/** @typedef {{ vis:number, banner:HTMLTableRowElement|null }} ListVisBucket */

if (typeof window !== "undefined") {
  // for editor intellisense only
  window.__listVis = window.__listVis || {};
}

/* ========= Empty banner manager (JS version) ========= */
function useEmptyBanner(listId, rowVisible, emptyText) {
  const rowRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    /** @type {Record<string, ListVisBucket>} */
    const buckets = (window.__listVis = window.__listVis || {});
    const bucket = (buckets[listId] = buckets[listId] || { vis: 0, banner: null });

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

    const prevStr = rowRef.current?.dataset.wasVisible;
    const prev = prevStr === "true" ? true : prevStr === "false" ? false : undefined;

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
      const was = rowRef.current?.dataset.wasVisible === "true";
      if (was) bucket.vis = Math.max(0, bucket.vis - 1);
      if (rowRef.current) rowRef.current.dataset.wasVisible = "false";

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

/* ========= Component (JS version) ========= */
const CartItem = ({ product }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const userId = useSelector(selectUserId);
  const [updateCartItem, { isLoading: isUpdating }] = useUpdateCartItemMutation();

  const [isRemoving, setIsRemoving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGone, setIsGone] = useState(false); // optimistic hide

  /* global query */
  const { debounced: q } = useGlobalSearch();

  const {
    productId,
    _id,
    id,
    slug,
    img,
    image,
    title = "Product",
    salesPrice = 0,
    price = 0,
    orderQuantity,
  } = product || {};

  const nested = typeof productId === "object" && productId ? productId : null;

  const PID =
    (nested && nested._id) ||
    (typeof productId === "string" ? productId : null) ||
    _id ||
    id ||
    null;

  const name = (nested && nested.name) || title || "Product";
  const safeSlug = (nested && nested.slug) || slug || PID || "";
  const href = `/fabric/${safeSlug}`;

  const unit =
    typeof salesPrice === "number"
      ? salesPrice
      : Number.parseFloat(String(salesPrice)) || price || 0;
  const lineTotal = (unit || 0) * (orderQuantity || 0);

  const rawImg =
    (nested && (nested.image1 || nested.img || nested.image)) || img || image || "";
  const imageUrl =
    typeof rawImg === "string" && rawImg.startsWith("http")
      ? rawImg
      : rawImg
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${rawImg}`
      : "/images/placeholder-portrait.webp";

  /* -------------------- API helpers -------------------- */

  // DELETE /shopy/cart/remove/:productId
  const removeFromCart = useCallback(
    async (productIdToRemove) => {
      const url = `https://test.amrita-fashions.com/shopy/cart/remove/${productIdToRemove}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Cart remove failed: ${res.status} ${text}`);
      }
      await res.json().catch(() => ({}));
    },
    [userId]
  );

  // POST /shopy/wishlist/add (tries multiple encodings)
  const addToWishlist = useCallback(async (uId, pId) => {
    const base = `https://test.amrita-fashions.com/shopy/wishlist/add`;
    const options = [
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({ userId: String(uId), productId: String(pId) }),
      },
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ userId: uId, productId: pId }),
      },
      {
        method: "POST",
        body: (() => {
          const fd = new FormData();
          fd.append("userId", String(uId));
          fd.append("productId", String(pId));
          return fd;
        })(),
      },
      {
        method: "POST",
        url: `${base}?userId=${encodeURIComponent(String(uId))}&productId=${encodeURIComponent(
          String(pId)
        )}`,
      },
    ];

    let lastError = null;

    for (const opt of options) {
      try {
        const target = opt.url ? opt.url : base;
        const { url: _ignored, ...fetchOpts } = opt;
        const res = await fetch(target, { ...fetchOpts, credentials: "include" });
        if (res.ok) {
          await res.json().catch(() => ({}));
          return;
        }
        if (res.status >= 400 && res.status < 500) {
          const errorText = await res.text().catch(() => "Unknown error");
          throw new Error(`Server rejected request: ${res.status} ${errorText}`);
        }
      } catch (e) {
        lastError = e;
        // try next encoding
      }
    }
    throw lastError || new Error("Failed to add to wishlist: All attempts failed");
  }, []);

  /* -------------------- qty handlers (SERVER REFRESH) -------------------- */
  const refreshCartFromServer = useCallback(() => {
    if (!userId) return;
    dispatch(fetch_cart_products({ userId }));
  }, [dispatch, userId]);

  const inc = async () => {
    if (!PID || isUpdating) return;
    const newQuantity = (orderQuantity || 0) + 1;
    try {
      await updateCartItem({ productId: PID, quantity: newQuantity, userId }).unwrap();
      refreshCartFromServer();
      router.refresh();
    } catch (error) {
      console.error("Failed to increment quantity:", error);
    }
  };

  const dec = async () => {
    if (!PID || isUpdating || (orderQuantity || 0) <= 1) return;
    const newQuantity = Math.max(1, (orderQuantity || 0) - 1);
    try {
      await updateCartItem({ productId: PID, quantity: newQuantity, userId }).unwrap();
      refreshCartFromServer();
      router.refresh();
    } catch (error) {
      console.error("Failed to decrement quantity:", error);
    }
  };

  /* -------------------- remove / save handlers (SERVER REFRESH) -------------------- */
  const removeOnly = async () => {
    if (!PID || isRemoving || isSaving) return;
    setIsRemoving(true);
    try {
      await removeFromCart(PID);
      setIsGone(true);                 // optimistic hide
      refreshCartFromServer();         // sync Redux from server
      router.refresh();                // update SSR data
      if (typeof window !== "undefined" && window.toast) {
        window.toast.success("Removed from cart");
      }
    } catch (error) {
      if (typeof window !== "undefined" && window.toast) {
        window.toast.error("Failed to remove item");
      }
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
      refreshCartFromServer();
      router.refresh();
      if (typeof window !== "undefined" && window.toast) {
        window.toast.success("Moved to wishlist");
      }
    } catch (error) {
      if (typeof window !== "undefined") {
        if (window.toast) window.toast.error("Failed to save to wishlist");
        else alert("Failed to save to wishlist. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  /* search visibility */
  const searchVisible = useMemo(() => {
    const query = (q || "").trim();
    if (query.length < 2) return true;
    const fields = [
      () => name || "",
      () => safeSlug || "",
      () => String(product?.design ?? ""),
      () => String(product?.color ?? ""),
    ];
    const pred = buildSearchPredicate(query, fields, { mode: "AND", normalize: true });
    return pred(product);
  }, [q, product, name, safeSlug]);

  const rowVisible = searchVisible && !isGone;
  const { rowRef } = useEmptyBanner("cart", !!rowVisible, "No product found in cart");

  return (
    <>
      <tr className="cart-row" ref={rowRef} style={!rowVisible ? { display: "none" } : undefined}>
        {/* image */}
        <td className="col-img" data-label="Product">
          <Link href={href} className="thumb-wrap" aria-label={name}>
            <span className="thumb">
              <Image src={imageUrl} alt={name} width={96} height={96} className="thumb-img" />
            </span>
          </Link>
        </td>

        {/* title */}
        <td className="col-title" data-label="Name">
          <Link href={href} className="title-link">
            <span className="title-text">{name}</span>
          </Link>
        </td>

        {/* price */}
        <td className="col-price" data-label="Total">
          <span className="price">{unit ? `₹${(lineTotal || 0).toFixed(2)}` : "—"}</span>
        </td>

        {/* quantity */}
        <td className="col-qty" data-label="Qty">
          <div className="qty">
            <button
              type="button"
              className={`qty-btn ${isUpdating ? "loading" : ""}`}
              onClick={dec}
              disabled={isUpdating || (orderQuantity || 0) <= 1}
              aria-label={`Decrease ${name}`}
            >
              <Minus />
            </button>
            <span className="qty-value" aria-live="polite" aria-label={`Quantity of ${name}`}>
              {orderQuantity}
            </span>
            <button
              type="button"
              className={`qty-btn ${isUpdating ? "loading" : ""}`}
              onClick={inc}
              disabled={isUpdating}
              aria-label={`Increase ${name}`}
            >
              <Plus />
            </button>
          </div>
        </td>

        {/* actions */}
        <td className="col-action" data-label="Actions">
          <div className="action-stack">
            <button
              type="button"
              onClick={removeOnly}
              disabled={isRemoving || isSaving}
              className={`btn-ghost-invert square ${isRemoving ? "loading" : ""}`}
              title="Remove item"
            >
              <Close />
              <span>{isRemoving ? "Removing…" : "Remove"}</span>
            </button>

            <button
              type="button"
              onClick={saveForWishlist}
              disabled={isSaving || isRemoving || !userId}
              className={`btn-outline square ${isSaving ? "loading" : ""}`}
              title="Save for wishlist"
            >
              <span className="heart" aria-hidden>♥</span>
              <span>{isSaving ? "Saving…" : "Save for wishlist"}</span>
            </button>
          </div>
        </td>
      </tr>

      <style jsx>{`
        /* ---------- Table row base ---------- */
        .cart-row :global(td){ vertical-align: middle; padding:16px 12px; }
        .cart-row { border-bottom:1px solid #e5e7eb; background:#fff; }

        .col-img   { width:120px; min-width:120px; }
        .col-title { max-width:620px; }
        .col-price { width:160px; white-space:nowrap; text-align:right; }
        .col-qty   { width:200px; }
        .col-action{ width:280px; text-align:right; }

        .thumb-wrap{ display:inline-block; }
        .thumb{ width:96px; height:96px; border-radius:12px; overflow:hidden; background:#f3f4f6; display:block; }
        .thumb-img{ width:100%; height:100%; object-fit:cover; display:block; }

        .title-link{ text-decoration:none; color:#0b1220; }
        .title-text{ display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; overflow:hidden; word-break:break-word; font-weight:700; font-size:18px; line-height:1.35; color:#0b1220; }

        .price{ font-weight:700; font-size:16px; color:#0b1220; }

        .qty{ display:inline-flex; align-items:center; gap:14px; border:1px solid #e5e7eb; border-radius:999px; background:#fff; padding:8px 14px; }
        .qty-btn{ display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:999px; border:0; background:#f3f4f6; cursor:pointer; transition:background .15s ease, transform .04s ease; }
        .qty-btn:hover:not(:disabled){ background:#e5e7eb; }
        .qty-btn:active:not(:disabled){ transform:scale(.98); }
        .qty-btn:disabled{ opacity:0.6; cursor:not-allowed; }
        .qty-btn.loading{ opacity:0.7; }
        .qty-value{ min-width:28px; text-align:center; font-weight:700; font-size:16px; color:#0b1220; line-height:1; letter-spacing:.2px; }

        .action-stack{ display:flex; align-items:center; gap:10px; justify-content:flex-end; flex-wrap:wrap; }
        .btn-ghost-invert.square { --navy: #0b1620; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; min-height: 44px; background: var(--navy); color: #fff; font-weight: 600; font-size: 14px; line-height: 1; border: 1px solid var(--navy); border-radius: 8px; cursor: pointer; user-select: none; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16); transition: background 180ms ease, color 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 120ms ease; }
        .btn-ghost-invert.square:hover:not(:disabled) { background: #fff; color: var(--navy); border-color: var(--navy); box-shadow: 0 0 0 1px var(--navy) inset, 0 8px 20px rgba(0,0,0,.12); transform: translateY(-1px); }
        .btn-ghost-invert.square:active:not(:disabled) { transform: translateY(0); background: #f8fafc; color: var(--navy); box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12); }
        .btn-ghost-invert.square:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(11, 22, 32, 0.35); }
        .btn-ghost-invert.square:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-ghost-invert.square.loading { opacity: 0.7; }

        .btn-outline.square { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:10px 16px; min-height:44px; background:#ffffff; color:#0b1620; border:1px solid #0b1620; border-radius:8px; font-weight:600; font-size:14px; cursor:pointer; transition: background 180ms ease, color 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 120ms ease; }
        .btn-outline.square:hover:not(:disabled){ background:#0b1620; color:#fff; transform: translateY(-1px); }
        .btn-outline.square:active:not(:disabled){ transform: translateY(0); }
        .btn-outline.square:disabled{ opacity:.6; cursor:not-allowed; }
        .btn-outline.square.loading{ opacity:.7; }
        .btn-outline .heart{ font-size:16px; line-height:1; }

        /* ---------- Responsive table (stacked on mobile) ---------- */
        @media (max-width:992px){ .col-title{ max-width:420px; } .col-action{ width:240px; } }

        @media (max-width:760px){
          .cart-row { display:block; padding:12px 10px; }
          .cart-row :global(td){ display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px dashed #eef0f3; }
          .cart-row :global(td:last-child){ border-bottom:0; }
          .col-img { justify-content:flex-start; }
          .thumb{ width:80px; height:80px; }
          .title-text{ font-size:16px; -webkit-line-clamp:3; }

          .col-price, .col-qty, .col-action { text-align:left; width:auto; }
          .col-img::before,
          .col-title::before,
          .col-price::before,
          .col-qty::before,
          .col-action::before{
            content: attr(data-label);
            font-size:12px;
            color:#6b7280;
            margin-right:12px;
            min-width:90px;
            font-weight:600;
            text-transform:uppercase;
            letter-spacing:.4px;
          }

          .action-stack{ justify-content:flex-start; gap:8px; }
        }

        /* empty banner row */
        .empty-row td { padding: 18px 12px; }
        .empty-wrap { display:flex; align-items:center; gap:10px; justify-content:center; color:#6b7280; font-weight:600; }
        .empty-ic { opacity:.8; }
        .empty-text { font-size:14px; }
      `}</style>
    </>
  );
};

export default CartItem;
