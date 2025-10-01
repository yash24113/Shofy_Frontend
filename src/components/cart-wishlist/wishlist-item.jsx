'use client';
import React from "react";
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

  const imageUrl = image1?.startsWith("http")
    ? image1
    : `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${image1}`;

  const slug = product?.slug || _id;

  // handle add product (now also removes from wishlist)
  const handleAddProduct = (prd) => {
    dispatch(add_cart_product(prd));
    // remove from wishlist after adding to cart (ecommerce-style)
    dispatch(remove_wishlist_product({ title, id: _id }));
  };

  // handle decrement product (only affects cart if already added)
  const handleDecrement = (prd) => {
    dispatch(quantityDecrement(prd));
  };

  // handle remove product from wishlist
  const handleRemovePrd = (prd) => {
    dispatch(remove_wishlist_product(prd));
  };

  return (
    <tr>
      <td className="tp-cart-img">
        <Link href={`/fabric/${slug}`}>
          {image1 && (
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

      <td className="tp-cart-title">
        <Link href={`/fabric/${slug}`}>{title}</Link>
      </td>

      <td className="tp-cart-price">
        <span>${(salesPrice || 0).toFixed(2)}</span>
      </td>

      <td className="tp-cart-quantity">
        <div className="tp-product-quantity mt-10 mb-10">
          <span onClick={() => handleDecrement(product)} className="tp-cart-minus">
            <Minus />
          </span>
          <input
            className="tp-cart-input"
            type="text"
            value={isAddToCart ? isAddToCart?.orderQuantity : 0}
            readOnly
          />
          <span onClick={() => handleAddProduct(product)} className="tp-cart-plus">
            <Plus />
          </span>
        </div>
      </td>

      <td className="tp-cart-add-to-cart">
        <button
          onClick={() => handleAddProduct(product)}
          type="button"
          className="tp-btn tp-btn-2 tp-btn-blue"
        >
          Moving To Cart
        </button>
      </td>

      <td className="tp-cart-action">
        <button
          onClick={() => handleRemovePrd({ title, id: _id })}
          className="tp-cart-action-btn"
        >
          <Close />
          <span> Remove</span>
        </button>
      </td>
    </tr>
  );
};

export default WishlistItem;
