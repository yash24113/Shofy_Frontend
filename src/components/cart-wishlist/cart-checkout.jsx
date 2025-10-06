'use client';
import React, { useState } from "react";
import Link from "next/link";
import useCartInfo from "@/hooks/use-cart-info";

const CartCheckout = () => {
  const { total } = useCartInfo();
  const [shipCost, setShipCost] = useState(0);

  // handle shipping cost
  const handleShippingCost = (value) => {
    if (value === "free") {
      setShipCost(0);
    } else {
      setShipCost(value);
    }
  };

  return (
    <>
      <div className="tp-cart-checkout-wrapper">
        <div className="tp-cart-checkout-top d-flex align-items-center justify-content-between">
          <span className="tp-cart-checkout-top-title">Subtotal</span>
          <span className="tp-cart-checkout-top-price">${total}</span>
        </div>

        <div className="tp-cart-checkout-shipping">
          <h4 className="tp-cart-checkout-shipping-title">Shipping</h4>
          <div className="tp-cart-checkout-shipping-option-wrapper">
            <div className="tp-cart-checkout-shipping-option">
              <input id="flat_rate" type="radio" name="shipping" />
              <label htmlFor="flat_rate" onClick={() => handleShippingCost(20)}>
                Flat rate: <span>$20.00</span>
              </label>
            </div>
            <div className="tp-cart-checkout-shipping-option">
              <input id="local_pickup" type="radio" name="shipping" />
              <label htmlFor="local_pickup" onClick={() => handleShippingCost(25)}>
                Local pickup: <span>$25.00</span>
              </label>
            </div>
            <div className="tp-cart-checkout-shipping-option">
              <input id="free_shipping" type="radio" name="shipping" />
              <label htmlFor="free_shipping" onClick={() => handleShippingCost("free")}>
                Free shipping
              </label>
            </div>
          </div>
        </div>

        <div className="tp-cart-checkout-total d-flex align-items-center justify-content-between">
          <span>Total</span>
          <span>${(total + shipCost).toFixed(2)}</span>
        </div>

        <div className="tp-cart-checkout-proceed">
          <Link href="/checkout" className="tp-cart-checkout-btn w-100">
            Proceed to Checkout
          </Link>
        </div>
      </div>

      {/* ===== Internal Styles (Scoped) ===== */}
      <style jsx>{`
        .tp-cart-checkout-wrapper {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          background: #fff;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
        }

        .tp-cart-checkout-top,
        .tp-cart-checkout-total {
          font-weight: 600;
          font-size: 16px;
          color: #111827;
          margin-bottom: 16px;
        }

        .tp-cart-checkout-shipping-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 10px;
          color: #111827;
        }

        .tp-cart-checkout-shipping-option {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .tp-cart-checkout-shipping-option label {
          cursor: pointer;
          color: #374151;
          font-size: 15px;
        }

        .tp-cart-checkout-shipping-option label span {
          font-weight: 500;
        }

        /* === Proceed to Checkout Button === */
        .tp-cart-checkout-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
          text-decoration: none;
          border-radius: 10px;
          padding: 14px 22px;
          background: #0b0b0e; /* black base */
          color: #ffffff;
          border: none;
          transition: background-color 180ms ease, color 180ms ease,
            transform 120ms ease, box-shadow 180ms ease;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22);
        }

        .tp-cart-checkout-btn:hover {
          background: #800000; /* maroon hover */
          color: #ffffff;
          transform: translateY(-1px);
          box-shadow: 0 10px 28px rgba(128, 0, 0, 0.35);
        }

        .tp-cart-checkout-btn:active {
          background: #5e0000; /* darker maroon on click */
          box-shadow: 0 6px 16px rgba(94, 0, 0, 0.35);
          transform: translateY(0);
        }

        .tp-cart-checkout-btn:focus-visible {
          outline: 3px solid rgba(128, 0, 0, 0.45);
          outline-offset: 2px;
        }

        .w-100 {
          width: 100%;
          text-align: center;
        }

        @media (max-width: 640px) {
          .tp-cart-checkout-wrapper {
            padding: 18px;
          }
          .tp-cart-checkout-btn {
            font-size: 15px;
            padding: 12px 18px;
            border-radius: 8px;
          }
        }
      `}</style>
    </>
  );
};

export default CartCheckout;
