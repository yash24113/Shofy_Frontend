'use client';

import React, { useMemo, useCallback, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { Close, Minus, Plus } from '@/svg';
import { add_cart_product, quantityDecrement } from '@/redux/features/cartSlice';
import { remove_wishlist_product } from '@/redux/features/wishlist-slice';

/* ---------- helpers ---------- */
const getImageUrl = (image1) => {
  if (!image1) return '/images/placeholder-portrait.webp';
  return image1.startsWith('http')
    ? image1
    : `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/,'')}/uploads/${image1}`;
};
const formatCurrency = (amount) => {
  const val = Number.isFinite(amount) ? amount : 0;
  const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || 'INR';
  const LOCALE   = process.env.NEXT_PUBLIC_LOCALE || 'en-IN';
  try {
    return new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 }).format(val);
  } catch {
    return `₹${val}`;
  }
};

const WishlistItem = ({ product }) => {
  const dispatch = useDispatch();
  const { cart_products = [] } = useSelector((s) => s.cart) || {};
  const { _id, image1, title, salesPrice = 0, slug: slugFromApi } = product || {};
  const [removing, setRemoving] = useState(false);

  const imageUrl = useMemo(() => getImageUrl(image1), [image1]);
  const slug = slugFromApi || _id;

  const cartEntry = cart_products.find((it) => it?._id === _id);

  const addToCart = useCallback(() => dispatch(add_cart_product(product)), [dispatch, product]);
  const decFromCart = useCallback(() => dispatch(quantityDecrement(product)), [dispatch, product]);

  const removeFromWishlist = useCallback(() => {
    setRemoving(true);
    dispatch(remove_wishlist_product({ title, id: _id }));
    setTimeout(() => setRemoving(false), 250);
  }, [dispatch, _id, title]);

  return (
    <div
      className={`group relative grid grid-cols-[92px,1fr] gap-4 rounded-xl border p-4 md:p-5 shadow-sm hover:shadow-md transition-all
                 ${removing ? 'opacity-60' : ''}`}
      role="listitem"
    >
      {/* image */}
      <Link href={`/fabric/${slug}`} className="relative h-[92px] w-[92px] overflow-hidden rounded-lg bg-gray-50">
        <Image
          src={imageUrl}
          alt={title || 'product image'}
          fill
          sizes="92px"
          style={{ objectFit: 'cover' }}
          onError={(e) => { (e.currentTarget).src = '/images/placeholder-portrait.webp'; }}
        />
      </Link>

      {/* right */}
      <div className="min-w-0">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <Link href={`/fabric/${slug}`} className="line-clamp-2 font-medium leading-snug hover:underline">
            {title || 'Untitled Product'}
          </Link>
          <div className="shrink-0 text-right sm:pl-3">
            <div className="text-base font-semibold">{formatCurrency(salesPrice)}</div>
            <div className="text-xs text-gray-500">per unit</div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {/* If already in cart → show qty; else Move to Cart */}
          {cartEntry ? (
            <div className="inline-flex items-center rounded-full border px-1">
              <button
                onClick={decFromCart}
                className="tp-cart-minus inline-flex h-9 w-9 items-center justify-center"
                aria-label="Decrease quantity"
                title="Decrease"
              >
                <Minus />
              </button>
              <input
                className="tp-cart-input w-12 border-0 bg-transparent text-center font-medium"
                type="text"
                value={cartEntry?.orderQuantity || 1}
                readOnly
                aria-label="Quantity"
              />
              <button
                onClick={addToCart}
                className="tp-cart-plus inline-flex h-9 w-9 items-center justify-center"
                aria-label="Increase quantity"
                title="Increase"
              >
                <Plus />
              </button>
            </div>
          ) : (
            <button
              onClick={addToCart}
              className="tp-btn tp-btn-2 tp-btn-blue inline-flex"
              title="Add to Cart"
            >
              Move to Cart
            </button>
          )}

          <button
            onClick={removeFromWishlist}
            className="inline-flex items-center gap-1 rounded-full border px-3 py-2 text-sm hover:bg-gray-50"
            title="Remove from wishlist"
          >
            <Close />
            <span>Remove</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WishlistItem;
