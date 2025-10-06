'use client';
import React, { useState } from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
// internal
import { Close, Minus, Plus } from "@/svg";
import { add_cart_product, quantityDecrement } from "@/redux/features/cartSlice";
import { remove_wishlist_product } from "@/redux/features/wishlist-slice";

const WishlistItem = ({ product }) => {
  const { _id, img, title, salesPrice } = product || {};
  const { cart_products } = useSelector((state) => state.cart);
  const isAddToCart = cart_products?.find?.((item) => item?._id === _id);
  const dispatch = useDispatch();
  const [moving, setMoving] = useState(false);

  const imageUrl = img?.startsWith("http")
    ? img
    : `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${img}`;

  const slug = product?.slug || _id;

  const handleAddProduct = async (prd) => {
    try {
      setMoving(true);
      dispatch(add_cart_product(prd));
      dispatch(remove_wishlist_product({ title, id: _id }));
    } finally {
      setTimeout(() => setMoving(false), 250);
    }
  };

  const handleRemovePrd = (prd) => {
    dispatch(remove_wishlist_product(prd));
  };

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
          <Link href={`/fabric/${slug}`} className="wishlist-title">
            {title}
          </Link>
        </td>

        {/* price */}
        <td className="tp-cart-price wishlist-cell">
          <span className="wishlist-price">${(salesPrice || 0).toFixed(2)}</span>
        </td>

        {/* add to cart */}
        <td className="tp-cart-add-to-cart wishlist-cell wishlist-cell-center">
          <button
            onClick={() => handleAddProduct(product)}
            type="button"
            className={`btn-add-product ${moving ? "is-loading" : ""}`}
            aria-busy={moving ? "true" : "false"}
            title="Move to Cart"
          >
            {moving ? "Moving…" : "Move to Cart"}
          </button>
        </td>

        {/* remove */}
        <td className="tp-cart-action wishlist-cell">
          <button
            onClick={() => handleRemovePrd({ title, id: _id })}
            className="tp-cart-action-btn wishlist-remove btn-pressable"
            type="button"
            title="Remove from wishlist"
          >
            <Close />
            <span> Remove</span>
          </button>
        </td>
      </tr>

      {/* -------- INTERNAL CSS (scoped) -------- */}
      <style jsx>{`
        .wishlist-row {
          border-bottom: 1px solid #eef0f3;
          transition: background-color 160ms ease, box-shadow 180ms ease;
        }
        .wishlist-row:hover {
          background: #fafbfc;
        }

        .wishlist-cell {
          padding: 14px 12px;
          vertical-align: middle;
        }

        .wishlist-cell-center {
          text-align: center;
        }

        .wishlist-img-link {
          display: inline-block;
          line-height: 0;
        }
        .wishlist-img {
          width: 70px;
          height: 100px;
          object-fit: cover;
          border-radius: 10px;
          background: #f3f5f8;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
        }

        .wishlist-title {
          display: inline-block;
          font-weight: 600;
          line-height: 1.3;
          color: #0f172a;
          text-decoration: none;
        }
        .wishlist-title:hover {
          text-decoration: underline;
        }

        .wishlist-price {
          font-weight: 600;
          color: #0f172a;
        }

        /* Pressable base */
        .btn-pressable {
          position: relative;
          overflow: hidden;
          transform: translateZ(0);
          transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
          border-radius: 10px;
        }
        .btn-pressable:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(128, 0, 0, 0.25);
        }
        .btn-pressable:active {
          transform: translateY(0);
          box-shadow: 0 3px 10px rgba(128, 0, 0, 0.3);
        }

        /* NEW: Add Product button (black base → maroon hover) */
        .btn-add-product {
          --btn-radius: 10px;
          --btn-height: 48px;
          --btn-padding-x: 22px;

          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 220px;
          height: var(--btn-height);
          padding: 0 var(--btn-padding-x);
          border-radius: var(--btn-radius);
          border: none;
          outline: none;

          background: #0b0b0e; /* base black */
          color: #ffffff;
          font-weight: 600;
          letter-spacing: 0.2px;

          transition: background-color 180ms ease, transform 120ms ease,
            box-shadow 180ms ease, opacity 180ms ease;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
          cursor: pointer;
        }

        .btn-add-product:hover {
          background: #800000; /* maroon hover */
          box-shadow: 0 10px 28px rgba(128, 0, 0, 0.35);
          transform: translateY(-1px);
        }

        .btn-add-product:active {
          background: #5e0000; /* darker maroon */
          transform: translateY(0);
          box-shadow: 0 6px 16px rgba(94, 0, 0, 0.3);
        }

        .btn-add-product:focus-visible {
          outline: 3px solid rgba(128, 0, 0, 0.45);
          outline-offset: 2px;
        }

        .btn-add-product.is-loading {
          pointer-events: none;
          opacity: 0.9;
        }

        /* Remove button */
        .wishlist-remove {
          color: #6b7280;
          border: 1px solid #e5e7eb;
          background: #fff;
          padding: 10px 14px;
          border-radius: 8px;
          transition: background 160ms ease, color 160ms ease;
        }

        .wishlist-remove:hover {
          background: #800000;
          color: #fff;
          border-color: #800000;
        }

        @media (max-width: 640px) {
          .wishlist-cell {
            padding: 10px 8px;
          }
          .wishlist-img {
            width: 56px;
            height: 80px;
            border-radius: 8px;
          }
          .btn-add-product {
            min-width: 180px;
            height: 44px;
            --btn-radius: 8px;
          }
        }
      `}</style>
    </>
  );
};

export default WishlistItem;
