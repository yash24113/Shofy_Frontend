'use client';
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";

// icons
import { Close, Minus, Plus } from "@/svg";

// redux actions
import { add_cart_product, quantityDecrement, remove_product } from "@/redux/features/cartSlice";
import { add_to_wishlist } from "@/redux/features/wishlist-slice";

/**
 * Props:
 * - product: Cart product object
 * - showToolbar?: boolean         // if true, renders an extra row with Add Another + Clear Cart
 * - onClearCart?: () => void      // handler for Clear Cart button (required if showToolbar)
 */
const CartItem = ({ product, showToolbar = false, onClearCart }) => {
  const { _id, id, image1, title, salesPrice, orderQuantity = 0 } = product || {};
  const router = useRouter();
  const dispatch = useDispatch();

  // --- normalize id so we always find the item in Redux, regardless of id/_id shape or type
  const key = String(_id ?? id ?? "");

  // live qty from Redux (default show 0 if not present)
  const { cart_products = [] } = useSelector((s) => s.cart) || {};
  const cartEntry =
    cart_products.find((p) => String(p?._id ?? p?.id ?? "") === key) || null;

  const qty =
    typeof cartEntry?.orderQuantity === "number"
      ? cartEntry.orderQuantity
      : (typeof orderQuantity === "number" ? orderQuantity : 0);

  const imageUrl = image1?.startsWith("http")
    ? image1
    : `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${image1}`;

  const slug = product?.slug || key;

  // handlers
  const inc = () => {
    // adds or increments; UI will re-read live qty from Redux
    dispatch(add_cart_product(product));
  };
  const dec = () => {
    if ((qty || 0) <= 0) return; // keep it from going negative in UI
    dispatch(quantityDecrement(product));
  };
  const removeAndWishlist = () => {
    dispatch(add_to_wishlist(product));
    dispatch(remove_product({ title, id: key }));
  };

  return (
    <>
      {/* product row */}
      <tr className="cart-row">
        {/* img */}
        <td className="tp-cart-img cart-cell cart-cell--img">
          <Link href={`/fabric/${slug}`} className="cart-img-link">
            {image1 && (
              <Image
                src={imageUrl}
                alt={title || "product img"}
                width={70}
                height={100}
                className="cart-img"
                priority={false}
              />
            )}
          </Link>
        </td>

        {/* title */}
        <td className="tp-cart-title cart-cell cart-cell--title">
          <Link href={`/fabric/${slug}`} className="cart-title">
            {title}
          </Link>
        </td>

        {/* price (line total) */}
        <td className="tp-cart-price cart-cell cart-cell--price">
          <span className="cart-price">${((salesPrice || 0) * (qty || 0)).toFixed(2)}</span>
        </td>

        {/* quantity (CENTERED) */}
        <td className="tp-cart-quantity cart-cell cart-cell--qty">
          <div className="tp-product-quantity cart-qty">
            <button
              onClick={dec}
              className={`tp-cart-minus cart-qty-btn ${qty <= 0 ? "is-disabled" : ""}`}
              aria-label="Decrease quantity"
              title="Decrease"
              type="button"
              disabled={qty <= 0}
            >
              <Minus />
            </button>

            {/* default shows 0 if not in cart yet; updates live from Redux */}
            <span className="cart-qty-value" aria-live="polite">{qty || 0}</span>

            <button
              onClick={inc}
              className="tp-cart-plus cart-qty-btn"
              aria-label="Increase quantity"
              title="Increase"
              type="button"
            >
              <Plus />
            </button>
          </div>
        </td>

        {/* action */}
        <td className="tp-cart-action cart-cell cart-cell--action">
          <button
            onClick={removeAndWishlist}
            className="tp-cart-action-btn cart-remove btn-pressable"
            title="Remove from cart and save to wishlist"
            type="button"
          >
            <Close />
            <span> Remove</span>
          </button>
        </td>
      </tr>

      {/* toolbar row (optional) */}
      {showToolbar && (
        <tr className="cart-toolbar-row">
          <td className="cart-toolbar-cell" colSpan={5}>
            <div className="cart-toolbar">
              <button
                type="button"
                className="btn-secondary btn-pressable"
                onClick={() => router.push("/shop")}
                title="Continue shopping"
              >
                Add Another Product
              </button>

              <button
                type="button"
                className="btn-outline btn-pressable"
                onClick={onClearCart}
                title="Remove all items from cart"
              >
                Clear Cart
              </button>
            </div>
          </td>
        </tr>
      )}

      {/* -------- INTERNAL CSS (scoped) -------- */}
      <style jsx>{`
        /* Row polish */
        .cart-row {
          border-bottom: 1px solid #eef0f3;
          transition: background-color 160ms ease, box-shadow 180ms ease;
        }
        .cart-row:hover { background: #fafbfc; }

        /* Cells */
        .cart-cell { padding: 14px 12px; vertical-align: middle; }

        /* Column widths */
        .cart-cell--img   { width: 110px; }
        .cart-cell--price { width: 160px; }
        .cart-cell--qty   { width: 220px; text-align: center; }
        .cart-cell--action{ width: 200px; text-align: right; }

        /* Image */
        .cart-img-link { display: inline-block; line-height: 0; }
        .cart-img {
          width: 70px; height: 100px; object-fit: cover;
          border-radius: 10px; background: #f3f5f8;
          box-shadow: 0 2px 10px rgba(0,0,0,0.06);
        }

        /* Title */
        .cart-title {
          display: inline-block; font-weight: 600; line-height: 1.3;
          color: #0f172a; text-decoration: none;
        }
        .cart-title:hover { text-decoration: underline; }

        /* Price */
        .cart-price { font-weight: 600; color: #0f172a; }

        /* Quantity (centered pill) */
        .cart-qty {
          display: inline-flex; align-items: center; justify-content: center;
          margin-inline: auto; border: 1px solid #e5e7eb; border-radius: 999px;
          padding: 2px; background: #fff; min-width: 124px; height: 44px;
        }
        .cart-qty-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 999px; border: none;
          background: transparent; cursor: pointer;
          transition: transform 120ms ease, background-color 120ms ease, opacity 120ms ease;
        }
        .cart-qty-btn:hover { background: #f3f4f6; }
        .cart-qty-btn:active { transform: translateY(1px); }
        .cart-qty-btn.is-disabled { opacity: 0.4; cursor: not-allowed; }
        .cart-qty-value {
          width: 52px; text-align: center; font-weight: 700; color: #0f172a;
          display: inline-block;
        }

        /* Toolbar */
        .cart-toolbar-row { border-bottom: 1px solid #eef0f3; }
        .cart-toolbar-cell { padding: 16px 12px; }
        .cart-toolbar {
          display: flex; gap: 12px; justify-content: flex-end;
        }

        /* Animated buttons */
        .btn-pressable {
          position: relative; overflow: hidden; transform: translateZ(0);
          transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
          border-radius: 12px; font-weight: 600; padding: 10px 16px; white-space: nowrap;
        }
        .btn-pressable:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(2,132,199,0.18); }
        .btn-pressable:active { transform: translateY(0); box-shadow: 0 3px 10px rgba(2,132,199,0.2); }
        .btn-pressable::after {
          content: ""; position: absolute; left: 50%; top: 50%; width: 0; height: 0;
          background: rgba(255,255,255,0.35); border-radius: 999px;
          transform: translate(-50%, -50%); opacity: 0; pointer-events: none;
        }
        .btn-pressable:active::after {
          width: 180%; height: 180%; opacity: 1;
          transition: width 280ms ease, height 280ms ease, opacity 380ms ease; opacity: 0;
        }

        .btn-secondary {
          color: #fff; border: none;
          background: linear-gradient(180deg, #2ea0ff 0%, #1670ff 100%);
        }
        .btn-secondary:hover {
          background: linear-gradient(180deg, #4eb0ff 0%, #2a7dff 100%);
        }

        .btn-outline {
          color: #374151; background: #fff; border: 1px solid #e5e7eb;
        }
        .btn-outline:hover { background: #f9fafb; }

        /* Responsive */
        @media (max-width: 640px) {
          .cart-cell { padding: 10px 8px; }
          .cart-cell--qty   { width: 180px; }
          .cart-cell--action{ width: 100%; text-align: left; }
          .cart-img { width: 56px; height: 80px; border-radius: 8px; }
          .cart-qty-btn { width: 34px; height: 34px; }
          .cart-qty-value { width: 44px; }
          .cart-qty { height: 40px; min-width: 112px; }
          .cart-toolbar { justify-content: flex-start; }
        }
      `}</style>
    </>
  );
};

export default CartItem;
