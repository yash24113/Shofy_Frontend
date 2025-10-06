'use client';
import React from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import WishlistItem from './wishlist-item';
import { Plus } from '@/svg';

const WishlistArea = () => {
  const { wishlist } = useSelector(state => state.wishlist);
  const router = useRouter();

  const handleAddProduct = () => router.push('/shop');

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
                    {/* LEFT: Add Product (button, not link) */}
                    <div className="col-md-6">
                      <div className="wl-actions-left center-left">
                        <button
                          type="button"
                          onClick={handleAddProduct}
                          className="add-btn"
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
        /* center the container */
        .center-left {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        /* Add Product button (black base → maroon hover) */
        .add-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-height: 48px;
          padding: 12px 22px;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 600;
          font-size: 15px;
          line-height: 1;
          color: #fff;
          background: #000; /* base black */
          border: none;
          cursor: pointer;
          transition: background 180ms ease,
                      box-shadow 180ms ease,
                      transform 120ms ease;
          box-shadow: 0 6px 18px rgba(0,0,0,0.25);
        }

        .add-btn:hover {
          background: #800000; /* maroon hover */
          box-shadow: 0 10px 28px rgba(128,0,0,0.35);
          transform: translateY(-1px);
          color: #fff;
        }

        .add-btn:active {
          background: #5e0000; /* darker pressed */
          transform: translateY(0);
          color: #fff;
        }

        .add-btn:focus-visible {
          outline: 0;
          box-shadow: 0 0 0 3px rgba(128,0,0,0.45);
        }

        .btn-icon {
          display: inline-flex;
          align-items: center;
          line-height: 0;
        }

        @media (max-width: 640px) {
          .add-btn {
            min-height: 44px;
            padding: 10px 18px;
            border-radius: 8px;
          }
        }
      `}</style>

      <style jsx>{`
        /* Shared base button (used by Go To Cart link) */
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
          box-shadow: 0 8px 20px rgba(128,0,0,0.25);
        }

        .btn-pressable:active {
          transform: translateY(0);
          box-shadow: 0 3px 10px rgba(128,0,0,0.3);
        }

        .btn-pressable:focus-visible {
          outline: 0;
          box-shadow: 0 0 0 3px rgba(128,0,0,0.45);
        }

        /* Outline (Go To Cart) */
        .btn-outline {
          color: #374151;
          background: #fff;
          border: 1px solid #e5e7eb;
        }

        .btn-outline:hover {
          background: #800000;
          color: #fff;
          border-color: #800000;
        }

        .btn-outline:active {
          background: #5e0000;
          border-color: #5e0000;
          color: #fff;
        }

        /* Layout helpers */
        .wl-actions-left,
        .wl-actions-right {
          display: flex;
          align-items: center;
        }

        .wl-actions-right {
          justify-content: flex-end;
        }

        .center-left {
          justify-content: center;
        }

        @media (max-width: 640px) {
          .wl-actions-right {
            justify-content: flex-start;
          }
        }
      `}</style>
    </>
  );
};

export default WishlistArea;
