'use client';
import React from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import WishlistItem from './wishlist-item';
import { Plus } from '@/svg';

const WishlistArea = () => {
  const { wishlist } = useSelector((state) => state.wishlist);

  return (
    <>
      <section className="tp-cart-area pb-120">
        <div className="container">
          {wishlist.length === 0 && (
            <div className="text-center pt-50">
              <h3>No Wishlist Items Found</h3>
              <Link href="/shop" className="tp-cart-checkout-btn mt-20">
                Continue Shopping
              </Link>
            </div>
          )}

          {wishlist.length > 0 && (
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
                        <WishlistItem key={i} product={item} />
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
                        <Link
                          href="/shop"
                          className="btn-base btn-primary btn-pressable"
                          title="Browse products"
                        >
                          <span className="btn-icon"><Plus /></span>
                          <span>Add Product</span>
                        </Link>
                      </div>
                    </div>

                    {/* RIGHT: Go To Cart */}
                    <div className="col-md-6">
                      <div className="wl-actions-right text-md-end">
                        <Link
                          href="/cart"
                          className="btn-base btn-outline btn-pressable"
                          title="Review cart"
                        >
                          Go To Cart
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Internal styles for buttons */}
      <style jsx>{`
        /* Shared base button */
        .btn-base {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-height: 44px;
          padding: 10px 18px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
          line-height: 1;
          text-decoration: none;
          cursor: pointer;
          user-select: none;
          transition: transform 160ms ease, box-shadow 160ms ease,
            background 160ms ease, border-color 160ms ease, color 160ms ease;
        }
        .btn-pressable:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(2, 132, 199, 0.18);
        }
        .btn-pressable:active {
          transform: translateY(0);
          box-shadow: 0 3px 10px rgba(2, 132, 199, 0.2);
        }
        .btn-pressable:focus-visible {
          outline: 0;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.45);
        }
        .btn-icon {
          display: inline-flex;
          align-items: center;
          line-height: 0;
        }

        /* Primary (Add Product) — black base, light-blue hover */
        .btn-primary {
          color: #fff;
          border: none;
          background: #000;               /* black default */
        }
        .btn-primary:hover {
          background: #2ea0ff;            /* light blue on hover */
        }
        .btn-primary:active {
          background: #1670ff;            /* slightly deeper blue on press */
        }

        /* Outline (Go To Cart) */
        .btn-outline {
          color: #374151;
          background: #fff;
          border: 1px solid #e5e7eb;
        }
        .btn-outline:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }
        .btn-outline:active {
          background: #f3f4f6;
          border-color: #cbd5e1;
        }

        /* Layout helpers */
        .wl-actions-left,
        .wl-actions-right {
          display: flex;
          align-items: center;
        }
        .wl-actions-right { justify-content: flex-end; }

        /* Center the Add Product button */
        .center-left { justify-content: center; }

        @media (max-width: 640px) {
          .wl-actions-right { justify-content: flex-start; }
        }
      `}</style>
    </>
  );
};

export default WishlistArea;
