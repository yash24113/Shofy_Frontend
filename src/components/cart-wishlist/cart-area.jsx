'use client';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';

import CartItem from './cart-item';
import RenderCartProgress from '../common/render-cart-progress';
import { Plus } from '@/svg';
import { selectUserId } from '@/utils/userSelectors';
import {
  useGetCartDataQuery,
  useClearCartMutation,
} from '@/redux/features/cartApi';

const CartArea = () => {
  const userId = useSelector(selectUserId);
  const router = useRouter();
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [isProceeding, setIsProceeding] = useState(false);

  const {
    data: cartResponse,
    isLoading,
    error,
    refetch,
  } = useGetCartDataQuery(userId, { skip: !userId });

  const [clearCart, { isLoading: isClearing }] = useClearCartMutation();

  const cart_products =
    cartResponse?.data?.items
      ?.map((item) =>
        item?.productId
          ? {
              ...(item.productId || {}),
              title: item.productId?.name,
              _id: item.productId?._id,
              orderQuantity: item.quantity,
              cartItemId: item._id,
            }
          : null
      )
      .filter(Boolean) || [];

  const handleAddProduct = () => router.push('/shop');

  const handleClearCart = async () => {
    if (!userId || isClearing) return;
    try {
      // IMPORTANT: pass userId so RTKQ invalidation hits the right tag
      await clearCart({ userId }).unwrap();
      // Either rely on invalidation, or force a refetch for instant UI sync:
      refetch();
    } catch (e) {
      console.error('Failed to clear cart:', e);
    }
  };

  // ✅ Proceed only navigates – no API calls here
  const handleCheckout = async () => {
    if (isProceeding) return;
    setIsProceeding(true);
    try {
      router.push('/checkout');
    } finally {
      setIsProceeding(false);
    }
  };

  // Hide sticky bar when footer is in view
  useEffect(() => {
    const footerEl = document.querySelector('footer');
    if (!footerEl) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setIsFooterVisible(entry.isIntersecting));
      },
      { threshold: 0.1 }
    );
    observer.observe(footerEl);
    return () => observer.disconnect();
  }, []);

  if (!userId) {
    return (
      <section className="tp-cart-area pb-120">
        <div className="container">
          <div className="text-center pt-50">
            <h3>Please sign in to view your cart</h3>
            <button
              type="button"
              className="btn-ghost-invert square mt-20"
              onClick={() => router.push('/login')}
            >
              Go to Login
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="tp-cart-area pb-120">
        <div className="container">
          <div className="text-center pt-50">
            <h3>Loading cart…</h3>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="tp-cart-area pb-120">
        <div className="container">
          <div className="text-center pt-50">
            <h3>Error loading cart</h3>
            <p>Please try again.</p>
            <button
              type="button"
              className="btn-ghost-invert square mt-20"
              onClick={() => refetch()}
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="tp-cart-area pb-120">
        <div className="container">
          {cart_products.length === 0 && (
            <div className="text-center pt-50">
              <h3>No Cart Items Found</h3>
              <div className="mt-20">
                <button
                  type="button"
                  className="btn-ghost-invert square"
                  onClick={handleAddProduct}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}

          {cart_products.length > 0 && (
            <div className="row">
              <div className="col-12">
                <div className="tp-cart-list mb-25">
                  <div className="cartmini__shipping">
                    <RenderCartProgress />
                  </div>

                  <table className="table tp-cart-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th className="text-right">Price</th>
                        <th>Quantity</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {cart_products.map((item, i) => (
                        <CartItem key={item.cartItemId || item._id || i} product={item} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Sticky Bottom Action Bar */}
      {cart_products.length > 0 && (
        <div className={`sticky-action-bar ${isFooterVisible ? 'hide' : ''}`}>
          <div className="left-actions">
            <button
              type="button"
              onClick={handleAddProduct}
              className="btn-ghost-invert square"
              title="Browse products"
            >
              <span className="btn-icon" aria-hidden="true">
                <Plus />
              </span>
              <span className="btn-label">Add Product</span>
            </button>
          </div>

          <div className="right-actions">
            <button
              onClick={handleClearCart}
              disabled={isClearing}
              type="button"
              className={`btn-ghost-invert square ${isClearing ? 'is-loading' : ''}`}
              title="Remove all items"
            >
              {isClearing ? 'Clearing…' : 'Clear Cart'}
            </button>

            <button
              type="button"
              onClick={handleCheckout}
              className="btn-ghost-invert square proceed-btn"
              title="Go to checkout"
              disabled={isProceeding}
            >
              {isProceeding ? 'Please wait…' : 'Proceed to Checkout'}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .tp-cart-table { width: 100%; table-layout: fixed; }
        thead th { font-weight: 700; color: #0f172a; padding: 10px 12px; }
        .text-right { text-align: right; }

        .btn-ghost-invert {
          display: inline-flex; align-items: center; gap: 8px;
          min-height: 44px; padding: 10px 18px; font-weight: 600; font-size: 15px; line-height: 1;
          cursor: pointer; user-select: none;
          background: var(--tp-theme-primary); color: var(--tp-common-white);
          border: 1px solid var(--tp-theme-primary);
          box-shadow: 0 6px 18px rgba(0,0,0,0.12);
          transition: all 0.18s ease;
        }
        .btn-ghost-invert.square { border-radius: 0; }
        .btn-ghost-invert:hover {
          background: var(--tp-common-white);
          border-color: var(--tp-theme-primary);
          color: var(--tp-theme-primary);
          box-shadow: 0 0 0 1px var(--tp-theme-primary) inset, 0 8px 20px rgba(0,0,0,0.08);
          transform: translateY(-1px);
        }
        .btn-ghost-invert.is-loading, .btn-ghost-invert:disabled { pointer-events: none; opacity: 0.85; }
        .btn-icon { display: inline-flex; line-height: 0; }
        .btn-label { white-space: nowrap; }

        .sticky-action-bar {
          position: fixed; bottom: 0; left: 0; width: 100%;
          display: flex; justify-content: space-between; align-items: center;
          background: #ffffff; padding: 12px 24px;
          box-shadow: 0 -2px 12px rgba(0,0,0,0.08);
          z-index: 1000; transition: transform .3s ease, opacity .3s ease;
        }
        .sticky-action-bar.hide { transform: translateY(100%); opacity: 0; pointer-events: none; }

        .left-actions, .right-actions { display: flex; align-items: center; gap: 12px; }

        .proceed-btn { background: var(--tp-theme-secondary, #0f172a); border-color: var(--tp-theme-secondary, #0f172a); }
        .proceed-btn:hover { background: var(--tp-common-white); color: var(--tp-theme-secondary, #0f172a); }

        @media (max-width: 640px) {
          .sticky-action-bar { flex-direction: column; gap: 10px; align-items: stretch; }
          .left-actions, .right-actions { justify-content: space-between; width: 100%; }
        }
      `}</style>
    </>
  );
};

export default CartArea;
