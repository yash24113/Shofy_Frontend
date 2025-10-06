'use client';
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
// internal
import { Close } from "@/svg";
import { add_cart_product } from "@/redux/features/cartSlice";
import { remove_wishlist_product } from "@/redux/features/wishlist-slice";

const WishlistItem = ({ product }) => {
  const { _id, img, title = "Product", salesPrice = 0, slug } = product || {};
  const dispatch = useDispatch();
  const router = useRouter();

  const { cart_products } = useSelector((state) => state.cart);
  const alreadyInCart = cart_products?.some?.((item) => (item?._id || item?.id) === _id);

  const [moving, setMoving] = useState(false);

  const imageUrl = img?.startsWith("http")
    ? img
    : `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${img}`;

  const href = `/fabric/${slug || _id || ""}`;

  const handleAddProduct = async () => {
    // Gate by sessionId
    const hasSession =
      typeof window !== "undefined" && !!window.localStorage.getItem("sessionId");

    if (!hasSession) {
      router.push("/login");
      return;
    }

    try {
      setMoving(true);
      // normalize payload to guarantee id/_id are present
      const normalized = { ...product, _id, id: _id };
      dispatch(add_cart_product(normalized));
      dispatch(remove_wishlist_product({ title, id: _id }));
    } finally {
      setTimeout(() => setMoving(false), 250);
    }
  };

  const handleRemovePrd = () => {
    dispatch(remove_wishlist_product({ title, id: _id }));
  };

  return (
    <>
      <tr className="wishlist-row">
        {/* img */}
        <td className="tp-cart-img wishlist-cell">
          <Link href={href} className="wishlist-img-link">
            {img && (
              <Image
                src={imageUrl}
                alt={title}
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
          <Link href={href} className="wishlist-title">
            {title}
          </Link>
        </td>

        {/* price */}
        <td className="tp-cart-price wishlist-cell">
          <span className="wishlist-price">${salesPrice.toFixed(2)}</span>
        </td>

        {/* add to cart */}
        <td className="tp-cart-add-to-cart wishlist-cell wishlist-cell-center">
          <button
            onClick={handleAddProduct}
            type="button"
            className={`btn-ghost-invert square ${moving ? "is-loading" : ""}`}
            aria-busy={moving ? "true" : "false"}
            title={alreadyInCart ? "Already in cart" : "Move to Cart"}
            disabled={!!alreadyInCart || moving}
          >
            {alreadyInCart ? "In Cart" : moving ? "Moving…" : "Move to Cart"}
          </button>
        </td>

        {/* remove */}
        <td className="tp-cart-action wishlist-cell">
          <button
            onClick={handleRemovePrd}
            className="btn-ghost-invert square"
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
        /* Row */
        .wishlist-row {
          border-bottom: 1px solid #eef0f3;
          transition: background-color 160ms ease, box-shadow 180ms ease;
        }
        .wishlist-row:hover { background: #fafbfc; }

        /* Cells */
        .wishlist-cell { padding: 14px 12px; vertical-align: middle; }
        .wishlist-cell-center { text-align: center; }

        /* Image */
        .wishlist-img-link { display: inline-block; line-height: 0; }
        .wishlist-img {
          width: 70px; height: 100px; object-fit: cover;
          border-radius: 10px; background: #f3f5f8;
          box-shadow: 0 2px 10px rgba(0,0,0,0.06);
        }

        /* Text */
        .wishlist-title { display:inline-block; font-weight:600; line-height:1.3; color:#0f172a; text-decoration:none; }
        .wishlist-title:hover { text-decoration: underline; }
        .wishlist-price { font-weight: 600; color: #0f172a; }

        /* Square ghost-invert button */
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
                      transform 120ms ease, opacity 120ms ease;
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
        .btn-ghost-invert.is-loading { pointer-events: none; opacity: 0.8; }

        @media (max-width: 640px) {
          .wishlist-cell { padding: 10px 8px; }
          .wishlist-img { width: 56px; height: 80px; border-radius: 8px; }
          .btn-ghost-invert { min-height: 42px; padding: 9px 16px; }
        }
      `}</style>
    </>
  );
};

export default WishlistItem;
