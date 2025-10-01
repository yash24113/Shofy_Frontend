'use client';
import React, { useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';

// internal
import { Close, Minus, Plus } from '@/svg';
import { add_cart_product, quantityDecrement } from '@/redux/features/cartSlice';
import { remove_wishlist_product } from '@/redux/features/wishlist-slice';

/* --------------------------------
   Small utilities
--------------------------------- */
const getImageUrl = (image1) => {
  if (!image1) return '/images/placeholder-portrait.webp'; // <- put your own placeholder path
  return image1.startsWith('http')
    ? image1
    : `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '')}/uploads/${image1}`; // safe join
};

const formatCurrency = (amount) => {
  const val = typeof amount === 'number' ? amount : 0;
  const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || 'INR';
  const LOCALE = process.env.NEXT_PUBLIC_LOCALE || 'en-IN';
  try {
    return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 }).format(val);
  } catch {
    return `₹${val}`;
  }
};

const WishlistItem = ({ product }) => {
  const dispatch = useDispatch();
  const { cart_products = [] } = useSelector((state) => state.cart) || {};

  const {
    _id,
    image1,
    title,
    salesPrice,
    slug: slugFromApi
  } = product || {};

  const slug = slugFromApi || _id;
  const imageUrl = useMemo(() => getImageUrl(image1), [image1]);

  const cartEntry = useMemo(
    () => cart_products.find((item) => item?._id === _id),
    [cart_products, _id]
  );

  const [isMoving, setIsMoving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleAddProduct = useCallback((prd) => {
    dispatch(add_cart_product(prd));
  }, [dispatch]);

  const handleDecrement = useCallback((prd) => {
    dispatch(quantityDecrement(prd));
  }, [dispatch]);

  const handleRemovePrd = useCallback(async () => {
    try {
      setIsRemoving(true);
      // Pass the shape your slice expects. You were sending { title, id } earlier.
      dispatch(remove_wishlist_product({ title, id: _id }));
    } finally {
      // Small delay just to allow a fade-out feel if parent keeps node momentarily
      setTimeout(() => setIsRemoving(false), 250);
    }
  }, [dispatch, _id, title]);

  const handleMoveToCart = useCallback(async () => {
    if (cartEntry) return; // already in cart safeguard
    setIsMoving(true);
    try {
      dispatch(add_cart_product(product));
      // remove from wishlist once moved
      dispatch(remove_wishlist_product({ title, id: _id }));
    } finally {
      setIsMoving(false);
    }
  }, [dispatch, cartEntry, product, _id, title]);

  return (
    <tr
      className={`transition-all duration-200 ${isRemoving ? 'opacity-50 scale-[0.99] pointer-events-none' : ''}`}
      aria-busy={isRemoving ? 'true' : 'false'}
    >
      {/* Product image */}
      <td className="tp-cart-img">
        <Link href={`/fabric/${slug}`} className="inline-flex">
          <Image
            src={imageUrl}
            alt={title || 'product image'}
            width={70}
            height={100}
            style={{ objectFit: 'cover', borderRadius: 8 }}
            onError={(e) => { e.currentTarget.src = '/images/placeholder-portrait.webp'; }}
          />
        </Link>
      </td>

      {/* Title */}
      <td className="tp-cart-title">
        <Link href={`/fabric/${slug}`} className="hover:underline">
          {title || 'Untitled Product'}
        </Link>
      </td>

      {/* Price */}
      <td className="tp-cart-price whitespace-nowrap">
        <span>{formatCurrency(salesPrice)}</span>
      </td>

      {/* Quantity OR read-only for wishlist row */}
      <td className="tp-cart-quantity">
        <div className="tp-product-quantity mt-10 mb-10">
          {/* If it's already in the cart, show qty controls like real stores */}
          {cartEntry ? (
            <>
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
                value={cartEntry?.orderQuantity || 1}
                readOnly
                aria-label="Current quantity in cart"
              />
              <button
                onClick={() => handleAddProduct(product)}
                className="tp-cart-plus"
                aria-label="Increase quantity"
              >
                <Plus />
              </button>
            </>
          ) : (
            // Not in cart yet — show a subtle 0 to indicate not added
            <>
              <span className="inline-flex min-w-[120px] justify-center rounded border px-3 py-2 text-sm text-gray-500">
                Not in cart
              </span>
            </>
          )}
        </div>
      </td>

      {/* Move to cart / In cart button */}
      <td className="tp-cart-add-to-cart">
        {cartEntry ? (
          <button
            type="button"
            disabled
            className="tp-btn tp-btn-2 tp-btn-gray opacity-80 cursor-not-allowed"
            aria-disabled="true"
            title="Already in cart"
          >
            In Cart
          </button>
        ) : (
          <button
            onClick={handleMoveToCart}
            type="button"
            className="tp-btn tp-btn-2 tp-btn-blue"
            disabled={isMoving || isRemoving}
          >
            {isMoving ? 'Moving…' : 'Move to Cart'}
          </button>
        )}
      </td>

      {/* Remove */}
      <td className="tp-cart-action">
        <button
          onClick={handleRemovePrd}
          className="tp-cart-action-btn"
          disabled={isRemoving}
          aria-label={`Remove ${title || 'product'} from wishlist`}
          title="Remove"
        >
          <Close />
          <span className="ml-1">{isRemoving ? 'Removing…' : 'Remove'}</span>
        </button>
      </td>
    </tr>
  );
};

export default WishlistItem;
