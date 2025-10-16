'use client';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import WishlistItem from './wishlist-item';
import { Plus } from '@/svg';
import useWishlistManager from '@/hooks/useWishlistManager';

const WishlistArea = () => {
  const router = useRouter();

  // Use the wishlist manager hook
  const { userId, wishlist, loading } = useWishlistManager();

  /* --------------------------- actions --------------------------- */
  const handleAddProduct = () => router.push('/shop');
  const handleGoToCart = () => router.push('/cart');
  const handleContinueShopping = () => router.push('/shop');

  const hasItems = Array.isArray(wishlist) && wishlist.length > 0;

  return (
    <>
      <section className="tp-cart-area pb-120">
        <div className="container">
          {!hasItems && !loading && (
            <div className="text-center pt-50">
              <h3>No Wishlist Items Found</h3>
              <button
                type="button"
                onClick={handleContinueShopping}
                className="btn-ghost-invert square mt-20"
                aria-label="Continue Shopping"
              >
                Continue Shopping
              </button>
            </div>
          )}

          {hasItems && (
            <div className="row">
              <div className="col-xl-12">
                <div className="tp-cart-list mb-45 mr-30">
                  <table className="table">
                    <thead>
                      <tr>
                        <th colSpan={2} className="tp-cart-header-product">Product</th>
                        <th className="tp-cart-header-price">Price</th>
                        <th className="tp-cart-header-quantity">Quantity</th>
                        <th>Action</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {wishlist.map((item, i) => (
                        <WishlistItem key={(item?._id || item?.id || i) + '_wl'} product={item} />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bottom actions row */}
                <div className="tp-wishlist-bottom">
                  <div className="row align-items-end justify-content-between g-3">
                    {/* LEFT: Add Product */}
                    <div className="col-md-6">
                      <div className="wl-actions-left center-left">
                        <button
                          type="button"
                          onClick={handleAddProduct}
                          className="btn-ghost-invert square"
                          title="Browse products"
                          aria-label="Add Product"
                        >
                          <span className="btn-icon" aria-hidden="true"><Plus /></span>
                          <span>Add Product</span>
                        </button>
                      </div>
                    </div>

                    {/* RIGHT: Go To Cart */}
                    <div className="col-md-6">
                      <div className="wl-actions-right text-md-end">
                        <button
                          type="button"
                          onClick={handleGoToCart}
                          className="btn-ghost-invert square"
                          title="Review cart"
                          aria-label="Go To Cart"
                        >
                          Go To Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </section>

      {/* Styles */}
      <style jsx>{`
        .center-left { display:flex; justify-content:center; align-items:center; }

        .btn-ghost-invert {
          --navy: #0b1620;
          --radius: 10px;

          display:inline-flex;
          align-items:center;
          gap:10px;
          min-height:48px;
          padding:12px 22px;
          border-radius:var(--radius);
          text-decoration:none;
          font-weight:600;
          font-size:15px;
          line-height:1;
          cursor:pointer;
          user-select:none;

          background:var(--navy);
          color:#fff;
          border:1px solid var(--navy);
          box-shadow:0 6px 18px rgba(0,0,0,0.25);
          transform:translateZ(0);

          transition:
            background 180ms ease,
            color 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease,
            transform 120ms ease;
        }

        .btn-ghost-invert.square { border-radius:0; }

        .btn-ghost-invert:hover {
          background:#fff;
          color:var(--navy);
          border-color:var(--navy);
          box-shadow:0 0 0 1px var(--navy) inset, 0 8px 20px rgba(0,0,0,0.12);
          transform:translateY(-1px);
        }
        .btn-ghost-invert:active {
          transform:translateY(0);
          background:#f8fafc;
          color:var(--navy);
          box-shadow:0 3px 10px rgba(0,0,0,0.15);
        }
        .btn-ghost-invert:focus-visible {
          outline:0;
          box-shadow:0 0 0 3px rgba(11,22,32,0.35);
        }

        .btn-icon { display:inline-flex; align-items:center; line-height:0; }

        .wl-actions-left, .wl-actions-right { display:flex; align-items:center; }
        .wl-actions-right { justify-content:flex-end; }

        @media (max-width:640px){
          .btn-ghost-invert { min-height:44px; padding:10px 18px; border-radius:8px; }
          .btn-ghost-invert.square { border-radius:0; }
          .wl-actions-right { justify-content:flex-start; }
        }

        .mt-20 { margin-top: 20px; }
      `}</style>
    </>
  );
};

export default WishlistArea;
