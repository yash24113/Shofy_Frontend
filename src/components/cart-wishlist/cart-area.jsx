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
                  <div className="row align-items-end">
                    {/* LEFT: Add Product */}
                    <div className="col-xl-6 col-md-8">
                      <div className="tp-cart-actions-left">
                        <Link
                          href="/shop"
                          className="tp-cart-add-btn btn-pressable"
                          title="Browse products"
                        >
                          <span className="icon"><Plus /></span>
                          <span>Add Product</span>
                        </Link>
                      </div>
                    </div>

                    {/* RIGHT: Clear Cart */}
                    <div className="col-xl-6 col-md-4">
                      <div className="tp-cart-update text-md-end mr-30">
                        <button
                          onClick={() => dispatch(clearCart())}
                          type="button"
                          className="tp-cart-update-btn btn-pressable"
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

      {/* Internal styles for the new Add Product button */}
      <style jsx>{`
        .tp-cart-actions-left {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-left: 6px;
        }

        .btn-pressable {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 12px;
          font-weight: 600;
          white-space: nowrap;
          transform: translateZ(0);
          transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
        }
        .btn-pressable:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(2, 132, 199, 0.18);
        }
        .btn-pressable:active {
          transform: translateY(0);
          box-shadow: 0 3px 10px rgba(2, 132, 199, 0.2);
        }

        /* Primary gradient for Add Product */
        .tp-cart-add-btn {
          color: #fff;
          background: linear-gradient(180deg, #2ea0ff 0%, #1670ff 100%);
          border: none;
          text-decoration: none;
        }
        .tp-cart-add-btn:hover {
          background: linear-gradient(180deg, #4eb0ff 0%, #2a7dff 100%);
        }
        .tp-cart-add-btn .icon {
          display: inline-flex;
          align-items: center;
          line-height: 0;
        }

        /* Keep Clear Cart visual consistent */
        :global(.tp-cart-update-btn) {
          color: #374151;
          background: #fff;
          border: 1px solid #e5e7eb;
          padding: 10px 16px;
          border-radius: 12px;
        }
        :global(.tp-cart-update-btn:hover) {
          background: #f9fafb;
        }

        @media (max-width: 640px) {
          .tp-cart-actions-left {
            padding-left: 0;
            margin-bottom: 12px;
          }
        }
      `}</style>
    </>
  );
};

export default CartArea;
