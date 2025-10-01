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
  const { _id, image1, title, salesPrice } = product || {};
  const { cart_products } = useSelector((state) => state.cart);
  const isAddToCart = cart_products?.find?.((item) => item?._id === _id);
  const dispatch = useDispatch();
  const [moving, setMoving] = useState(false);

  const imageUrl = image1?.startsWith("http")
    ? image1
    : `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${image1}`;

  const slug = product?.slug || _id;

  // add product (and remove from wishlist)
  const handleAddProduct = async (prd) => {
    try {
      setMoving(true);
      dispatch(add_cart_product(prd));
      dispatch(remove_wishlist_product({ title, id: _id }));
    } finally {
      setTimeout(() => setMoving(false), 250);
    }
  };

  const handleDecrement = (prd) => {
    dispatch(quantityDecrement(prd));
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
            {image1 && (
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

        {/* quantity */}
        <td className="tp-cart-quantity wishlist-cell">
          <div className="tp-product-quantity wishlist-qty">
            <button
              onClick={() => handleDecrement(product)}
              className="tp-cart-minus wishlist-qty-btn"
              aria-label="Decrease quantity"
              title="Decrease"
              type="button"
            >
              <Minus />
            </button>

            <input
              className="tp-cart-input wishlist-qty-input"
              type="text"
              value={isAddToCart ? isAddToCart?.orderQuantity : 0}
              readOnly
              aria-label="Quantity in cart"
            />

            <button
              onClick={() => handleAddProduct(product)}
              className="tp-cart-plus wishlist-qty-btn"
              aria-label="Increase quantity"
              title="Increase"
              type="button"
            >
              <Plus />
            </button>
          </div>
        </td>

        {/* add to cart */}
        <td className="tp-cart-add-to-cart wishlist-cell">
          <button
            onClick={() => handleAddProduct(product)}
            type="button"
            className={`tp-btn tp-btn-2 tp-btn-blue btn-pressable ${moving ? "btn-loading" : ""}`}
            aria-busy={moving ? "true" : "false"}
            title="Move to Cart"
          >
            {moving ? "Moving…" : "Moving To Cart"}
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
        /* Row polish */
        .wishlist-row {
          border-bottom: 1px solid #eef0f3;
          transition: background-color 160ms ease, box-shadow 180ms ease;
        }
        .wishlist-row:hover {
          background: #fafbfc;
        }

        /* Cells */
        .wishlist-cell {
          padding: 14px 12px;
          vertical-align: middle;
        }

        /* Image */
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

        /* Title */
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

        /* Price */
        .wishlist-price {
          font-weight: 600;
          color: #0f172a;
        }

        /* Quantity group */
        .wishlist-qty {
          display: inline-flex;
          align-items: center;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          padding: 2px;
          background: #fff;
        }
        .wishlist-qty-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 999px;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: transform 120ms ease, background-color 120ms ease;
        }
        .wishlist-qty-btn:hover {
          background: #f3f4f6;
        }
        .wishlist-qty-btn:active {
          transform: translateY(1px);
        }
        .wishlist-qty-input {
          width: 52px;
          text-align: center;
          font-weight: 600;
          border: 0;
          background: transparent;
          outline: none;
        }

        /* Animated buttons */
        .btn-pressable {
          position: relative;
          overflow: hidden;
          transform: translateZ(0);
          transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
          border-radius: 10px;
        }
        .btn-pressable:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(2, 132, 199, 0.18);
        }
        .btn-pressable:active {
          transform: translateY(0);
          box-shadow: 0 3px 10px rgba(2, 132, 199, 0.2);
        }
        .btn-pressable::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 0;
          height: 0;
          background: rgba(255, 255, 255, 0.35);
          border-radius: 999px;
          transform: translate(-50%, -50%);
          opacity: 0;
          pointer-events: none;
        }
        .btn-pressable:active::after {
          width: 180%;
          height: 180%;
          opacity: 1;
          transition: width 280ms ease, height 280ms ease, opacity 380ms ease;
          opacity: 0;
        }
        .btn-loading {
          pointer-events: none;
          opacity: 0.85;
        }

        /* Optional richer blue for your existing class */
        :global(.tp-btn.tp-btn-blue) {
          background: linear-gradient(180deg, #2ea0ff 0%, #1670ff 100%);
          color: #fff;
          border: none;
        }
        :global(.tp-btn.tp-btn-blue:hover) {
          background: linear-gradient(180deg, #4eb0ff 0%, #2a7dff 100%);
        }

        /* Remove button style */
        .wishlist-remove {
          color: #6b7280;
          border: 1px solid #e5e7eb;
          background: #fff;
        }
        .wishlist-remove:hover {
          background: #f9fafb;
          color: #374151;
        }

        /* Responsive tweaks */
        @media (max-width: 640px) {
          .wishlist-cell {
            padding: 10px 8px;
          }
          .wishlist-img {
            width: 56px;
            height: 80px;
            border-radius: 8px;
          }
          .wishlist-qty-btn {
            width: 34px;
            height: 34px;
          }
          .wishlist-qty-input {
            width: 44px;
          }
        }
      `}</style>
    </>
  );
};

export default WishlistItem;
