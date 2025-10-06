'use client';
import React from "react";
import Image from "next/image";
import { useDispatch } from "react-redux";
import Link from "next/link";
// internal
import { Close, Minus, Plus } from "@/svg";
import { add_cart_product, quantityDecrement, remove_product } from "@/redux/features/cartSlice";
import { add_to_wishlist } from "@/redux/features/wishlist-slice";

const CartItem = ({ product }) => {
  const { _id, img, title = "Product", salesPrice = 0, orderQuantity = 0, slug } = product || {};
  const dispatch = useDispatch();

  const pid = _id;
  const href = `/fabric/${slug || pid || ""}`;

  // robust image url
  const imageUrl = img?.startsWith("http")
    ? img
    : img
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${img}`
    : "/images/placeholder-portrait.webp";

  // qty handlers
  const handleAddProduct = (prd) => dispatch(add_cart_product({ ...prd, _id: pid, id: pid }));
  const handleDecrement   = (prd) => dispatch(quantityDecrement({ _id: pid, id: pid }));

  // remove → save to wishlist first
  const handleRemovePrd = (prd) => {
    dispatch(add_to_wishlist(product));
    dispatch(remove_product({ _id: pid, id: pid, title }));
  };

  return (
    <>
      <tr className="cart-row">
        {/* image */}
        <td className="tp-cart-img">
          <Link href={href} className="thumb-wrap" aria-label={title}>
            {/* fixed box to prevent layout shift */}
            <span className="thumb">
              <Image
                src={imageUrl}
                alt={title}
                width={96}
                height={96}
                className="thumb-img"
                priority={false}
              />
            </span>
          </Link>
        </td>

        {/* title */}
        <td className="tp-cart-title">
          <Link href={href} className="title-link">
            <span className="title-text">{title}</span>
          </Link>
        </td>

        {/* price (line total) */}
        <td className="tp-cart-price">
          <span className="price">${((salesPrice || 0) * (orderQuantity || 0)).toFixed(2)}</span>
        </td>

        {/* quantity */}
        <td className="tp-cart-quantity">
          <div className="qty">
            <button onClick={() => handleDecrement(product)} className="qty-btn" type="button" aria-label={`Decrease ${title}`}>
              <Minus />
            </button>
            <input className="qty-input" type="text" value={orderQuantity} readOnly aria-label={`Quantity of ${title}`} />
            <button onClick={() => handleAddProduct(product)} className="qty-btn" type="button" aria-label={`Increase ${title}`}>
              <Plus />
            </button>
          </div>
        </td>

        {/* action */}
        <td className="tp-cart-action">
          <button
            onClick={() => handleRemovePrd({ title, id: pid })}
            className="btn-ghost-invert square"
            title="Remove from cart and save to wishlist"
            type="button"
          >
            <Close />
            <span> Remove</span>
          </button>
        </td>
      </tr>

      {/* scoped styles */}
      <style jsx>{`
        /* Row + cell spacing */
        .cart-row :global(td) {
          vertical-align: middle;
          padding: 16px 12px;
        }
        .cart-row { border-bottom: 1px solid #e5e7eb; }

        /* --- Image column --- */
        .tp-cart-img { width: 120px; min-width: 120px; }
        .thumb-wrap { display: inline-block; }
        .thumb {
          display: block;
          width: 96px;
          height: 96px;
          border-radius: 8px;
          overflow: hidden;
          background: #f3f4f6;
        }
        .thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;  /* keep aspect – cover box */
          display: block;
        }

        /* --- Title column --- */
        .tp-cart-title { max-width: 620px; }
        .title-link {
          display: inline-block;
          text-decoration: none;
          color: #0b1220;
        }
        .title-text {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2; /* clamp to 2 lines */
          overflow: hidden;
          word-break: break-word;
          font-weight: 600;
          font-size: 16px;
          line-height: 1.35;
          color: #0b1220;
        }

        /* --- Price column --- */
        .tp-cart-price { width: 140px; text-wrap: nowrap; }
        .price {
          font-weight: 700;
          font-size: 16px;
          color: #0b1220;
        }

        /* --- Quantity column --- */
        .tp-cart-quantity { width: 200px; }
        .qty {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          background: #fff;
          padding: 6px 10px;
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
          transition: background .15s ease, transform .04s ease;
        }
        .qty-btn:hover { background: #e5e7eb; }
        .qty-btn:active { transform: scale(0.98); }
        .qty-input {
          width: 44px;
          text-align: center;
          border: 0;
          background: transparent;
          outline: none;
          font-weight: 600;
          font-size: 15px;
        }

        /* --- Action column --- */
        .tp-cart-action { width: 200px; text-align: right; }
        .btn-ghost-invert {
          --navy: #0b1620;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          padding: 10px 18px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 15px;
          background: var(--navy);
          color: #fff;
          border: 1px solid var(--navy);
          box-shadow: 0 12px 28px rgba(0,0,0,.12);
          cursor: pointer;
          transition: background .18s ease, color .18s ease, transform .06s ease;
        }
        .btn-ghost-invert:hover {
          background: #fff;
          color: var(--navy);
          transform: translateY(-1px);
        }

        /* --- Responsive tweaks --- */
        @media (max-width: 992px) {
          .tp-cart-title { max-width: 420px; }
          .tp-cart-action { width: 160px; }
        }
        @media (max-width: 640px) {
          .cart-row :global(td) { padding: 12px 8px; }
          .tp-cart-img { width: 100px; min-width: 100px; }
          .thumb { width: 84px; height: 84px; }
          .title-text { font-size: 15px; -webkit-line-clamp: 3; } /* allow 3 lines on small screens */
          .tp-cart-price { width: 110px; }
          .tp-cart-quantity { width: 170px; }
          .qty { padding: 5px 8px; gap: 8px; }
          .qty-btn { width: 26px; height: 26px; }
          .qty-input { width: 38px; font-size: 14px; }
          .tp-cart-action { text-align: left; width: auto; }
        }
      `}</style>
    </>
  );
};

export default CartItem;
