'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
// internal
import useCartInfo from '@/hooks/use-cart-info';
import RenderCartProgress from './render-cart-progress';
import empty_cart_img from '@assets/img/product/cartmini/empty-cart.png';
import { closeCartMini } from '@/redux/features/cartSlice';
import { selectUserId } from '@/utils/userSelectors';
import { 
  useGetCartDataQuery, 
  useRemoveCartItemMutation 
} from '@/redux/features/cartApi';

const CartMiniSidebar = () => {
  const { cartMiniOpen } = useSelector((state) => state.cart);
  const userId = useSelector(selectUserId);
  const { total } = useCartInfo();
  const dispatch = useDispatch();
  
  // Fetch cart data using API
  const { 
    data: cartResponse, 
    isLoading 
  } = useGetCartDataQuery(userId, {
    skip: !userId,
  });
  
  const [removeCartItem, { isLoading: isRemoving }] = useRemoveCartItemMutation();
  
  // Debug logging
  console.log('Cart Mini Debug:', {
    userId,
    cartData: cartResponse,
    isLoading,
    cartDataKeys: cartResponse ? Object.keys(cartResponse) : 'no data'
  });
  
  const cart_products = cartResponse?.items || [];

  // handle remove product
  const handleRemovePrd = async (productId) => {
    if (isRemoving || !userId || !productId) return;
    try {
      await removeCartItem({ productId, userId }).unwrap();
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  }

// handle close cart mini 
const handleCloseCartMini = () => {
  dispatch(closeCartMini())
}
  return (
    <>
      <div className={`cartmini__area tp-all-font-roboto ${cartMiniOpen ? 'cartmini-opened' : ''}`}>
        <div className="cartmini__wrapper d-flex justify-content-between flex-column">
          <div className="cartmini__top-wrapper">
            <div className="cartmini__top p-relative">
              <div className="cartmini__top-title">
                <h4>Shopping cart</h4>
              </div>
              <div className="cartmini__close">
                <button onClick={() => dispatch(closeCartMini())} type="button" className="cartmini__close-btn cartmini-close-btn">
                  <i className="fal fa-times"></i>
                </button>
              </div>
            </div>
            <div className="cartmini__shipping">
              <RenderCartProgress/>
            </div>
            {cart_products.length > 0 && <div className="cartmini__widget">
              {cart_products.map((item) => {
                const PID = item.productId || item._id || item.id;
                const slug = item.slug || PID;
                const href = `/fabric/${slug}`;
                
                const rawImg = item.img || item.image || "";
                const imageUrl = rawImg?.startsWith("http")
                  ? rawImg
                  : rawImg
                  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${rawImg}`
                  : '/assets/img/product/default-product-img.jpg';

                return (
                  <div key={PID} className="cartmini__widget-item">
                    <div className="cartmini__thumb">
                      <Link href={href}>
                        <Image src={imageUrl} width={70} height={60} alt="product img" />
                      </Link>
                    </div>
                    <div className="cartmini__content">
                      <h5 className="cartmini__title">
                        <Link href={href}>{item.name || item.title}</Link>
                      </h5>
                      <div className="cartmini__price-wrapper">
                        {item.discount > 0 ? (
                          <span className="cartmini__price">
                            ${(Number(item.salesPrice) - (Number(item.salesPrice) * Number(item.discount)) / 100).toFixed(2)}
                          </span>
                        ) : (
                          <span className="cartmini__price">
                            ${(Number(item.salesPrice) || 0).toFixed(2)}
                          </span>
                        )}
                        <span className="cartmini__quantity">{" "}x{item.orderQuantity}</span>
                      </div>
                    </div>
                    <a 
                      onClick={() => handleRemovePrd(PID)} 
                      className={`cartmini__del cursor-pointer ${isRemoving ? 'loading' : ''}`}
                      style={{ opacity: isRemoving ? 0.6 : 1 }}
                    >
                      <i className="fa-regular fa-xmark"></i>
                    </a>
                  </div>
                );
              })}
            </div>}
            {/* if no item in cart */}
            {cart_products.length === 0 && <div className="cartmini__empty text-center">
              <Image src={empty_cart_img} alt="empty-cart-img" />
              <p>Your Cart is empty</p>
              <Link href="/shop" className="tp-btn">Go to Shop</Link>
            </div>}
          </div>
          <div className="cartmini__checkout">
            <div className="cartmini__checkout-title mb-30">
              <h4>Subtotal:</h4>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="cartmini__checkout-btn">
              <Link href="/cart" onClick={handleCloseCartMini} className="tp-btn mb-10 w-100"> view cart</Link>
              <Link href="/checkout" onClick={handleCloseCartMini} className="tp-btn tp-btn-border w-100"> checkout</Link>
            </div>
          </div>
        </div>
      </div>
      {/* overlay start */}
      <div onClick={handleCloseCartMini} className={`body-overlay ${cartMiniOpen ? 'opened' : ''}`}></div>
      {/* overlay end */}
    </>
  );
};

export default CartMiniSidebar;