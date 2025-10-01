'use client';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
// internal
import { clearCart } from '@/redux/features/cartSlice';
import CartCheckout from './cart-checkout';
import CartItem from './cart-item';
import RenderCartProgress from '../common/render-cart-progress';
import { Plus } from '@/svg';

const CartArea = () => {
  const { cart_products } = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  return (
    <>
      <section className="tp-cart-area pb-120">
        <div className="container">
          {cart_products.length === 0 && (
            <div className="text-center pt-50">
              <h3>No Cart Items Found</h3>
              <Link href="/shop" className="tp-cart-checkout-btn mt-20">
                Continue Shopping
              </Link>
            </div>
          )}

          {cart_products.length > 0 && (
            <div className="row">
              <div className="col-xl-9 col-lg-8">
                <div className="tp-cart-list mb-25 mr-30">
                  <div className="cartmini__shipping">
                    <RenderCartProgress />
                  </div>

                  <table className="table">
                    <thead>
                      <tr>
                        <th colSpan="2" className="tp-cart-header-product">Product</th>
                        <th className="tp-cart-header-price">Price</th>
                        <th className="tp-cart-header-quantity">Quantity</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart_products.map((item, i) => (
                        <CartItem key={i} product={item} />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bottom actions row */}
                <div className="tp-cart-bottom">
                  <div className="row align-items-end justify-content-between g-3">
                    {/* LEFT: Add Product */}
                    <div className="col-md-6">
                      <div className="tp-cart-actions-left">
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

                    {/* RIGHT: Clear Cart */}
                    <div className="col-md-6">
                      <div className="tp-cart-update text-md-end">
                        <button
                          onClick={() => dispatch(clearCart())}
                          type="button"
                          className="btn-base btn-outline btn-pressable"
                          title="Remove all items from cart"
                        >
                          Clear Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="col-xl-3 col-lg-4 col-md-6">
                <CartCheckout />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Internal styles for Add Product & Clear Cart buttons */}
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
          transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease, border-color 160ms ease, color 160ms ease;
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

        /* Primary (Add Product) */
        .btn-primary {
          color: #fff;
          border: none;
          background: linear-gradient(180deg, #2ea0ff 0%, #1670ff 100%);
        }
        .btn-primary:hover {
          background: linear-gradient(180deg, #4eb0ff 0%, #2a7dff 100%);
        }
        .btn-primary:active {
          background: linear-gradient(180deg, #2a7dff 0%, #165cff 100%);
        }

        /* Outline (Clear Cart) */
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
        .tp-cart-actions-left {
          display: flex;
          align-items: center;
        }
        .tp-cart-update {
          display: flex;
          justify-content: flex-end;
          align-items: center;
        }

        @media (max-width: 640px) {
          .tp-cart-actions-left,
          .tp-cart-update {
            justify-content: flex-start;
          }
        }
      `}</style>
    </>
  );
};

export default CartArea;
