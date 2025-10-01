'use client';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import WishlistItem from '@/components/cart-wishlist/wishlist-item';

const WishlistPage = () => {
  const { wishlist_products = [] } = useSelector((s) => s.wishlist) || {};
  const count = wishlist_products.length;

  const hasItems = useMemo(() => count > 0, [count]);

  return (
    <section className="tp-section-wishlist">
      <div className="container">
        <div className="tp-section-header mb-6">
          <h1 className="text-2xl font-semibold">Your Wishlist</h1>
          <p className="text-sm text-gray-500 mt-1">
            {hasItems ? `You have ${count} item${count > 1 ? 's' : ''} saved.` : 'Save products to quickly find them later.'}
          </p>
        </div>

        {hasItems ? (
          <div className="tp-table-wrapper overflow-x-auto rounded-lg border">
            <table className="tp-table tp-table-wishlist w-full min-w-[720px]">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4">Product</th>
                  <th className="text-left py-3 px-4"></th>
                  <th className="text-left py-3 px-4">Price</th>
                  <th className="text-left py-3 px-4">Quantity</th>
                  <th className="text-left py-3 px-4">Action</th>
                  <th className="text-left py-3 px-4">Remove</th>
                </tr>
              </thead>
              <tbody>
                {wishlist_products.map((prd) => (
                  <WishlistItem key={prd?._id || prd?.slug} product={prd} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="tp-empty-state rounded-xl border p-8 text-center">
            <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-gray-100 grid place-items-center">
              <span role="img" aria-label="heart">💖</span>
            </div>
            <h2 className="text-lg font-medium">Your wishlist is empty</h2>
            <p className="text-gray-500 mt-1 mb-5">Browse products and tap the heart to save them here.</p>
            <Link href="/shop" className="tp-btn tp-btn-blue inline-flex">
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default WishlistPage;
