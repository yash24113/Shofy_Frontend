'use client';
import React from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';

import CartCheckout from './cart-checkout';
import CartItem from './cart-item';
import RenderCartProgress from '../common/render-cart-progress';
import { Plus } from '@/svg';
import { selectUserId } from '@/utils/userSelectors';
import {
  useGetCartDataQuery,
  useClearCartMutation
} from '@/redux/features/cartApi';

const CartArea = () => {
  const userId = useSelector(selectUserId);
  const router = useRouter();

  const {
    data: cartResponse,
    isLoading,
    error,
    refetch
  } = useGetCartDataQuery(userId, { skip: !userId });

  const [clearCart, { isLoading: isClearing }] = useClearCartMutation();

  const cart_products =
    cartResponse?.data?.items?.map((item) => (item?.productId
      ? {
          ...(item.productId || {}),
          title: item.productId?.name,
          _id: item.productId?._id,
          orderQuantity: item.quantity,
          cartItemId: item._id,
        }
      : null
    )).filter(Boolean) || [];

  const handleAddProduct = () => router.push('/shop');

  const handleClearCart = async () => {
    if (isClearing) return;
    try {
      await clearCart().unwrap();
      refetch();
    } catch (e) {
      console.error('Failed to clear cart:', e);
    }
  };

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
              <div className="col-xl-9 col-lg-8">
                <div className="tp-cart-list mb-25 mr-30">
                  <div className="cartmini__shipping">
                    <RenderCartProgress />
                  </div>

                  <table className="table tp-cart-table">
                    {/* lock desktop column widths */}
                    <colgroup>
                      <col className="colw-product" />
                      <col className="colw-price" />
                      <col className="colw-qty" />
                      <col className="colw-action" />
                    </colgroup>

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

                {/* bottom actions */}
                <div className="tp-cart-bottom">
                  <div className="row align-items-end justify-content-between g-3">
                    <div className="col-md-6">
                      <div className="tp-cart-actions-left center-left">
                        <button
                          type="button"
                          onClick={handleAddProduct}
                          className="btn-ghost-invert square"
                          title="Browse products"
                        >
                          <span className="btn-icon" aria-hidden="true"><Plus /></span>
                          <span className="btn-label">Add Product</span>
                        </button>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="tp-cart-update text-md-end">
                        <button
                          onClick={handleClearCart}
                          disabled={isClearing}
                          type="button"
                          className={`btn-ghost-invert square ${isClearing ? 'is-loading' : ''}`}
                          title="Remove all items"
                        >
                          {isClearing ? 'Clearing…' : 'Clear Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* summary */}
              <div className="col-xl-3 col-lg-4 col-md-6">
                <CartCheckout />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Button + table layout styles – MATCH CartItem buttons */}
      <style jsx>{`
        .center-left { display:flex; justify-content:center; align-items:center; }

        .tp-cart-table { table-layout: fixed; width: 100%; }
        .colw-product { width: 52%; }
        .colw-price   { width: 10%; }
        .colw-qty     { width: 18%; }
        .colw-action  { width: 20%; }
        thead th { font-weight:700; color:#0f172a; padding:10px 12px; }
        .text-right { text-align:right; }

        @media (max-width:1200px){
          .colw-product { width: 50%; }
          .colw-price   { width: 12%; }
          .colw-qty     { width: 18%; }
          .colw-action  { width: 20%; }
        }
        @media (max-width:760px){
          .tp-cart-table { table-layout:auto; }
        }

        /* === SAME BUTTON STYLE AS CART ITEM === */
        .btn-ghost-invert {
          display:inline-flex; align-items:center; gap:8px;
          min-height:44px; padding:10px 18px;
          font-weight:600; font-size:15px; line-height:1;
          cursor:pointer; user-select:none;
          background: var(--tp-theme-primary);
          color: var(--tp-common-white);
          border: 1px solid var(--tp-theme-primary);
          box-shadow: 0 6px 18px rgba(0,0,0,0.12);
          transition: color .18s, background-color .18s, border-color .18s, box-shadow .18s, transform .12s;
        }
        .btn-ghost-invert.square{ border-radius:0; }
        .btn-ghost-invert.icon-only{ width:44px; padding:0; justify-content:center; }
        .btn-ghost-invert:hover{
          background-color: var(--tp-common-white);
          border-color: var(--tp-theme-primary);
          color: var(--tp-theme-primary);
          box-shadow: 0 0 0 1px var(--tp-theme-primary) inset, 0 8px 20px rgba(0,0,0,0.08);
          transform: translateY(-1px);
        }
        .btn-ghost-invert.is-loading,
        .btn-ghost-invert:disabled{ pointer-events:none; opacity:.85; }

        .btn-icon{ display:inline-flex; line-height:0; }
        .btn-label{ white-space:nowrap; }

        .tp-cart-actions-left, .tp-cart-update{ display:flex; align-items:center; }
        .tp-cart-update{ justify-content:flex-end; }
        @media (max-width:640px){
          .tp-cart-update{ justify-content:flex-start; }
          .btn-ghost-invert{ min-height:44px; padding:10px 18px; }
        }
      `}</style>
    </>
  );
};

export default CartArea;
