'use client';

import React, { useMemo, useCallback, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { Close, Minus, Plus } from '@/svg';

// cart
import { add_cart_product, quantityDecrement, remove_product } from '@/redux/features/cartSlice';
// wishlist
import { add_to_wishlist } from '@/redux/features/wishlist-slice';

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

const CartCard = ({ product }) => {
  const dispatch = useDispatch();
  const { _id, image1, title, salesPrice = 0, orderQuantity = 1, slug: slugFromApi } = product || {};
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  const imageUrl = useMemo(() => getImageUrl(image1), [image1]);
  const slug = slugFromApi || _id;
  const lineTotal = useMemo(() => (salesPrice * orderQuantity), [salesPrice, orderQuantity]);

  const inc = useCallback(() => dispatch(add_cart_product(product)), [dispatch, product]);
  const dec = useCallback(() => dispatch(quantityDecrement(product)), [dispatch, product]);

  // REMOVE from cart ⇒ ADD to wishlist
  const saveToWishlist = useCallback(async () => {
    try {
      setPending(true);
      dispatch(add_to_wishlist(product));
      dispatch(remove_product({ title, id: _id }));
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setPending(false);
    }
  }, [dispatch, product, title, _id]);

  return (
    <div
      className={`group relative grid grid-cols-[92px,1fr] gap-4 rounded-xl border p-4 md:p-5 shadow-sm hover:shadow-md transition-all
                 ${pending ? 'opacity-60 pointer-events-none' : ''}`}
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

      {/* right pane */}
      <div className="min-w-0">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <Link href={`/fabric/${slug}`} className="line-clamp-2 font-medium leading-snug hover:underline">
            {title || 'Untitled Product'}
          </Link>
          <div className="shrink-0 text-right sm:pl-3">
            <div className="text-base font-semibold">{formatCurrency(lineTotal)}</div>
            <div className="text-xs text-gray-500">({formatCurrency(salesPrice)} × {orderQuantity})</div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {/* qty control */}
          <div className="inline-flex items-center rounded-full border px-1">
            <button
              onClick={dec}
              className="tp-cart-minus inline-flex h-9 w-9 items-center justify-center"
              aria-label="Decrease quantity"
              title="Decrease"
            >
              <Minus />
            </button>
            <input
              className="tp-cart-input w-12 border-0 bg-transparent text-center font-medium"
              type="text"
              value={orderQuantity}
              readOnly
              aria-label="Quantity"
            />
            <button
              onClick={inc}
              className="tp-cart-plus inline-flex h-9 w-9 items-center justify-center"
              aria-label="Increase quantity"
              title="Increase"
            >
              <Plus />
            </button>
          </div>

          {/* save to wishlist (remove from cart) */}
          <button
            onClick={saveToWishlist}
            className="inline-flex items-center gap-1 rounded-full border px-3 py-2 text-sm hover:bg-gray-50"
            title="Remove from cart and save to wishlist"
          >
            <Close />
            <span>Save to Wishlist</span>
          </button>

          {saved && (
            <span className="text-sm text-emerald-600" aria-live="polite">Saved ✓</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default function CartPage() {
  const { cart_products = [] } = useSelector((s) => s.cart) || {};

  const subtotal = cart_products.reduce((sum, p) => sum + (p.salesPrice || 0) * (p.orderQuantity || 1), 0);

  return (
    <section className="container grid gap-8 lg:grid-cols-[1fr,360px]">
      {/* left: items */}
      <div>
        <h1 className="mb-4 text-2xl font-semibold">Your Cart</h1>

        {cart_products.length ? (
          <div className="grid gap-4 md:gap-5" role="list">
            {cart_products.map((p) => (
              <CartCard key={p?._id || p?.slug} product={p} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border p-8 text-center">
            <h2 className="text-lg font-semibold">Your cart is empty</h2>
            <p className="text-gray-500 mt-1 mb-5">Add items to see them here.</p>
            <Link href="/shop" className="tp-btn tp-btn-blue inline-flex">Continue Shopping</Link>
          </div>
        )}
      </div>

      {/* right: order summary (kept simple; hook up to your existing panel) */}
      <aside className="rounded-xl border p-5 h-fit">
        <h3 className="mb-3 text-lg font-semibold">Summary</h3>
        <div className="flex items-center justify-between py-2">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>
        <div className="mt-4">
          <Link href="/checkout" className="tp-btn tp-btn-blue w-full inline-flex justify-center">
            Proceed to Checkout
          </Link>
        </div>
      </aside>
    </section>
  );
}
