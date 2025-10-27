'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { FaCheck } from 'react-icons/fa';
import { useGetCartDataQuery } from '@/redux/features/cartApi';
import { selectUserId } from '@/utils/userSelectors';

// NEW: use our RTK mutation to create the order
import { useCreateOrderMutation } from '@/redux/features/order/orderApi';

/* ---------- helpers ---------- */
const splitName = (fullName) => {
  const parts = String(fullName || '').trim().split(/\s+/);
  const firstName = parts.shift() || '';
  const lastName = parts.join(' ') || '';
  return { firstName, lastName };
};

const safeGetLocalUserId = () => {
  if (typeof window === 'undefined') return null;
  try {
    const id = localStorage.getItem('userId');
    return id && id.trim() ? id.trim() : null;
  } catch {
    return null;
  }
};

const CheckoutArea = () => {
  const router = useRouter();

  // Redux userId (fallback to localStorage)
  const reduxUserId = useSelector(selectUserId);
  const localUserId = safeGetLocalUserId();
  const userId = reduxUserId || localUserId || null;

  // Mutations
  const [createOrder, { isLoading: creatingOrder }] = useCreateOrderMutation();

  // UI / form state
  const [activeStep] = useState(2); // 1: cart, 2: checkout, 3: complete
  const [shippingMethod, setShippingMethod] = useState('free'); // 'free' | 'flat' | 'local'
  const [shippingCost, setShippingCost] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    country: 'United States (US)', // matches visible option labels
    streetAddress: '',
    city: '',
    postcode: '',
    phone: '',
    email: '',
    orderNotes: '',
    paymentUI: 'online', // 'online' | 'cod'
  });

  // Fetch cart data
  const { data: cartData, isLoading, error, refetch } = useGetCartDataQuery(userId, {
    skip: !userId,
  });

  // Normalize cart items
  const cart_products = useMemo(() => cartData?.data?.items ?? [], [cartData]);

  // Subtotal from cart
  const subtotal = useMemo(
    () =>
      cart_products.reduce((sum, item) => {
        const price = Number(item?.productId?.price ?? 0);
        const qty = Number(item?.quantity ?? 1);
        return sum + price * qty;
      }, 0),
    [cart_products]
  );

  const total = useMemo(() => {
    const t = subtotal + shippingCost - couponDiscount;
    return t < 0 ? 0 : t;
  }, [subtotal, shippingCost, couponDiscount]);

  /* ---------- Auth guard ---------- */
  useEffect(() => {
    const isAuthenticated = Cookies.get('userInfo');
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
    }
  }, [router]);

  /* ---------- Fetch & prefill profile ---------- */
  useEffect(() => {
    let alive = true;
    if (!userId) return;

    (async () => {
      try {
        const res = await fetch(`https://test.amrita-fashions.com/shopy/users/${userId}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          credentials: 'include',
          cache: 'no-store',
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Profile HTTP ${res.status}: ${text || 'Failed to load user'}`);
        }

        const json = await res.json();
        const apiUser = json?.user;

        if (!apiUser || !apiUser._id) throw new Error('Invalid profile response');
        if (apiUser._id !== userId) {
          toast.error('Loaded profile does not match the current user.');
          return;
        }

        const { firstName, lastName } = splitName(apiUser.name);

        if (!alive) return;
        setFormData((prev) => ({
          ...prev,
          firstName,
          lastName,
          email: apiUser.email || prev.email || '',
          phone: apiUser.phone || prev.phone || '',
          streetAddress: apiUser.address || prev.streetAddress || '',
          city: apiUser.city || prev.city || '',
          // IMPORTANT: match screenshot (labels with country codes)
          country:
            apiUser.country && /india/i.test(apiUser.country)
              ? 'India (IN)'
              : apiUser.country && /united states|usa|us/i.test(apiUser.country)
              ? 'United States (US)'
              : apiUser.country && /united kingdom|uk/i.test(apiUser.country)
              ? 'United Kingdom (UK)'
              : apiUser.country && /canada/i.test(apiUser.country)
              ? 'Canada (CA)'
              : apiUser.country && /australia/i.test(apiUser.country)
              ? 'Australia (AU)'
              : prev.country || 'United States (US)',
          postcode: apiUser.pincode || prev.postcode || '',
        }));
      } catch (e) {
        console.error('Failed to prefill profile:', e);
        toast.error('Could not load profile details.');
      }
    })();

    return () => {
      alive = false;
    };
  }, [userId]);

  /* ---------- Handlers ---------- */
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? Boolean(checked) : value,
    }));
  }, []);

  const handleShippingChange = useCallback((e) => {
    const value = e.target.value; // 'free' | 'flat' | 'local'
    setShippingMethod(value);
    const cost = value === 'free' ? 0 : value === 'flat' ? 15 : 8;
    setShippingCost(cost);
  }, []);

  const handleApplyCoupon = useCallback(
    (e) => {
      e.preventDefault();
      if (!couponCode.trim()) {
        setCouponDiscount(0);
        toast.info('Enter a coupon code');
        return;
      }
      if (couponCode.trim().toLowerCase() === 'welcome10') {
        setCouponDiscount(10);
        toast.success('Coupon applied successfully!');
      } else {
        setCouponDiscount(0);
        toast.error('Invalid coupon code');
      }
    },
    [couponCode]
  );

  const handleSubmitOrder = useCallback(
    async (e) => {
      e.preventDefault();
      if (!cart_products.length) {
        toast.error('Your cart is empty');
        return;
      }
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.email ||
        !formData.phone ||
        !formData.streetAddress ||
        !formData.city ||
        !formData.postcode ||
        !formData.country
      ) {
        toast.error('Please fill all required fields');
        return;
      }

      try {
        const productId = cart_products.map((it) => it?.productId?._id).filter(Boolean);
        const quantity = cart_products.map((it) => Number(it?.quantity ?? 1));
        const price = cart_products.map((it) => Number(it?.productId?.price ?? 0));

        const shipping =
          shippingMethod === 'free' ? 'standard' : shippingMethod === 'flat' ? 'flat' : 'local';
        const payment = formData.paymentUI; // 'online' | 'cod'

        const payload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          // NOTE: backend sample used "USA" etc.; we’ll send plain country name
          country:
            formData.country.includes('United States') ? 'USA' :
            formData.country.includes('United Kingdom') ? 'UK' :
            formData.country.includes('Canada') ? 'Canada' :
            formData.country.includes('Australia') ? 'Australia' :
            formData.country.includes('India') ? 'India' : formData.country,
          streetAddress: formData.streetAddress,
          city: formData.city,
          postcode: formData.postcode,
          phone: formData.phone,
          email: formData.email,
          shippingInstructions: formData.orderNotes || '',
          total,
          payment,
          discount: couponDiscount,
          shipping,
          shippingCost,
          userId,
          productId,
          quantity,
          price,
        };

        const resp = await createOrder(payload).unwrap();

        const createdOrder = resp?.data?.order || null;
        if (createdOrder) {
          // Store for OrderArea display/print
          if (typeof window !== 'undefined') {
            localStorage.setItem('lastOrder', JSON.stringify(createdOrder));
          }
        }

        toast.success('Order placed successfully!');
        const orderId = createdOrder?._id;
if (orderId) {
  router.push(`/order/${orderId}`);
} else {
  router.push(`/order-confirmation?userId=${userId}`);
}

      } catch (err) {
        console.error('Order submission failed:', err);
        toast.error('Failed to place order. Please try again.');
      }
    },
    [
      cart_products,
      couponDiscount,
      createOrder,
      formData.city,
      formData.country,
      formData.email,
      formData.firstName,
      formData.lastName,
      formData.orderNotes,
      formData.paymentUI,
      formData.phone,
      formData.postcode,
      formData.streetAddress,
      router,
      shippingCost,
      shippingMethod,
      total,
      userId,
    ]
  );

  /* ---------- Loading / Error UIs ---------- */
  if (isLoading) {
    return (
      <div className="loader-wrap">
        <div className="spinner" />
        <p>Loading your cart...</p>
        <style jsx>{`
          .loader-wrap {
            min-height: 50vh;
            display: grid;
            place-content: center;
            gap: 16px;
            color: #253d4e;
          }
          .spinner {
            width: 50px;
            height: 50px;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #3bb77e;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error) {
    const message = error?.message ?? 'Please try again later';
    return (
      <div className="error-wrap">
        <div className="msg">Failed to load cart: {message}</div>
        <button onClick={() => refetch()}>Retry</button>
        <style jsx>{`
          .error-wrap { max-width: 800px; margin: 40px auto; padding: 30px; background: #fff8f8; border: 1px solid #ffdddd; border-radius: 8px; text-align: center; }
          .msg { color: #d32f2f; font-size: 16px; margin-bottom: 20px; }
          button { background: #3bb77e; color: #fff; border: 0; padding: 10px 24px; border-radius: 6px; font-weight: 600; cursor: pointer; }
          button:hover { filter: brightness(0.95); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        {/* Header + steps */}
        <div className="checkout-header">
          <h1>Checkout</h1>
          <div className="checkout-steps">
            {['Shopping Cart', 'Checkout', 'Order Complete'].map((label, idx) => {
              const step = idx + 1;
              const active = step <= activeStep;
              return (
                <div className="step-wrap" key={label}>
                  <div className={`step ${active ? 'active' : ''}`}>
                    <span className="step-number">
                      {active && step < activeStep ? <FaCheck /> : step}
                    </span>
                    <span className="step-text">{label}</span>
                  </div>
                  {step < 3 && <div className={`step-connector ${active ? 'active' : ''}`} />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="checkout-content">
          {/* Left: Billing form */}
          <div className="checkout-section">
            <h3>Billing Details</h3>

            <form className="billing-form" onSubmit={(e) => e.preventDefault()}>
              {/* Row 1: First name, Last name */}
              <div className="form-row">
                <div className="form-group">
                  <label>First Name <span className="required">*</span></label>
                  <input type="text" name="firstName" className="form-control" value={formData.firstName} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Last Name <span className="required">*</span></label>
                  <input type="text" name="lastName" className="form-control" value={formData.lastName} onChange={handleInputChange} required />
                </div>
              </div>

              {/* Row 2: Country (full width) */}
              <div className="form-row">
                <div className="form-group full">
                  <label>Country <span className="required">*</span></label>
                  <select name="country" className="form-control" value={formData.country} onChange={handleInputChange} required>
                    <option value="United States (US)">United States (US)</option>
                    <option value="United Kingdom (UK)">United Kingdom (UK)</option>
                    <option value="Canada (CA)">Canada (CA)</option>
                    <option value="Australia (AU)">Australia (AU)</option>
                    <option value="India (IN)">India (IN)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Street Address (full width) */}
              <div className="form-row">
                <div className="form-group full">
                  <label>Street address <span className="required">*</span></label>
                  <input type="text" name="streetAddress" className="form-control" placeholder="House number and street name" value={formData.streetAddress} onChange={handleInputChange} required />
                </div>
              </div>

              {/* Row 4: Town / City + Postcode */}
              <div className="form-row">
                <div className="form-group">
                  <label>Town / City <span className="required">*</span></label>
                  <input type="text" name="city" className="form-control" value={formData.city} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Postcode ZIP <span className="required">*</span></label>
                  <input type="text" name="postcode" className="form-control" value={formData.postcode} onChange={handleInputChange} required />
                </div>
              </div>

              {/* Row 5: Phone */}
              <div className="form-row">
                <div className="form-group full">
                  <label>Phone <span className="required">*</span></label>
                  <input type="tel" name="phone" className="form-control" value={formData.phone} onChange={handleInputChange} required />
                </div>
              </div>

              {/* Row 6: Email */}
              <div className="form-row">
                <div className="form-group full">
                  <label>Email address <span className="required">*</span></label>
                  <input type="email" name="email" className="form-control" value={formData.email} onChange={handleInputChange} required />
                </div>
              </div>

              {/* Row 7: Order notes */}
              <div className="form-row">
                <div className="form-group full">
                  <label>Order notes (optional)</label>
                  <textarea className="form-control" name="orderNotes" rows={4} placeholder="Notes about your order, e.g. special notes for delivery." value={formData.orderNotes} onChange={handleInputChange} />
                </div>
              </div>
            </form>
          </div>

          {/* Right: Order summary */}
          <div className="order-summary">
            <div className="order-summary-header"><h3>Your Order</h3></div>

            <div className="order-products">
              {cart_products.map((item) => {
                const name = item?.productId?.name || 'Product';
                const qty = Number(item?.quantity ?? 1);
                const price = Number(item?.productId?.price ?? 0);
                const line = price * qty;
                const img =
                  item?.productId?.images?.[0]?.url ||
                  item?.productId?.img ||
                  item?.productId?.image ||
                  '/images/placeholder.png';
                return (
                  <div className="order-product-item" key={item._id || item?.productId?._id}>
                    <div className="product-info">
                      <div className="product-image"><img src={img} alt={name} /></div>
                      <div className="product-details"><h4>{name}</h4><div className="product-quantity">× {qty}</div></div>
                    </div>
                    <div className="product-price">${line.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>

            <div className="order-totals">
              <div className="subtotal"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>

              <div className="shipping">
                <span>Shipping</span>
                <div className="shipping-options">
                  <label className="shipping-option">
                    <input type="radio" name="shipping" value="free" checked={shippingMethod === 'free'} onChange={handleShippingChange} />
                    Delivery: Today Cost: $0.00
                  </label>
                  <label className="shipping-option">
                    <input type="radio" name="shipping" value="flat" checked={shippingMethod === 'flat'} onChange={handleShippingChange} />
                    Delivery: 7 Days Cost: $15.00
                  </label>
                  <label className="shipping-option">
                    <input type="radio" name="shipping" value="local" checked={shippingMethod === 'local'} onChange={handleShippingChange} />
                    Local pickup: $8.00
                  </label>
                </div>
              </div>

              <div className="total"><span>Total</span><span className="total-amount">${total.toFixed(2)}</span></div>
            </div>

            {/* Payment */}
            <div className="tp-checkout-payment">
              <h4>Payment</h4>
              <label className="payment-method">
                <input type="radio" name="paymentUI" value="online" checked={formData.paymentUI === 'online'} onChange={handleInputChange} />
                Credit Card
              </label>
              <label className="payment-method">
                <input type="radio" name="paymentUI" value="cod" checked={formData.paymentUI === 'cod'} onChange={handleInputChange} />
                Cash on Delivery
              </label>

              <button
                type="button"
                className="place-order-btn"
                onClick={handleSubmitOrder}
                disabled={creatingOrder || cart_products.length === 0}
              >
                {creatingOrder ? 'Processing…' : 'Place Order'}
              </button>
            </div>

            {/* Coupon */}
           
          </div>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .checkout-page { padding: 40px 0; background: #f8f9fa; min-height: 100vh; font-family: system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial,'Noto Sans','Apple Color Emoji','Segoe UI Emoji'; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 16px; }
        .checkout-header { text-align: center; margin-bottom: 32px; }
        .checkout-header h1 { font-size: 34px; font-weight: 700; color: #253d4e; margin: 0 0 12px; }
        .checkout-steps { display: flex; justify-content: center; align-items: center; gap: 12px; flex-wrap: wrap; }
        .step-wrap { display: flex; align-items: center; gap: 12px; }
        .step { display: flex; flex-direction: column; align-items: center; color: #b6b6b6; }
        .step.active { color: #3bb77e; }
        .step-number { width: 40px; height: 40px; display: grid; place-content: center; border-radius: 999px; background: #f2f3f4; font-weight: 700; margin-bottom: 6px; color: inherit; }
        .step.active .step-number { background: #3bb77e; color: #fff; }
        .step-text { font-size: 13px; font-weight: 600; }
        .step-connector { width: 80px; height: 2px; background: #e0e0e0; }
        .step-connector.active { background: #3bb77e; }

        .checkout-content { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .checkout-section, .order-summary { background: #fff; border-radius: 10px; padding: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .checkout-section h3, .order-summary h3 { font-size: 20px; font-weight: 700; color: #253d4e; margin: 0 0 16px; padding-bottom: 12px; border-bottom: 1px solid #eee; }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .form-group { margin-bottom: 0; }
        .form-group.full { grid-column: 1 / -1; }
        .form-group label { display: block; margin-bottom: 6px; font-weight: 600; color: #253d4e; }
        .form-control { width: 100%; padding: 12px 14px; border: 1px solid #e5e5e5; border-radius: 6px; font-size: 14px; transition: box-shadow .2s,border-color .2s; background: #fff; }
        .form-control:focus { border-color: rgb(74,104,90); box-shadow: 0 0 0 .2rem rgba(59,183,126,.2); outline: none; }
        select.form-control { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; background-size: 16px; padding-right: 36px; }
        .required { color: #dc3545; }

        .order-products { margin-bottom: 16px; border-bottom: 1px solid #eee; padding-bottom: 12px; }
        .order-product-item { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; }
        .product-info { display: flex; align-items: center; gap: 12px; }
        .product-image { width: 64px; height: 64px; border-radius: 8px; overflow: hidden; border: 1px solid #eee; flex-shrink: 0; }
        .product-image img { width: 100%; height: 100%; object-fit: cover; }
        .product-details h4 { margin: 0 0 2px; font-size: 14px; font-weight: 700; color: #253d4e; }
        .product-quantity { font-size: 13px; color: #7e7e7e; }
        .product-price { font-weight: 700; color: #3bb77e; }

        .order-totals { margin: 8px 0 16px; padding-bottom: 12px; border-bottom: 1px solid #eee; }
        .subtotal, .total { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .shipping { margin: 10px 0; }
        .shipping > span { display: block; font-weight: 700; margin-bottom: 8px; }
        .shipping-options { display: grid; gap: 8px; }
        .shipping-option { display: flex; gap: 10px; align-items: center; font-size: 14px; }
        .total { font-size: 18px; font-weight: 800; color: #253d4e; padding-top: 12px; border-top: 1px solid #eee; }
        .total-amount { color: #3bb77e; font-size: 22px; }

        .tp-checkout-payment .payment-method { display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid #eee; border-radius: 8px; margin: 8px 0; font-weight: 600; }
        .place-order-btn { width: 100%; background: #1677ff; color: #fff; border: 0; border-radius: 8px; padding: 14px; font-size: 16px; font-weight: 800; cursor: pointer; transition: filter .2s, transform .1s; margin-top: 10px; }
        .place-order-btn:hover { filter: brightness(0.96); }
        .place-order-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        @media (max-width: 991px) {
          .checkout-content { grid-template-columns: 1fr; }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default CheckoutArea;
