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

  // qty handlers
  const handleAddProduct = (prd) => dispatch(add_cart_product(prd));
  const handleDecrement   = (prd) => dispatch(quantityDecrement(prd));

  // remove → save to wishlist first
  const handleRemovePrd = (prd) => {
    dispatch(add_to_wishlist(product));
    dispatch(remove_product(prd));
  };

  return (
    <>
      <tr>
        {/* img */}
        <td className="tp-cart-img">
          <Link href={`/fabric/${slug}`}>
            {img && (
              <Image
                src={imageUrl}
                alt={title || "product img"}
                width={70}
                height={100}
                style={{ objectFit: "cover" }}
              />
            )}
          </Link>
        </td>

        {/* title */}
        <td className="tp-cart-title">
          <Link href={`/fabric/${slug}`}>{title}</Link>
        </td>

        {/* price */}
        <td className="tp-cart-price">
          <span>${((salesPrice || 0) * orderQuantity).toFixed(2)}</span>
        </td>

        {/* quantity */}
        <td className="tp-cart-quantity">
          <div className="tp-product-quantity mt-10 mb-10">
            <span onClick={() => handleDecrement(product)} className="tp-cart-minus">
              <Minus />
            </span>
            <input className="tp-cart-input" type="text" value={orderQuantity} readOnly />
            <span onClick={() => handleAddProduct(product)} className="tp-cart-plus">
              <Plus />
            </span>
          </div>
        </td>

        {/* action */}
        <td className="tp-cart-action">
          <button
            onClick={() => handleRemovePrd({ title, id: _id })}
            className="btn-ghost-invert square"
            title="Remove from cart and save to wishlist"
          >
            <Close />
            <span> Remove</span>
          </button>
        </td>
      </tr>

      {/* internal styles */}
      <style jsx>{`
        /* shared square, ghost-invert button */
        .btn-ghost-invert {
          --navy: #0b1620;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          padding: 10px 18px;
          border-radius: 0;            /* square */
          font-weight: 600;
          font-size: 15px;
          line-height: 1;
          cursor: pointer;
          user-select: none;
          text-decoration: none;
          background: var(--navy);
          color: #fff;
          border: 1px solid var(--navy);
          box-shadow: 0 6px 18px rgba(0,0,0,0.22);
          transition: background 180ms ease, color 180ms ease,
                      border-color 180ms ease, box-shadow 180ms ease,
                      transform 120ms ease;
        }
        .btn-ghost-invert:hover {
          background: #fff;
          color: var(--navy);
          border-color: var(--navy);
          box-shadow: 0 0 0 1px var(--navy) inset, 0 8px 20px rgba(0,0,0,0.12);
          transform: translateY(-1px);
        }
        .btn-ghost-invert:active {
          transform: translateY(0);
          background: #f8fafc;
          color: var(--navy);
          box-shadow: 0 3px 10px rgba(0,0,0,0.15);
        }
        .btn-ghost-invert:focus-visible {
          outline: 0;
          box-shadow: 0 0 0 3px rgba(11,22,32,0.35);
        }

        @media (max-width:640px){
          .btn-ghost-invert { min-height: 42px; padding: 9px 16px; }
        }
      `}</style>
    </>
  );
};

export default CartItem;
