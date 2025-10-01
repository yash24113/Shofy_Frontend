'use client';
import React from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
// internal
import { Close, Minus, Plus } from "@/svg";
import { add_cart_product, quantityDecrement, remove_product } from "@/redux/features/cartSlice";
import { add_to_wishlist } from "@/redux/features/wishlist-slice";

const CartItem = ({ product }) => {
  const { _id, image1, title, salesPrice, orderQuantity = 0 } = product || {};
  const dispatch = useDispatch();

  // ✅ Always read the *live* quantity from Redux (so + updates UI immediately)
  const { cart_products = [] } = useSelector((s) => s.cart) || {};
  const cartEntry = cart_products.find((p) => p?._id === _id);
  const qty = typeof cartEntry?.orderQuantity === "number" ? cartEntry.orderQuantity : orderQuantity || 0;

  const imageUrl = image1?.startsWith("http")
    ? image1
    : `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${image1}`;

  const slug = product?.slug || _id;

  // +1
  const handleAddProduct = () => {
    dispatch(add_cart_product(product));
  };

  // -1 (guard so it never goes below 0)
  const handleDecrement = () => {
    if (qty <= 0) return;
    dispatch(quantityDecrement(product));
  };

  // Remove from cart -> Save to wishlist first
  const handleRemovePrd = () => {
    dispatch(add_to_wishlist(product));            // save for later
    dispatch(remove_product({ title, id: _id }));  // then remove from cart
  };

  return (
    <>
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
          <span className="cart-price">
            ${((salesPrice || 0) * qty).toFixed(2)}
          </span>
        </td>

        {/* quantity (CENTERED) */}
        <td className="tp-cart-quantity cart-cell cart-cell--qty">
          <div className="tp-product-quantity cart-qty">
            <button
              onClick={handleDecrement}
              className={`tp-cart-minus cart-qty-btn ${qty <= 0 ? "is-disabled" : ""}`}
              aria-label="Decrease quantity"
              title="Decrease"
              type="button"
              disabled={qty <= 0}
            >
              <Minus />
            </button>

            <input
              className="tp-cart-input cart-qty-input"
              type="text"
              value={qty}
              readOnly
              aria-label="Quantity"
            />

            <button
              onClick={handleAddProduct}
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
            onClick={handleRemovePrd}
            className="tp-cart-action-btn cart-remove btn-pressable"
            title="Remove from cart and save to wishlist"
            type="button"
          >
            <Close />
            <span> Remove</span>
          </button>
        </td>
      </tr>

      {/* -------- INTERNAL CSS (scoped) -------- */}
      <style jsx>{`
        /* Row polish */
        .cart-row {
          border-bottom: 1px solid #eef0f3;
          transition: background-color 160ms ease, box-shadow 180ms ease;
        }
        .cart-row:hover {
          background: #fafbfc;
        }

        /* Cells */
        .cart-cell {
          padding: 14px 12px;
          vertical-align: middle;
        }

        /* Consistent column widths like your screenshot */
        .cart-cell--img   { width: 110px; }
        .cart-cell--price { width: 160px; }
        .cart-cell--qty   { width: 220px; text-align: center; }
        .cart-cell--action{ width: 160px; text-align: right; }

        /* Image */
        .cart-img-link { display: inline-block; line-height: 0; }
        .cart-img {
          width: 70px; height: 100px; object-fit: cover;
          border-radius: 10px; background: #f3f5f8;
          box-shadow: 0 2px 10px rgba(0,0,0,0.06);
        }

        /* Title */
        .cart-title {
          display: inline-block;
          font-weight: 600;
          line-height: 1.3;
          color: #0f172a; /* slate-900 */
          text-decoration: none;
        }
        .cart-title:hover { text-decoration: underline; }

        /* Price */
        .cart-price { font-weight: 600; color: #0f172a; }

        /* Quantity group (CENTER it) */
        .cart-qty {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-inline: auto;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          padding: 2px;
          background: #fff;
          min-width: 124px;
          height: 44px;
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

        .cart-qty-input {
          width: 52px; text-align: center; font-weight: 600;
          border: 0; background: transparent; outline: none;
        }

        /* Remove button (animated) */
        .btn-pressable {
          position: relative; overflow: hidden; transform: translateZ(0);
          transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
          border-radius: 12px;
        }
        .btn-pressable:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(2,132,199,0.18); }
        .btn-pressable:active { transform: translateY(0); box-shadow: 0 3px 10px rgba(2,132,199,0.2); }
        .btn-pressable::after {
          content: ""; position: absolute; left: 50%; top: 50%;
          width: 0; height: 0; background: rgba(255,255,255,0.35);
          border-radius: 999px; transform: translate(-50%,-50%); opacity: 0; pointer-events: none;
        }
        .btn-pressable:active::after {
          width: 180%; height: 180%; opacity: 1;
          transition: width 280ms ease, height 280ms ease, opacity 380ms ease; opacity: 0;
        }

        .cart-remove {
          color: #6b7280; border: 1px solid #e5e7eb; background: #fff;
          padding: 12px 18px; border-radius: 12px;
        }
        .cart-remove:hover { background: #f9fafb; color: #374151; }

        /* Responsive */
        @media (max-width: 640px) {
          .cart-cell { padding: 10px 8px; }
          .cart-cell--qty   { width: 180px; }
          .cart-cell--action{ width: 130px; text-align: right; }

          .cart-img { width: 56px; height: 80px; border-radius: 8px; }
          .cart-qty-btn { width: 34px; height: 34px; }
          .cart-qty-input { width: 44px; }
          .cart-qty { height: 40px; min-width: 112px; }
        }
      `}</style>
    </>
  );
};

export default CartItem;
