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

  const imageUrl = img?.startsWith("http")
    ? img
    : `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${img}`;

  const slug = product?.slug || _id;

  // qty handlers
  const handleAddProduct = (prd) => dispatch(add_cart_product(prd));
  const handleDecrement = (prd) => dispatch(quantityDecrement(prd));

  // remove → save to wishlist first
  const handleRemovePrd = (prd) => {
    dispatch(add_to_wishlist(product));
    dispatch(remove_product(prd));
  };

  return (
    <>
      <tr className="tp-cart-row">
        {/* image */}
        <td className="tp-cart-img">
          <Link href={`/fabric/${slug}`}>
            {img && (
              <Image
                src={imageUrl}
                alt={title || "product img"}
                width={120}
                height={120}
                className="cart-image"
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
          <span>${((salesPrice || 0) * orderQuantity).toFixed(2)}</span>
        </td>

        {/* quantity */}
        <td className="tp-cart-quantity">
          <div className="tp-product-quantity">
            <button
              onClick={() => handleDecrement(product)}
              className="tp-cart-minus"
              aria-label="Decrease quantity"
            >
              <Minus />
            </button>
            <input
              className="tp-cart-input"
              type="text"
              value={orderQuantity}
              readOnly
            />
            <button
              onClick={() => handleAddProduct(product)}
              className="tp-cart-plus"
              aria-label="Increase quantity"
            >
              <Plus />
            </button>
          </div>
        </td>

        {/* remove button */}
        <td className="tp-cart-action">
          <button
            onClick={() => handleRemovePrd({ title, id: _id })}
            className="btn-square"
            title="Remove from cart and save to wishlist"
          >
            <Close />
            <span>Remove</span>
          </button>
        </td>
      </tr>

      <style jsx>{`
        .tp-cart-row {
          border-bottom: 1px solid #e5e7eb;
        }

        .tp-cart-img {
          width: 140px;
          padding: 16px;
        }

        .cart-image {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid #ddd;
        }

        .tp-cart-title {
          padding: 12px 16px;
          max-width: 320px;
        }

        .cart-title-link {
          display: block;
          font-weight: 600;
          font-size: 16px;
          color: #111827;
          line-height: 1.4;
          text-decoration: none;
        }

        .cart-title-link:hover {
          text-decoration: underline;
          color: #0b1620;
        }

        .tp-cart-price {
          padding: 12px;
          font-weight: 600;
          color: #0b1620;
          white-space: nowrap;
        }

        .tp-product-quantity {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #e5e7eb;
          border-radius: 9999px;
          padding: 6px 10px;
          min-width: 110px;
          justify-content: space-between;
        }

        .tp-cart-minus,
        .tp-cart-plus {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f9fafb;
          border: 1px solid #d1d5db;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tp-cart-minus:hover,
        .tp-cart-plus:hover {
          background: #0b1620;
          color: #fff;
          border-color: #0b1620;
        }

        .tp-cart-input {
          width: 36px;
          text-align: center;
          border: none;
          font-weight: 600;
          background: transparent;
          color: #111827;
        }

        /* Square Remove Button */
        .btn-square {
          --navy: #0b1620;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 18px;
          background: var(--navy);
          color: #fff;
          font-weight: 600;
          border: 1px solid var(--navy);
          border-radius: 6px; /* square look */
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
          transition: all 0.2s ease;
        }

        .btn-square:hover {
          background: #fff;
          color: var(--navy);
          border-color: var(--navy);
          transform: translateY(-2px);
        }

        .btn-square:active {
          transform: translateY(0);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }

        .tp-cart-action {
          text-align: right;
          padding-right: 16px;
        }

        @media (max-width: 768px) {
          .tp-cart-row {
            display: flex;
            flex-direction: column;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 12px;
            margin-bottom: 12px;
          }
          .tp-cart-action {
            text-align: left;
            margin-top: 8px;
          }
        }
      `}</style>
    </>
  );
};

export default CartItem;
