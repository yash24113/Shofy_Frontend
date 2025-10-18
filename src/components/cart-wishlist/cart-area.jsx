'use client';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
// internal
import CartCheckout from './cart-checkout';
import CartItem from './cart-item';
import RenderCartProgress from '../common/render-cart-progress';
import { Plus } from '@/svg';
import { selectUserId } from '@/utils/userSelectors';
import { 
  useGetCartDataQuery, 
  useClearCartMutation 
} from '@/redux/features/cartApi';
import { add_cart_product } from '@/redux/features/cartSlice';
import { useCartDebug } from '@/hooks/use-cart-debug';

const CartArea = () => {
  const userId = useSelector(selectUserId);
  const router = useRouter();
  
  // Debug cart data
  useCartDebug();
  
  // Fetch cart data using API
  const { 
    data: cartResponse, 
    isLoading, 
    error,
    refetch 
  } = useGetCartDataQuery(userId, {
    skip: !userId, // Skip query if no userId
  });
  
  const [clearCart, { isLoading: isClearing }] = useClearCartMutation();
  
  // Debug logging
  console.log('Cart Debug:', {
    userId,
    cartData: cartResponse,
    isLoading,
    error,
    cartDataKeys: cartResponse ? Object.keys(cartResponse) : 'no data'
  });
  
  const cart_products =
    cartResponse?.data?.items?.map((item) => ({
      ...(item.productId || {}),
      title: item.productId?.name,
      _id: item.productId?._id,
      orderQuantity: item.quantity,
      cartItemId: item._id,
    })) || [];

  const handleAddProduct = () => router.push('/shop');
  
  const handleClearCart = async () => {
    if (isClearing) return;
    try {
      await clearCart().unwrap();
      // Optionally refetch cart data
      refetch();
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  // Temporary test function to add sample cart data
  const addTestCartData = () => {
    const testProduct = {
      _id: 'test-product-1',
      id: 'test-product-1',
      title: 'Test Product',
      salesPrice: 29.99,
      price: 29.99,
      orderQuantity: 2,
      quantity: 10,
      img: '/images/placeholder-portrait.webp',
      image: '/images/placeholder-portrait.webp',
      slug: 'test-product-1'
    };
    dispatch(add_cart_product(testProduct));
  };

  // Test API endpoints directly
  const testApiEndpoints = async () => {
    console.log('=== Testing API Endpoints ===');
    console.log('User ID:', userId);
    console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
    
    // Test cart fetch
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/cart/user/${userId}`);
      const data = await response.json();
      console.log('Direct API Test - Cart Data:', data);
    } catch (error) {
      console.error('Direct API Test - Error:', error);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <section className="tp-cart-area pb-120">
        <div className="container">
          <div className="text-center pt-50">
            <h3>Loading cart...</h3>
          </div>
        </div>
      </section>
    );
  }

  // Show error state
  if (error) {
    return (
      <section className="tp-cart-area pb-120">
        <div className="container">
          <div className="text-center pt-50">
            <h3>Error loading cart</h3>
            <p>Please try again later.</p>
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
                  className="btn-ghost-invert square mr-10"
                  onClick={() => router.push('/shop')}
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

                  <table className="table">
                    <thead>
                      <tr>
                        <th colSpan={2} className="tp-cart-header-product">Product</th>
                        <th className="tp-cart-header-price">Price</th>
                        <th className="tp-cart-header-quantity">Quantity</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart_products.map((item, i) => (
                        <CartItem key={item.cartItemId || item._id || i} product={item} />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bottom actions row */}
                <div className="tp-cart-bottom">
                  <div className="row align-items-end justify-content-between g-3">
                    {/* LEFT: Add Product */}
                    <div className="col-md-6">
                      <div className="tp-cart-actions-left center-left">
                        <button
                          type="button"
                          onClick={handleAddProduct}
                          className="btn-ghost-invert square"
                          title="Browse products"
                          aria-label="Add Product"
                        >
                          <span className="btn-icon" aria-hidden="true"><Plus /></span>
                          <span className="btn-label">Add Product</span>
                        </button>
                      </div>
                    </div>

                    {/* RIGHT: Clear Cart */}
                    <div className="col-md-6">
                      <div className="tp-cart-update text-md-end">
                        <button
                          onClick={handleClearCart}
                          disabled={isClearing}
                          type="button"
                          className={`btn-ghost-invert square ${isClearing ? 'loading' : ''}`}
                          title="Remove all items from cart"
                        >
                          {isClearing ? 'Clearing...' : 'Clear Cart'}
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

      {/* Internal styles – default solid dark navy, hover outlined (square option) */}
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
          box-shadow:0 6px 18px rgba(0,0,0,0.22);
          transform:translateZ(0);

          transition: background 180ms ease, color 180ms ease,
                      border-color 180ms ease, box-shadow 180ms ease,
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
        .btn-ghost-invert:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-ghost-invert.loading {
          opacity: 0.7;
        }

        .mr-10 {
          margin-right: 10px;
        }

        .btn-icon { display:inline-flex; align-items:center; justify-content:center; line-height:0; }
        .btn-label { white-space:nowrap; }

        .tp-cart-actions-left, .tp-cart-update { display:flex; align-items:center; }
        .tp-cart-update { justify-content:flex-end; }

        @media (max-width:640px){
          .btn-ghost-invert { min-height:44px; padding:10px 18px; border-radius:8px; }
          .btn-ghost-invert.square { border-radius:0; } /* keep square on mobile */
          .tp-cart-update { justify-content:flex-start; }
        }
      `}</style>
    </>
  );
};

export default CartArea;