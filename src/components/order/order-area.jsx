'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import NextImage from 'next/image';
import dayjs from 'dayjs';
import {
  pdf as pdfRenderer,
  Document as PDFDocument,
  Page as PDFPage,
  Text as PDFText,
  View as PDFView,
  StyleSheet as PDFStyleSheet,
  Image as PDFImage,
} from '@react-pdf/renderer';

import logo from '@assets/img/logo/my_logo.png';
import ErrorMsg from '@/components/common/error-msg';
import PrdDetailsLoader from '@/components/loader/prd-details-loader';
import { useGetUserByIdQuery } from '@/redux/features/order/orderApi';

/* ------------------------------ helpers ------------------------------ */
const safeGetLocalUserId = () => {
  if (typeof window === 'undefined') return null;
  try {
    const id = localStorage.getItem('userId');
    return id && id.trim() ? id.trim() : null;
  } catch {
    return null;
  }
};

const BRAND_BLUE = '#2C4C97';
const BRAND_YELLOW = '#D6A74B';

/* --------------------------- PDF: styles ---------------------------- */
const HEADER_H = 86;
const FOOTER_H = 86;

const pdfStyles = PDFStyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    paddingHorizontal: 40,
    paddingTop: HEADER_H + 12,
    paddingBottom: FOOTER_H + 12,
    fontSize: 11,
    color: '#0f172a',
  },

  /* header */
  headerWrap: { position: 'absolute', left: 0, right: 0, top: 0, height: HEADER_H, paddingHorizontal: 40 },
  headerCanvas: { position: 'absolute', left: 0, right: 0, top: 58, height: 5 },
  headerBlueLine: { position: 'absolute', left: 0, right: 0, top: 0, height: 1, backgroundColor: BRAND_BLUE },
  headerGoldLine: { position: 'absolute', left: 0, right: 0, top: 2, height: 2, backgroundColor: BRAND_YELLOW },
  headerRow: { position: 'absolute', top: 16, left: 40, right: 40, height: 48, flexDirection: 'row', alignItems: 'center' },
  headerLogoWrap: { width: 58, height: 58, position: 'absolute', left: -2, top: 0, backgroundColor: '#fff', borderRadius: 29, padding: 6 },
  headerLogo: { width: '100%', height: '100%' },
  headerTitleWrap: { position: 'absolute', left: 0, right: 0, top: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, color: BRAND_BLUE, fontWeight: 'bold', letterSpacing: 0.5, textAlign: 'center', marginLeft: 110 },

  /* footer */
  footerWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, height: FOOTER_H, paddingHorizontal: 40, justifyContent: 'flex-end', paddingBottom: 12 },
  footerCanvas: { position: 'absolute', left: 0, right: 0, top: 0, height: 5 },
  footerBlue: { position: 'absolute', left: 0, right: 0, top: 0, height: 1, backgroundColor: BRAND_BLUE },
  footerGold: { position: 'absolute', left: 0, right: 0, top: 2, height: 2, backgroundColor: BRAND_YELLOW },
  footerTextBlock: { textAlign: 'center', color: BRAND_BLUE },
  footerLine: { fontSize: 9, marginTop: 3, textAlign: 'center', lineHeight: 1.4 },

  /* body */
  h3: { fontSize: 16, marginBottom: 6, color: '#111827' },
  small: { fontSize: 10, color: '#334155' },
  row: { flexDirection: 'row', gap: 12 },
  col: { flexGrow: 1 },
  box: { padding: 10, border: '1px solid #e5e7eb', borderRadius: 6, marginBottom: 12, backgroundColor: '#fff' },

  table: { width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden', marginTop: 6 },
  thead: { flexDirection: 'row', backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb' },
  th: { flex: 1, padding: 8, fontSize: 11, fontWeight: 'bold' },
  thSL: { width: 36, padding: 8, fontSize: 11, fontWeight: 'bold' },
  tr: { flexDirection: 'row', borderBottom: '1px solid #f1f5f9' },
  td: { flex: 1, padding: 8, fontSize: 11 },
  tdSL: { width: 36, padding: 8, fontSize: 11, textAlign: 'right' },

  totalsRow: { flexDirection: 'row', gap: 12 },
  totalsCol: { flexGrow: 1 },
  totalBox: { padding: 10, border: '1px solid #f1f5f9', borderRadius: 8, backgroundColor: '#f8fff7' },
  totalLabel: { fontSize: 11, marginBottom: 2 },
  totalValue: { fontSize: 14, fontWeight: 'bold' },
});

/* --------------------------- PDF: component --------------------------- */
function InvoicePDF({ order, fullName }) {
  const addressLines = [
    '4th Floor, Safal Prelude,',
    '404 Corporate Road, Near YMCA Club,',
    'Prahlad Nagar, Ahmedabad,',
    'Gujarat, India - 380015',
  ];

  const lineItems = (order.productId || []).map((pid, i) => ({
    title: String(pid),
    qty: (order.quantity || [])[i] ?? 1,
    price: (order.price || [])[i] ?? 0,
  }));

  const asMoney = (n) => `$${Number(n || 0).toFixed(2)}`;

  return (
    <PDFDocument>
      <PDFPage size="A4" style={pdfStyles.page}>
        {/* header */}
        <PDFView style={pdfStyles.headerWrap} fixed>
          <PDFView style={pdfStyles.headerCanvas}>
            <PDFView style={pdfStyles.headerBlueLine} />
            <PDFView style={pdfStyles.headerGoldLine} />
          </PDFView>
          <PDFView style={pdfStyles.headerRow}>
            <PDFView style={pdfStyles.headerLogoWrap}>
              {/* Next/Image asset isn't available inside the PDF runtime; use a public path */}
              <PDFImage src="/apple-touch-icon.png" style={pdfStyles.headerLogo} />
            </PDFView>
            <PDFView style={pdfStyles.headerTitleWrap}>
              <PDFText style={pdfStyles.headerTitle}>AMRITA GLOBAL ENTERPRISES</PDFText>
            </PDFView>
          </PDFView>
        </PDFView>

        {/* invoice header */}
        <PDFView style={pdfStyles.box}>
          <PDFText style={pdfStyles.h3}>Invoice</PDFText>
          <PDFView style={pdfStyles.row}>
            <PDFView style={pdfStyles.col}>
              <PDFText><PDFText style={{ fontWeight: 'bold' }}>Order ID: </PDFText>#{order._id || '—'}</PDFText>
              <PDFText><PDFText style={{ fontWeight: 'bold' }}>Date: </PDFText>{dayjs(order.createdAt).format('MMMM D, YYYY')}</PDFText>
              <PDFText><PDFText style={{ fontWeight: 'bold' }}>Payment: </PDFText>{String(order.payment || '—').toUpperCase()}</PDFText>
            </PDFView>
            <PDFView style={pdfStyles.col}>
              <PDFText style={{ fontWeight: 'bold', marginBottom: 4 }}>{fullName}</PDFText>
              {order.phone ? <PDFText>{order.phone}</PDFText> : null}
              {order.email ? <PDFText>{order.email}</PDFText> : null}
              {order.streetAddress ? <PDFText>{order.streetAddress}</PDFText> : null}
            </PDFView>
            <PDFView style={pdfStyles.col}>
              <PDFText style={{ fontWeight: 'bold', marginBottom: 4 }}>From</PDFText>
              {addressLines.map((l, i) => <PDFText key={i}>{l}</PDFText>)}
            </PDFView>
          </PDFView>
        </PDFView>

        {/* table */}
        <PDFView>
          <PDFView style={pdfStyles.table}>
            <PDFView style={pdfStyles.thead}>
              <PDFText style={pdfStyles.thSL}>SL</PDFText>
              <PDFText style={pdfStyles.th}>Product</PDFText>
              <PDFText style={pdfStyles.th}>Quantity</PDFText>
              <PDFText style={pdfStyles.th}>Item Price</PDFText>
              <PDFText style={pdfStyles.th}>Amount</PDFText>
            </PDFView>
            {(lineItems.length ? lineItems : [{ title: 'No items', qty: 0, price: 0 }]).map((li, i) => (
              <PDFView key={i} style={pdfStyles.tr}>
                <PDFText style={pdfStyles.tdSL}>{lineItems.length ? i + 1 : ''}</PDFText>
                <PDFText style={pdfStyles.td}>{li.title}</PDFText>
                <PDFText style={pdfStyles.td}>{li.qty}</PDFText>
                <PDFText style={pdfStyles.td}>{asMoney(li.price)}</PDFText>
                <PDFText style={pdfStyles.td}>{asMoney(Number(li.price) * Number(li.qty))}</PDFText>
              </PDFView>
            ))}
          </PDFView>
        </PDFView>

        {/* totals */}
        <PDFView style={{ marginTop: 10 }}>
          <PDFView style={pdfStyles.totalsRow}>
            <PDFView style={pdfStyles.totalsCol}>
              {order.shippingInstructions ? (
                <PDFView style={pdfStyles.box}>
                  <PDFText style={{ fontWeight: 'bold', marginBottom: 4 }}>Shipping Instructions</PDFText>
                  <PDFText style={pdfStyles.small}>{order.shippingInstructions}</PDFText>
                </PDFView>
              ) : null}
            </PDFView>
            <PDFView style={{ width: 220 }}>
              <PDFView style={pdfStyles.totalBox}>
                <PDFText style={pdfStyles.totalLabel}>Shipping Cost</PDFText>
                <PDFText>{asMoney(order.shippingCost)}</PDFText>
                <PDFText style={[pdfStyles.totalLabel, { marginTop: 6 }]}>Discount</PDFText>
                <PDFText>{asMoney(order.discount)}</PDFText>
                <PDFText style={[pdfStyles.totalLabel, { marginTop: 6 }]}>Total Amount</PDFText>
                <PDFText style={pdfStyles.totalValue}>{asMoney(order.total)}</PDFText>
              </PDFView>
            </PDFView>
          </PDFView>
        </PDFView>

        {/* footer */}
        <PDFView style={pdfStyles.footerWrap} fixed>
          <PDFView style={pdfStyles.footerCanvas}>
            <PDFView style={pdfStyles.footerBlue} />
            <PDFView style={pdfStyles.footerGold} />
          </PDFView>
          <PDFView style={pdfStyles.footerTextBlock}>
            <PDFText style={pdfStyles.footerLine}>404, Safal Prelude, Corporate Rd, Prahlad Nagar, Ahmedabad, Gujarat 380015</PDFText>
            <PDFText style={pdfStyles.footerLine}>info@amritafashions.com • amrita-fashions.com • +91 98240 03484</PDFText>
          </PDFView>
        </PDFView>
      </PDFPage>
    </PDFDocument>
  );
}

/* =============================== MAIN UI =============================== */

const OrderArea = ({ orderId, userId: userIdProp }) => {
  const printRef = useRef(null);

  // resolve userId: prop -> localStorage
  const userId = userIdProp || safeGetLocalUserId() || null;

  // Load last created order from localStorage (set by Checkout flow)
  const [lastOrder, setLastOrder] = useState(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('lastOrder');
      if (raw) {
        try {
          setLastOrder(JSON.parse(raw));
        } catch (err) {
          console.warn('err', err);
        }
      }
    }
  }, []);

  // Fetch user profile for invoice header/details (skip if no userId; we'll still render using lastOrder only)
  const { data: userResp, isError, isLoading } = useGetUserByIdQuery(userId, { skip: !userId });
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

  /* ----------------------- PRINT & PDF (A4, header/footer) ----------------------- */

  const handlePrint = useCallback(async () => {
    try {
      const instance = pdfRenderer(<InvoicePDF order={order} fullName={fullName} />);
      const blob = await instance.toBlob();
      const url = URL.createObjectURL(blob);

      // trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${order._id || dayjs().format('YYYYMMDD_HHmmss')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      // also open in a new tab for quick view (optional)
      window.open(url, '_blank', 'noopener,noreferrer');
      // revoke later
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e) {
      console.error('PDF generation failed, falling back to browser print.', e);
      window.print(); // fallback
    }
  }, [order, fullName]);

  /* ------------------------------ UI states ------------------------------ */
  if (!lastOrder && !user && isLoading) return <PrdDetailsLoader loading={true} />;
  if (!lastOrder && isError) return <ErrorMsg msg="There was an error loading your details." />;

  /* -------------------------------- RENDER -------------------------------- */
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
                          <NextImage src={logo} alt="logo" width={140} height={45} />
                          <h3>Amrita Global Enterprises</h3>
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
                          <p className="mb-0">
                            <strong>Date:</strong> {dayjs(order.createdAt).format('MMMM D, YYYY')}
                          </p>
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
                <button
                  type="button"
                  onClick={handlePrint}
                  className="tp-invoice-print tp-btn tp-btn-black"
                >
                  <span className="mr-5"><i className="fa-regular fa-print"></i></span> Print
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Keep global print styles active for in-window prints as well */}
      <style jsx global>{`
        @page {
          size: A4;
          margin: 16mm;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .tp-invoice-print-wrapper { box-shadow: none !important; }
          .tp-btn, .invoice__print { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default OrderArea;
