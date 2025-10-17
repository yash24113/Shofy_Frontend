'use client';
import React, { useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';

// internal
import { closeCartMini } from '@/redux/features/cartSlice';
import { selectUserId } from '@/utils/userSelectors';
import useCartInfo from '@/hooks/use-cart-info'; // keep if you still use it elsewhere
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
  // server product object fields
  const candidates = [
    p?.image1,
    p?.img,
    p?.image2,
    p?.image,
    p?.videoThumbnail,
  ].filter(Boolean);
  const url = candidates.find((x) => typeof x === 'string' && x.trim() !== '');
  return url || '/assets/img/product/default-product-img.jpg';
};

const pickSlug = (p) => p?.slug || p?._id || p?.id || '';

const toCurrency = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return '0.00';
  return x.toFixed(2);
};

const CartMiniSidebar = () => {
  const dispatch = useDispatch();
  const { cartMiniOpen } = useSelector((s) => s.cart);
  const userId = useSelector(selectUserId);

  // Server cart
  const { data: cartResponse, isLoading } = useGetCartDataQuery(userId, {
    skip: !userId,
  });

  const [removeCartItem, { isLoading: isRemoving }] = useRemoveCartItemMutation();

  // Normalize server response (supports both {items:[]} and {data:{items:[]}})
  const serverItems = useMemo(() => {
    const items =
      cartResponse?.data?.items ||
      cartResponse?.items ||
      [];
    return Array.isArray(items) ? items : [];
  }, [cartResponse]);

  // Subtotal: if API provides cartTotal use it, else compute locally as quantity * (server price if any)
  const subtotal = useMemo(() => {
    const apiTotal =
      cartResponse?.data?.cartTotal ??
      cartResponse?.cartTotal ??
      null;

    if (typeof apiTotal === 'number' && Number.isFinite(apiTotal)) {
      return apiTotal;
    }
    // fallback: compute if you later add price on server
    // currently your sample has no price per item; keep 0.00
    return 0;
  }, [cartResponse]);

  const handleCloseCartMini = useCallback(() => {
    dispatch(closeCartMini());
  }, [dispatch]);

  // Remove from cart → add to wishlist
  const handleRemoveAndWishlist = useCallback(
    async (cartItem) => {
      if (!userId || !cartItem || isRemoving) return;
      const product = cartItem?.productId || cartItem?.product || null;
      const productId = product?._id || cartItem?.productId || cartItem?._id;

      try {
        // 1) Remove from server cart
        await removeCartItem({ productId, userId }).unwrap();

        // 2) Add to wishlist (client action → your wishlist slice will POST as you implemented)
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
      } catch (err) {
        // prefer a toast in your project
        console.error('Remove cart & add to wishlist failed:', err);
      }
    },
    [dispatch, isRemoving, removeCartItem, userId]
  );

  const hasItems = serverItems.length > 0;

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
                {serverItems.map((ci) => {
                  const p = ci?.productId || ci?.product || {};
                  const pid = p?._id || ci?._id || ci?.productId;
                  const slug = pickSlug(p);
                  const href = slug ? `/fabric/${slug}` : '#';
                  const imageUrl = pickImg(p);

                  return (
                    <div key={`${pid}-${ci?._id || ''}`} className="cartmini__widget-item">
                      <div className="cartmini__thumb">
                        <Link href={href}>
                          <Image
                            src={imageUrl}
                            width={70}
                            height={60}
                            alt={p?.name || p?.title || 'product'}
                          />
                        </Link>
                      </div>

                      <div className="cartmini__content">
                        <h5 className="cartmini__title">
                          <Link href={href}>{p?.name || p?.title || 'Product'}</Link>
                        </h5>

                        <div className="cartmini__price-wrapper">
                          {/* No price in sample response – show quantity cleanly */}
                          <span className="cartmini__price">—</span>
                          <span className="cartmini__quantity"> x{ci?.quantity ?? 1}</span>
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
    </>
  );
};

export default CartMiniSidebar;
