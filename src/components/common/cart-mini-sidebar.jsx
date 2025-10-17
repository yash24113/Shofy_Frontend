'use client';
import React, { useMemo, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';

// internal
import { closeCartMini } from '@/redux/features/cartSlice';
import { selectUserId } from '@/utils/userSelectors';
import RenderCartProgress from './render-cart-progress';
import empty_cart_img from '@assets/img/product/cartmini/empty-cart.png';

// RTK Query – server cart
import {
  useGetCartDataQuery,
  useRemoveCartItemMutation,
} from '@/redux/features/cartApi';

// Wishlist
import { add_to_wishlist } from '@/redux/features/wishlist-slice';
import { formatProductForWishlist } from '@/utils/authUtils';

/* ----------------------- helpers ----------------------- */
const pickImg = (p) => {
  const candidates = [p?.img, p?.image1, p?.image2, p?.image, p?.videoThumbnail].filter(Boolean);
  const url = candidates.find((x) => typeof x === 'string' && x.trim() !== '');
  return url || '/assets/img/product/default-product-img.jpg';
};
const pickSlug = (p) => p?.slug || p?._id || p?.id || '';
const toCurrency = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return '0.00';
  return x.toFixed(2);
};
const itemKey = (ci) => {
  const p = ci?.productId || ci?.product || {};
  const pid = p?._id || ci?._id || ci?.productId || '';
  return `${pid}-${ci?._id || ''}`;
};

const CartMiniSidebar = () => {
  const dispatch = useDispatch();
  const { cartMiniOpen } = useSelector((s) => s.cart);
  const userId = useSelector(selectUserId);

  // Server cart + handy refetch
  const {
    data: cartResponse,
    isLoading,
    refetch,
  } = useGetCartDataQuery(userId, {
    skip: !userId,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const [removeCartItem, { isLoading: isRemoving }] = useRemoveCartItemMutation();

  // ---------- Local mirror for optimistic updates ----------
  const serverItems = useMemo(() => {
    const items = cartResponse?.data?.items || cartResponse?.items || [];
    return Array.isArray(items) ? items : [];
  }, [cartResponse]);

  const [localItems, setLocalItems] = useState(serverItems);

  // keep local in sync with server when it changes (but only if we didn’t just perform an optimistic change that’s still pending)
  useEffect(() => {
    setLocalItems(serverItems);
  }, [serverItems]);

  // Subtotal: prefer API total if available
  const subtotal = useMemo(() => {
    const apiTotal =
      cartResponse?.data?.cartTotal ??
      cartResponse?.cartTotal ??
      null;
    return typeof apiTotal === 'number' && Number.isFinite(apiTotal) ? apiTotal : 0;
  }, [cartResponse]);

  const handleCloseCartMini = useCallback(() => {
    dispatch(closeCartMini());
  }, [dispatch]);

  // Remove from cart → add to wishlist (optimistic)
  const handleRemoveAndWishlist = useCallback(
    async (cartItem) => {
      if (!userId || !cartItem || isRemoving) return;

      const product = cartItem?.productId || cartItem?.product || null;
      const productId = (product && product._id) || cartItem?.productId || cartItem?._id;

      // 1) Optimistically remove from local list
      const keyToRemove = itemKey(cartItem);
      setLocalItems((prev) => prev.filter((ci) => itemKey(ci) !== keyToRemove));

      try {
        // 2) Server remove
        await removeCartItem({ productId, userId }).unwrap();

        // 3) Add to wishlist (client action; your slice will POST)
        if (product) {
          const wlPayload = formatProductForWishlist({
            _id: product?._id || productId,
            id: product?._id || productId,
            title: product?.name || product?.title || 'Product',
            name: product?.name || product?.title || 'Product',
            image: pickImg(product),
            imageUrl: pickImg(product),
            slug: pickSlug(product),
          });
          dispatch(add_to_wishlist(wlPayload));
        }

        // 4) Re-sync with server to be safe
        refetch();
      } catch (err) {
        console.error('Remove cart & add to wishlist failed:', err);
        // rollback optimistic change on failure
        setLocalItems((prev) => {
          const alreadyExists = prev.some((ci) => itemKey(ci) === keyToRemove);
          return alreadyExists ? prev : [cartItem, ...prev];
        });
      }
    },
    [dispatch, isRemoving, refetch, removeCartItem, userId]
  );

  const hasItems = localItems.length > 0;

  return (
    <>
      <div className={`cartmini__area tp-all-font-roboto ${cartMiniOpen ? 'cartmini-opened' : ''}`}>
        <div className="cartmini__wrapper d-flex justify-content-between flex-column">
          {/* ---------- Top ---------- */}
          <div className="cartmini__top-wrapper">
            <div className="cartmini__top p-relative">
              <div className="cartmini__top-title">
                <h4>Shopping cart</h4>
              </div>
              <div className="cartmini__close">
                <button
                  onClick={handleCloseCartMini}
                  type="button"
                  className="cartmini__close-btn cartmini-close-btn"
                  aria-label="Close cart"
                >
                  <i className="fal fa-times"></i>
                </button>
              </div>
            </div>

            <div className="cartmini__shipping">
              <RenderCartProgress />
            </div>

            {/* ---------- Items ---------- */}
            {isLoading ? (
              <div className="px-3 py-4 text-sm opacity-75">Loading your cart…</div>
            ) : hasItems ? (
              <div className="cartmini__widget">
                {localItems.map((ci) => {
                  const p = ci?.productId || ci?.product || {};
                  const slug = pickSlug(p);
                  const href = slug ? `/fabric/${slug}` : '#';
                  const imageUrl = pickImg(p);
                  const qty = ci?.quantity ?? 1;

                  return (
                    <div key={itemKey(ci)} className="cartmini__widget-item">
                      <div className="cartmini__thumb">
                        <Link href={href} className="block">
                          <Image
                            src={imageUrl}
                            width={70}
                            height={60}
                            alt={p?.name || p?.title || 'product'}
                            className="rounded"
                          />
                        </Link>
                      </div>

                      <div className="cartmini__content">
                        <h5 className="cartmini__title">
                          <Link href={href}>{p?.name || p?.title || 'Product'}</Link>
                        </h5>

                        <div className="cartmini__price-wrapper">
                          <span className="cartmini__price">—</span>
                          <span className="cartmini__quantity"> x{qty}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveAndWishlist(ci)}
                        className={`cartmini__del cursor-pointer ${isRemoving ? 'loading' : ''}`}
                        style={{ opacity: isRemoving ? 0.6 : 1 }}
                        aria-label="Remove from cart and move to wishlist"
                        title="Move to wishlist"
                      >
                        <i className="fa-regular fa-xmark"></i>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              // ---------- Empty ----------
              <div className="cartmini__empty text-center">
                <Image src={empty_cart_img} alt="empty-cart-img" />
                <p>Your Cart is empty</p>
                <Link href="/shop" className="tp-btn">Go to Shop</Link>
              </div>
            )}
          </div>

          {/* ---------- Checkout ---------- */}
          <div className="cartmini__checkout">
            <div className="cartmini__checkout-title mb-30">
              <h4>Subtotal:</h4>
              <span>
                ₹{toCurrency(subtotal)}
              </span>
            </div>
            <div className="cartmini__checkout-btn">
              <Link href="/cart" onClick={handleCloseCartMini} className="tp-btn mb-10 w-100">
                view cart
              </Link>
              <Link href="/checkout" onClick={handleCloseCartMini} className="tp-btn tp-btn-border w-100">
                checkout
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* overlay */}
      <div onClick={handleCloseCartMini} className={`body-overlay ${cartMiniOpen ? 'opened' : ''}`} />

      {/* Responsive tweaks (scoped) */}
      <style jsx>{`
        .cartmini__widget { max-height: 60vh; overflow: auto; padding-right: 6px; }
        .cartmini__widget-item {
          display: grid;
          grid-template-columns: 72px 1fr auto;
          gap: 12px;
          align-items: center;
          padding: 10px 4px;
          border-bottom: 1px dashed #e8ebf0;
        }
        .cartmini__title { font-size: 14px; line-height: 1.35; margin: 0 0 6px; }
        .cartmini__price-wrapper { font-size: 13px; color: #657083; }
        .cartmini__del { background: transparent; border: 0; padding: 6px; }
        .cartmini__thumb :global(img) { object-fit: cover; }
        
        @media (max-width: 480px) {
          .cartmini__widget-item {
            grid-template-columns: 56px 1fr auto;
            gap: 10px;
          }
          .cartmini__title { font-size: 13px; }
          .cartmini__price-wrapper { font-size: 12px; }
          .cartmini__checkout-title h4 { font-size: 16px; }
        }

        @media (min-width: 1200px) {
          .cartmini__widget { max-height: 66vh; }
        }
      `}</style>
    </>
  );
};

export default CartMiniSidebar;
