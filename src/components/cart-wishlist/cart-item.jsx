'use client';
import React, { useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch } from "react-redux";
// icons & actions
import { Close, Minus, Plus } from "@/svg";
import {
  add_cart_product,
  quantityDecrement,
  remove_product,
} from "@/redux/features/cartSlice";
import { add_to_wishlist } from "@/redux/features/wishlist-slice";

/* 🔎 add search */
import useGlobalSearch from "@/hooks/useGlobalSearch";
import { buildSearchPredicate } from "@/utils/searchMiddleware";

/* ---------- tiny global empty-banner manager (reused) ---------- */
function useEmptyBanner(listId: string, rowVisible: boolean, emptyText: string) {
  const rowRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // @ts-ignore
    window.__listVis = window.__listVis || {};
    // @ts-ignore
    const bucket = (window.__listVis[listId] = window.__listVis[listId] || { vis: 0, banner: null });

    const tbody = rowRef.current?.closest('tbody') as HTMLTableSectionElement | null;
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

    let prev = (rowRef.current as any).__wasVisible ?? false;
    if (rowVisible && !prev) bucket.vis += 1;
    if (!rowVisible && prev) bucket.vis -= 1;
    (rowRef.current as any).__wasVisible = rowVisible;

    if (prev === undefined) {
      if (rowVisible) bucket.vis += 1;
      (rowRef.current as any).__wasVisible = rowVisible;
    }

    const banner = bucket.banner;
    if (bucket.vis <= 0) {
      const b = ensureBannerExists();
      if (!b.isConnected) tbody.appendChild(b);
    } else if (banner && banner.isConnected) {
      banner.remove();
    }

    return () => {
      let was = (rowRef.current as any)?.__wasVisible;
      if (was) bucket.vis = Math.max(0, bucket.vis - 1);
      (rowRef.current as any).__wasVisible = false;
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

const CartItem = ({ product }) => {
  const dispatch = useDispatch();

  /* 🔎 global query */
  const { debounced: q } = useGlobalSearch();

  // normalize fields
  const {
    _id,
    id,
    slug,
    img,
    image,
    title = "Product",
    salesPrice = 0,
    price = 0,
    orderQuantity = 0,
    quantity: stockQuantity,
  } = product || {};

  const PID = _id || id;
  const href = `/fabric/${slug || PID || ""}`;
  const unit = typeof salesPrice === "number"
    ? salesPrice
    : (parseFloat(salesPrice) || price || 0);
  const lineTotal = (unit || 0) * (orderQuantity || 0);

  const rawImg = img || image || "";
  const imageUrl = rawImg?.startsWith("http")
    ? rawImg
    : rawImg
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${rawImg}`
    : "/images/placeholder-portrait.webp";

  // normalized payload so slice matches by id/_id
  const normalized = {
    ...product,
    _id: PID,
    id: PID,
    title,
    price: unit,
    quantity: typeof stockQuantity === "number" ? stockQuantity : (product?.quantity ?? 0),
    img: img || image || "",
    image: image || img || "",
  };

  const inc = () => dispatch(add_cart_product(normalized));
  const dec = () => dispatch(quantityDecrement({ _id: PID, id: PID }));
  const remove = () => {
    dispatch(add_to_wishlist(product));
    dispatch(remove_product({ _id: PID, id: PID, title }));
  };

  /* 🔎 decide row visibility */
  const rowVisible = useMemo(() => {
    const query = (q || '').trim();
    if (query.length < 2) return true;
    const fields = [
      () => title || '',
      () => slug || '',
      () => String(product?.design || ''),
      () => String(product?.color || ''),
    ];
    const pred = buildSearchPredicate(query, fields, { mode: 'AND', normalize: true });
    return pred(product);
  }, [q, title, slug, product]);

  // EMPTY banner manager (cart)
  const { rowRef } = useEmptyBanner('cart', !!rowVisible, 'No product found in cart');

  return (
    <>
      <tr className="cart-row" ref={rowRef} style={!rowVisible ? { display: 'none' } : undefined}>
        {/* image */}
        <td className="col-img">
          <Link href={href} className="thumb-wrap" aria-label={title}>
            <span className="thumb">
              <Image
                src={imageUrl}
                alt={title}
                width={96}
                height={96}
                className="thumb-img"
              />
            </span>
          </Link>
        </td>

        {/* title */}
        <td className="col-title">
          <Link href={href} className="title-link">
            <span className="title-text">{title}</span>
          </Link>
        </td>

        {/* price */}
        <td className="col-price">
          <span className="price">${lineTotal.toFixed(2)}</span>
        </td>

        {/* quantity */}
        <td className="col-qty">
          <div className="qty">
            <button type="button" className="qty-btn" onClick={dec} aria-label={`Decrease ${title}`}>
              <Minus />
            </button>
            <span className="qty-value" aria-live="polite" aria-label={`Quantity of ${title}`}>
              {orderQuantity}
            </span>
            <button type="button" className="qty-btn" onClick={inc} aria-label={`Increase ${title}`}>
              <Plus />
            </button>
          </div>
        </td>

        {/* action */}
        <td className="col-action">
          <button type="button" onClick={remove} className="btn-ghost-invert square" title="Remove item">
            <Close />
            <span>Remove</span>
          </button>
        </td>
      </tr>

      <style jsx>{`
        .cart-row :global(td){ vertical-align: middle; padding:16px 12px; }
        .cart-row { border-bottom:1px solid #e5e7eb; }

        .col-img   { width:120px; min-width:120px; }
        .col-title { max-width:620px; }
        .col-price { width:140px; white-space:nowrap; }
        .col-qty   { width:200px; }
        .col-action{ width:200px; text-align:right; }

        .thumb-wrap{ display:inline-block; }
        .thumb{ width:96px; height:96px; border-radius:12px; overflow:hidden; background:#f3f4f6; display:block; }
        .thumb-img{ width:100%; height:100%; object-fit:cover; display:block; }

        .title-link{ text-decoration:none; color:#0b1220; }
        .title-text{ display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; overflow:hidden; word-break:break-word; font-weight:700; font-size:18px; line-height:1.35; color:#0b1220; }

        .price{ font-weight:700; font-size:16px; color:#0b1220; }

        .qty{ display:inline-flex; align-items:center; gap:14px; border:1px solid #e5e7eb; border-radius:999px; background:#fff; padding:8px 14px; }
        .qty-btn{ display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:999px; border:0; background:#f3f4f6; cursor:pointer; transition:background .15s ease, transform .04s ease; }
        .qty-btn:hover{ background:#e5e7eb; }
        .qty-btn:active{ transform:scale(.98); }
        .qty-value{ min-width:28px; text-align:center; font-weight:700; font-size:16px; color:#0b1220; line-height:1; letter-spacing:.2px; }

        .btn-ghost-invert.square { --navy: #0b1620; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 22px; min-height: 44px; background: var(--navy); color: #fff; font-weight: 600; font-size: 15px; line-height: 1; border: 1px solid var(--navy); border-radius: 0; cursor: pointer; user-select: none; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25); transition: background 180ms ease, color 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 120ms ease; }
        .btn-ghost-invert.square:hover { background: #fff; color: var(--navy); border-color: var(--navy); box-shadow: 0 0 0 1px var(--navy) inset, 0 8px 20px rgba(0,0,0,.12); transform: translateY(-1px); }
        .btn-ghost-invert.square:active { transform: translateY(0); background: #f8fafc; color: var(--navy); box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15); }
        .btn-ghost-invert.square:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(11, 22, 32, 0.35); }

        @media (max-width:992px){ .col-title{ max-width:420px; } .col-action{ width:160px; } }
        @media (max-width:640px){
          .cart-row :global(td){ padding:12px 8px; }
          .col-img{ width:100px; min-width:100px; }
          .thumb{ width:84px; height:84px; }
          .title-text{ font-size:16px; -webkit-line-clamp:3; }
          .col-price{ width:110px; }
          .col-qty{ width:170px; }
          .qty{ padding:6px 10px; gap:10px; }
          .qty-btn{ width:28px; height:28px; }
          .qty-value{ min-width:24px; font-size:15px; }
          .col-action{ text-align:left; width:auto; }
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
