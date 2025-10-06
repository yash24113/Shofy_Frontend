'use client';
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { Close, Minus, Plus } from "@/svg";
import {
  add_cart_product,
  quantityDecrement,
  remove_product,
} from "@/redux/features/cartSlice";
import { add_to_wishlist } from "@/redux/features/wishlist-slice";

const CartItem = ({ product }) => {
  const dispatch = useDispatch();

  // Normalize fields so updates always match by id/_id
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
  const unit = typeof salesPrice === "number"
    ? salesPrice
    : (parseFloat(salesPrice) || price || 0);

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

  const rawImg = normalized.img || normalized.image || "";
  const imageUrl = rawImg?.startsWith("http")
    ? rawImg
    : rawImg
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${rawImg}`
    : "/images/placeholder-portrait.webp";

  const href = `/fabric/${slug || PID || ""}`;

  // Handlers (always dispatch normalized id)
  const handleInc = () => dispatch(add_cart_product(normalized));
  const handleDec = () => dispatch(quantityDecrement({ _id: PID, id: PID }));
  const handleRemove = () => {
    dispatch(add_to_wishlist(product));
    dispatch(remove_product({ _id: PID, id: PID, title }));
  };

  const lineTotal = (unit || 0) * (orderQuantity || 0);

  return (
    <>
      <tr className="cart-row">
        {/* Product (thumb + title stacked horizontally) */}
        <td className="col-product">
          <Link href={href} className="product-link">
            <span className="thumb">
              <Image
                src={imageUrl}
                alt={title}
                width={96}
                height={96}
                className="thumb-img"
              />
            </span>
            <span className="title">{title}</span>
          </Link>
        </td>

        {/* Price (line total) */}
        <td className="col-price">
          <span className="price">${lineTotal.toFixed(2)}</span>
        </td>

        {/* Quantity pill */}
        <td className="col-qty">
          <div className="qty">
            <button
              type="button"
              className="qty-btn minus"
              onClick={handleDec}
              aria-label={`Decrease quantity of ${title}`}
            >
              <Minus />
            </button>
            <input
              className="qty-input"
              type="text"
              value={orderQuantity}
              readOnly
              aria-label={`Quantity of ${title}`}
            />
            <button
              type="button"
              className="qty-btn plus"
              onClick={handleInc}
              aria-label={`Increase quantity of ${title}`}
            >
              <Plus />
            </button>
          </div>
        </td>

        {/* Remove button */}
        <td className="col-action">
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

      {/* Styles scoped to this row */}
      <style jsx>{`
        /* Row + cells */
        .cart-row :global(td) {
          vertical-align: middle;
          padding: 18px 12px;
        }
        .cart-row {
          border-bottom: 1px solid #e5e7eb;
        }

        /* Columns width/align to match header: Product | Price | Quantity | Action */
        .col-product { width: 55%; min-width: 320px; }
        .col-price   { width: 15%; min-width: 120px; white-space: nowrap; }
        .col-qty     { width: 15%; min-width: 180px; }
        .col-action  { width: 15%; min-width: 180px; text-align: right; }

        /* Product cell */
        .product-link {
          display: inline-flex;
          align-items: center;
          gap: 16px;
          text-decoration: none;
          color: #0b1220;
        }
        .thumb {
          width: 96px;
          height: 96px;
          border-radius: 6px;
          overflow: hidden;
          background: #f3f4f6;
          flex: 0 0 96px;
        }
        .thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .title {
          font-weight: 600;
          font-size: 16px;
          line-height: 1.35;
          color: #0b1220;
        }

        /* Price */
        .price {
          display: inline-block;
          font-weight: 700;
          font-size: 16px;
          color: #0b1220;
        }

        /* Quantity pill */
        .qty {
          display: inline-flex;
          align-items: center;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          padding: 6px 10px;
          gap: 10px;
          background: #fff;
        }
        .qty-btn {
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
        .qty-btn:hover { background: #e5e7eb; }
        .qty-btn:active { transform: scale(0.98); }
        .qty-input {
          width: 44px;
          text-align: center;
          border: 0;
          outline: none;
          font-weight: 600;
          background: transparent;
          font-size: 15px;
          padding: 0 2px;
        }

        /* Remove button (matches your screenshot) */
        .btn-ghost-invert {
          --navy: #0b1620;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-height: 46px;
          padding: 12px 18px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          user-select: none;
          background: var(--navy);
          color: #fff;
          border: 1px solid var(--navy);
          box-shadow: 0 12px 28px rgba(0,0,0,.12);
          transition: background .18s ease, color .18s ease,
                      border-color .18s ease, box-shadow .18s ease,
                      transform .06s ease;
        }
        .btn-ghost-invert:hover {
          background: #fff;
          color: var(--navy);
          border-color: var(--navy);
          box-shadow: 0 0 0 1px var(--navy) inset, 0 12px 28px rgba(0,0,0,.12);
          transform: translateY(-1px);
        }
        .btn-ghost-invert:active { transform: translateY(0); }

        /* Responsive tweaks */
        @media (max-width: 992px) {
          .col-product { width: 50%; min-width: 260px; }
          .col-action { min-width: 160px; }
        }
        @media (max-width: 640px) {
          .cart-row :global(td) { padding: 14px 8px; }
          .thumb { width: 84px; height: 84px; flex-basis: 84px; }
          .title { font-size: 15px; }
          .qty { padding: 5px 8px; gap: 8px; }
          .qty-btn { width: 26px; height: 26px; }
          .qty-input { width: 38px; font-size: 14px; }
          .col-action { text-align: left; }
          .btn-ghost-invert { min-height: 42px; padding: 10px 16px; }
        }
      `}</style>
    </>
  );
};

export default CartItem;
