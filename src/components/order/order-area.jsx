'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import dayjs from 'dayjs';
import ReactToPrint from 'react-to-print';

import logo from '@assets/img/logo/my_logo.png';
import ErrorMsg from '@/components/common/error-msg';
import PrdDetailsLoader from '@/components/loader/prd-details-loader';
import { useGetUserByIdQuery } from '@/redux/features/order/orderApi';

// helper to read userId if not passed
const safeGetLocalUserId = () => {
  if (typeof window === 'undefined') return null;
  try {
    const id = localStorage.getItem('userId');
    return id && id.trim() ? id.trim() : null;
  } catch {
    return null;
  }
};

const OrderArea = ({ orderId, userId: userIdProp }) => {
  const printRef = useRef();

  // resolve userId: prop -> localStorage
  const userId = userIdProp || safeGetLocalUserId() || null;

  // Load last created order from localStorage (set by Checkout flow)
  const [lastOrder, setLastOrder] = useState(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('lastOrder');
      if (raw) {
        try { setLastOrder(JSON.parse(raw)); } catch(err) {console.warn("err",err)}
      }
    }
  }, []);

  // Fetch user profile for invoice header/details (skip if no userId; we'll still render using lastOrder only)
  const { data: userResp, isError, isLoading } = useGetUserByIdQuery(userId, {
    skip: !userId,
  });
  const user = userResp?.user ?? null;

  // ---- Compute renderable order without hooks ----
  const fallbackOrder = {
    _id: orderId,
    firstName: user?.name?.split(' ')?.[0] || '',
    lastName: user?.name?.split(' ')?.slice(1).join(' ') || '',
    country: user?.country || '',
    streetAddress: user?.address || '',
    city: user?.city || '',
    postcode: user?.pincode || '',
    phone: user?.phone || '',
    email: user?.email || '',
    shippingInstructions: '',
    total: 0,
    payment: 'cod',
    discount: 0,
    shipping: 'standard',
    shippingCost: 0,
    userId: user?._id || userId || '',
    productId: [],
    quantity: [],
    price: [],
    createdAt: new Date().toISOString(),
  };

  const order = lastOrder || fallbackOrder;

  const fullName =
    `${order.firstName || ''} ${order.lastName || ''}`.trim() ||
    (user?.name ?? 'Customer');

  // Build table rows from arrays (fallback names are product IDs since this endpoint doesn’t send names)
  const lineItems = (order.productId || []).map((pid, i) => ({
    title: String(pid),
    qty: (order.quantity || [])[i] ?? 1,
    price: (order.price || [])[i] ?? 0,
  }));

  // ---- Conditional UIs (no hooks below this line) ----
  if (!lastOrder && !user && isLoading) return <PrdDetailsLoader loading={true} />;
  if (!lastOrder && isError) return <ErrorMsg msg="There was an error loading your details." />;

  return (
    <>
      <section className="invoice__area pt-120 pb-120">
        <div className="container">
          <div className="invoice__msg-wrapper">
            <div className="row">
              <div className="col-xl-12">
                <div className="invoice_msg mb-40">
                  <p className="text-black alert alert-success">
                    Thank you <strong>{fullName}</strong>! Your order has been received.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            ref={printRef}
            className="invoice__wrapper grey-bg-2 pt-40 pb-40 pl-40 pr-40 tp-invoice-print-wrapper"
          >
            <div className="invoice__header-wrapper border-2 border-bottom border-white mb-40">
              <div className="row">
                <div className="col-xl-12">
                  <div className="invoice__header pb-20">
                    <div className="row align-items-end">
                      <div className="col-md-4 col-sm-6">
                        <div className="invoice__left">
                          <Image src={logo} alt="logo" />
                          <p>
                            4th Floor, Safal Prelude ,<br />
                            404 Corporate Road, Near YMCA Club, <br />
                            Prahlad Nagar, Ahmedabad, <br />
                            Gujarat,India - 380015
                          </p>
                        </div>
                      </div>
                      <div className="col-md-8 col-sm-6">
                        <div className="invoice__right mt-15 mt-sm-0 text-sm-end">
                          <h3 className="text-uppercase font-70 mb-20">Invoice</h3>
                          <p className="mb-0"><strong>Order ID:</strong> #{order._id || '—'}</p>
                          <p className="mb-0"><strong>Date:</strong> {dayjs(order.createdAt).format('MMMM D, YYYY')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="invoice__customer mb-30">
              <div className="row">
                <div className="col-md-6 col-sm-8">
                  <div className="invoice__customer-details">
                    <h4 className="mb-10 text-uppercase">{fullName}</h4>
                    {/* {(order.country || user?.country) && (
                      <p className="mb-0 text-uppercase">{order.country || user?.country}</p>
                    )}
                    {(order.city || order.postcode || user?.city || user?.pincode) && (
                      <p className="mb-0 text-uppercase">
                        {(order.city || user?.city) ?? ''} {(order.postcode || user?.pincode) ?? ''}
                      </p>
                    )} */}
                     {(order.phone || user?.phone) && <p className="mb-0">{order.phone || user?.phone}</p>} 
                    {(order.email || user?.email) && <p className="mb-0">{order.email || user?.email}</p>}
                    {(order.streetAddress || user?.address) && (
                      <p className="mb-0">{order.streetAddress || user?.address}</p>
                    )}
                   
                  </div>
                </div>
              </div>
            </div>

            <div className="invoice__order-table pt-30 pb-30 pl-40 pr-40 bg-white mb-30">
              <table className="table">
                <thead className="table-light">
                  <tr>
                    <th scope="col">SL</th>
                    <th scope="col">Product</th>
                    <th scope="col">Quantity</th>
                    <th scope="col">Item Price</th>
                    <th scope="col">Amount</th>
                  </tr>
                </thead>
                <tbody className="table-group-divider">
                  {lineItems.length ? (
                    lineItems.map((li, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{li.title}</td>
                        <td>{li.qty}</td>
                        <td>${Number(li.price).toFixed(2)}</td>
                        <td>${(Number(li.price) * Number(li.qty)).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center' }}>No items</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="invoice__total pt-40 pb-10 alert-success pl-40 pr-40 mb-30">
              <div className="row">
                <div className="col-lg-3 col-md-4">
                  <div className="invoice__payment-method mb-30">
                    <h5 className="mb-0">Payment Method</h5>
                    <p className="tp-font-medium text-uppercase">{order.payment}</p>
                  </div>
                </div>
                <div className="col-lg-3 col-md-4">
                  <div className="invoice__shippint-cost mb-30">
                    <h5 className="mb-0">Shipping Cost</h5>
                    <p className="tp-font-medium">${Number(order.shippingCost || 0).toFixed(2)}</p>
                  </div>
                </div>
                <div className="col-lg-3 col-md-4">
                  <div className="invoice__discount-cost mb-30">
                    <h5 className="mb-0">Discount</h5>
                    <p className="tp-font-medium">${Number(order.discount || 0).toFixed(2)}</p>
                  </div>
                </div>
                <div className="col-lg-3 col-md-4">
                  <div className="invoice__total-ammount mb-30">
                    <h5 className="mb-0">Total Amount</h5>
                    <p className="tp-font-medium text-danger">
                      <strong>${Number(order.total || 0).toFixed(2)}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {order.shippingInstructions ? (
              <div className="pl-40 pr-40 mb-20">
                <strong>Shipping Instructions:</strong> {order.shippingInstructions}
              </div>
            ) : null}
          </div>

          <div className="invoice__print text-end mt-3">
            <div className="row">
              <div className="col-xl-12">
                <ReactToPrint
                  trigger={() => (
                    <button type="button" className="tp-invoice-print tp-btn tp-btn-black">
                      <span className="mr-5"><i className="fa-regular fa-print"></i></span> Print
                    </button>
                  )}
                  content={() => printRef.current}
                  documentTitle={`Invoice-${order._id || 'Order'}`}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .tp-invoice-print-wrapper { box-shadow: none !important; }
          .tp-btn, .invoice__print { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default OrderArea;
