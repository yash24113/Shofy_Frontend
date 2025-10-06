'use client';
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch } from "react-redux";
// internal
import { Close, Minus, Plus } from "@/svg";
import {
  add_cart_product,
  quantityDecrement,
  remove_product,
} from "@/redux/features/cartSlice";
import { add_to_wishlist } from "@/redux/features/wishlist-slice";

const CartItem = ({ product }) => {
  const dispatch = useDispatch();

  // Normalize fields from cart row (already in store)
  const {
    _id,
    id,
    slug,
    img,
    image,          // in case row carries "image" instead of "img"
    title = "Product",
    salesPrice = 0,
    price = 0,
    orderQuantity = 0,
    quantity: stockQuantity, // optional stock field
  } = product || {};

  // Always build a consistent identity & minimal item payload
  const PID = _id || id;
  const normalizedForUpdate = {
    ...product,
    _id: PID,
    id: PID,
    title,
    price: typeof salesPrice === "number" ? salesPrice : (parseFloat(salesPrice) || price || 0),
    quantity: typeof stockQuantity === "number" ? stockQuantity : (product?.quantity ?? 0),
    image: image || img || "",
    img: img || image || "",
  };

  // Robust image URL
  const rawImg = normalizedForUpdate.img || normalizedForUpdate.image || "";
  const imageUrl = rawImg?.startsWith("http")
    ? rawImg
    : rawImg
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${rawImg}`
    : "/images/placeholder-portrait.webp";

  const href = `/fabric/${slug || PID || ""}`;

  // Handlers (ensure we always dispatch the normalized payload)
  const handleInc = () => dispatch(add_cart_product(normalizedForUpdate));
  const handleDec = () => dispatch(quantityDecrement({ _id: PID, id: PID }));
  const handleRemove = () => {
    dispatch(add_to_wishlist(product));               // optional: save to wishlist first
    dispatch(remove_product({ _id: PID, id: PID, title }));
  };

  // Unit price to show = salesPrice or price
  const unit = typeof salesPrice === "number" ? salesPrice : (parseFloat(salesPrice) || price || 0);
  const lineTotal = (unit || 0) * (orderQuantity || 0);

  return (
    <>
      <tr className="cart-row">
        {/* Product cell */}
        <td className="tp-cart-product">
          <Link href={href} className="tp-cart-product-link">
            <span className="tp-cart-thumb">
              <Image
                src={imageUrl}
                alt={title}
                width={96}
                height={96}
                className="tp-cart-thumb-img"
                priority={false}
              />
            </span>
            <span className="tp-cart-title-text">{title}</span>
          </Link>
        </td>

        {/* Price (line total) */}
        <td className="tp-cart-price">
          <span className="tp-cart-price-text">
            ${lineTotal.toFixed(2)}
          </span>
          {unit ? (
            <span className="tp-cart-unit">(${unit.toFixed(2)} each)</span>
          ) : null}
        </td>

        {/* Quantity */}
        <td className="tp-cart-qty">
          <div className="tp-qty">
            <button
              type="button"
              className="tp-qty-btn minus"
              onClick={handleDec}
              aria-label={`Decrease quantity of ${title}`}
            >
              <Minus />
            </button>
            <input
              className="tp-qty-input"
              type="text"
              value={orderQuantity}
              readOnly
              aria-label={`Quantity of ${title}`}
            />
            <button
              type="button"
              className="tp-qty-btn plus"
              onClick={handleInc}
              aria-label={`Increase quantity of ${title}`}
            >
              <Plus />
            </button>
          </div>
        </td>

        {/* Remove */}
        <td className="tp-cart-action">
          <button
            type="button"
            onClick={handleRemove}
            className="btn-ghost-invert square"
            title="Remove from cart and save to wishlist"
          >
            <Close />
            <span>Remove</span>
          </button>
        </td>
      </tr>

      {/* Styles */}
      <style jsx>{`
        /* Row spacing & divider */
        .cart-row { border-bottom: 1px solid #e5e7eb; }
        .cart-row :global(td) { vertical-align: middle; padding: 18px 12px; }

        /* Product cell: thumb + title inline */
        .tp-cart-product { min-width: 320px; }
        .tp-cart-product-link {
          display: inline-flex;
          align-items: center;
          gap: 16px;
          text-decoration: none;
          color: #0b1220;
        }
        .tp-cart-thumb {
          width: 96px;
          height: 96px;
          border-radius: 6px;
          overflow: hidden;
          background: #f3f4f6;
          flex: 0 0 96px;
        }
        .tp-cart-thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .tp-cart-title-text {
          font-weight: 600;
          font-size: 16px;
          line-height: 1.35;
          color: #0b1220;
        }

        /* Price */
        .tp-cart-price { white-space: nowrap; min-width: 140px; }
        .tp-cart-price-text {
          font-weight: 700;
          font-size: 16px;
          color: #0b1220;
          display: block;
        }
        .tp-cart-unit {
          display: block;
          font-size: 12px;
          color: #6b7280;
          margin-top: 2px;
        }

        /* Quantity control */
        .tp-cart-qty { min-width: 190px; }
        .tp-qty {
          display: inline-flex;
          align-items: center;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          padding: 6px 10px;
          gap: 10px;
          background: #fff;
        }
        .tp-qty-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          border: 0;
          background: #f3f4f6;
          cursor: pointer;
          transition: background .15s ease, transform .04s ease, box-shadow .15s ease;
        }
        .tp-qty-btn:hover { background: #e5e7eb; }
        .tp-qty-btn:active { transform: scale(0.98); }
        .tp-qty-input {
          width: 44px;
          text-align: center;
          border: 0;
          outline: none;
          font-weight: 600;
          background: transparent;
          font-size: 15px;
          padding: 0 2px;
        }

        /* Remove button */
        .tp-cart-action { min-width: 200px; text-align: right; }
        .btn-ghost-invert {
          --navy: #0b1620;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-height: 46px;
          padding: 12px 18px;
          border-radius: 8px;     /* rounded for nicer look */
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          user-select: none;
          background: var(--navy);
          color: #fff;
          border: 1px solid var(--navy);
          box-shadow: 0 8px 24px rgba(0,0,0,.12);
          transition: background .18s ease, color .18s ease,
                      border-color .18s ease, box-shadow .18s ease,
                      transform .06s ease;
        }
        .btn-ghost-invert:hover {
          background: #fff;
          color: var(--navy);
          border-color: var(--navy);
          box-shadow: 0 0 0 1px var(--navy) inset, 0 10px 26px rgba(0,0,0,.12);
          transform: translateY(-1px);
        }
        .btn-ghost-invert:active { transform: translateY(0); }

        /* Responsive */
        @media (max-width: 992px) {
          .tp-cart-action { min-width: 160px; }
          .tp-cart-product { min-width: 280px; }
          .tp-cart-thumb { width: 84px; height: 84px; flex-basis: 84px; }
        }
        @media (max-width: 640px) {
          .cart-row :global(td) { padding: 14px 8px; }
          .tp-cart-product { min-width: auto; }
          .tp-cart-title-text { font-size: 15px; }
          .tp-qty { padding: 5px 8px; gap: 8px; }
          .tp-qty-btn { width: 26px; height: 26px; }
          .tp-qty-input { width: 38px; font-size: 14px; }
          .tp-cart-action { text-align: left; }
          .btn-ghost-invert { min-height: 42px; padding: 10px 16px; }
        }
      `}</style>
    </>
  );
};

export default CartItem;
