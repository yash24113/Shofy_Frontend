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
  const { _id, img, title, salesPrice, orderQuantity = 0 } = product || {};
  const dispatch = useDispatch();

  const imageUrl = img?.startsWith('http')
    ? img
    : `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${img}`;

  const slug = product?.slug || _id;

  const handleAddProduct = (prd) => {
    dispatch(add_cart_product(prd));
  };

  const handleDecrement = (prd) => {
    dispatch(quantityDecrement(prd));
  };

  // Remove product and move to wishlist
  const handleRemovePrd = (prd) => {
    dispatch(add_to_wishlist(product)); // store in wishlist
    dispatch(remove_product(prd)); // then remove from cart
  };

  return (
    <>
      <tr className="cart-row">
        {/* image */}
        <td className="tp-cart-img">
          <Link href={`/fabric/${slug}`}>
            {img && (
              <Image
                src={imageUrl}
                alt={title || "product img"}
                width={70}
                height={100}
                style={{ objectFit: "cover", borderRadius: "8px" }}
              />
            )}
          </Link>
        </td>

        {/* title */}
        <td className="tp-cart-title">
          <Link href={`/fabric/${slug}`} className="cart-title-link">
            {title}
          </Link>
        </td>

        {/* price */}
        <td className="tp-cart-price">
          <span className="cart-price">
            ${((salesPrice || 0) * orderQuantity).toFixed(2)}
          </span>
        </td>

        {/* quantity controls */}
        <td className="tp-cart-quantity">
          <div className="tp-product-quantity mt-10 mb-10">
            <span onClick={() => handleDecrement(product)} className="tp-cart-minus">
              <Minus />
            </span>
            <input
              className="tp-cart-input"
              type="text"
              value={orderQuantity}
              readOnly
            />
            <span onClick={() => handleAddProduct(product)} className="tp-cart-plus">
              <Plus />
            </span>
          </div>
        </td>

        {/* remove action */}
        <td className="tp-cart-action">
          <button
            onClick={() => handleRemovePrd({ title, id: _id })}
            className="tp-cart-action-btn btn-remove"
            title="Remove from cart and save to wishlist"
          >
            <Close />
            <span> Remove</span>
          </button>
        </td>
      </tr>

      {/* -------- Scoped CSS -------- */}
      <style jsx>{`
        .cart-row {
          border-bottom: 1px solid #eef0f3;
          transition: background-color 150ms ease;
        }
        .cart-row:hover {
          background: #fafbfc;
        }

        .tp-cart-title a {
          color: #0f172a;
          font-weight: 600;
          text-decoration: none;
        }
        .tp-cart-title a:hover {
          text-decoration: underline;
        }

        .cart-price {
          font-weight: 600;
          color: #0f172a;
        }

        .tp-product-quantity {
          display: inline-flex;
          align-items: center;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          padding: 2px;
          background: #fff;
        }
        .tp-cart-minus,
        .tp-cart-plus {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 999px;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: background-color 150ms ease, transform 120ms ease;
        }
        .tp-cart-minus:hover,
        .tp-cart-plus:hover {
          background: #f3f4f6;
        }
        .tp-cart-minus:active,
        .tp-cart-plus:active {
          transform: translateY(1px);
        }

        .tp-cart-input {
          width: 52px;
          text-align: center;
          font-weight: 600;
          border: 0;
          background: transparent;
          outline: none;
        }

        /* === Remove Button (Maroon Theme) === */
        .btn-remove {
          color: #6b7280;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          padding: 10px 14px;
          border-radius: 8px;
          font-weight: 500;
          transition: background 160ms ease, color 160ms ease, box-shadow 160ms ease;
          cursor: pointer;
        }

        .btn-remove:hover {
          background: #800000; /* maroon */
          color: #fff;
          border-color: #800000;
          box-shadow: 0 8px 18px rgba(128, 0, 0, 0.25);
        }

        .btn-remove:active {
          background: #5e0000;
          border-color: #5e0000;
          color: #fff;
          box-shadow: 0 3px 8px rgba(94, 0, 0, 0.3);
        }

        .btn-remove:focus-visible {
          outline: 3px solid rgba(128, 0, 0, 0.45);
          outline-offset: 2px;
        }

        @media (max-width: 640px) {
          .tp-cart-title {
            font-size: 14px;
          }
          .btn-remove {
            padding: 8px 12px;
            font-size: 13px;
          }
        }
      `}</style>
    </>
  );
};

export default CartItem;
