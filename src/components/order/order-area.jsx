'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
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

import ErrorMsg from '@/components/common/error-msg';
import PrdDetailsLoader from '@/components/loader/prd-details-loader';
import { useGetUserByIdQuery } from '@/redux/features/order/orderApi';
// import LOGO_WEB_URL from  '@assets/img/logo/my_logo.png';

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

// Brand
const BRAND_BLUE = '#2C4C97';
const BRAND_YELLOW = '#D6A74B';
const TEXT_MUTED = '#475569';
const BORDER = '#e5e7eb';
const ROW_ALT = '#f8fafc';
const SOFT = '#f1f5f9';

// Your logo (WEBP). React-PDF can’t render WEBP reliably, so we proxy to PNG.
 const LOGO_WEB_URL =
   'https://amritafashions.com/wp-content/uploads/amrita-fashions-small-logo-india.webp';

// Convert any image URL to a PNG via Cloudinary “fetch” (no account needed for demo domain).
// If you have your own Cloudinary cloud, replace `demo` with your cloud name.
const toPngProxy = (url) =>
  `https://res.cloudinary.com/demo/image/fetch/f_png/${encodeURIComponent(url)}`;

// For PDF we must ensure non-WEBP. If it’s already jpg/png, keep it.
const pdfSafeLogo = (url) => {
  try {
    const u = String(url || '');
    if (/\.(png|jpg|jpeg)$/i.test(u)) return u;
    return toPngProxy(u);
  } catch {
    return toPngProxy(LOGO_WEB_URL);
  }
};

/* --------------------------- PDF: styles ---------------------------- */
const HEADER_H = 96;
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
  headerCanvas: { position: 'absolute', left: 0, right: 0, top: 70, height: 5 },
  headerBlueLine: { position: 'absolute', left: 0, right: 0, top: 0, height: 1, backgroundColor: BRAND_BLUE },
  headerGoldLine: { position: 'absolute', left: 0, right: 0, top: 2, height: 2, backgroundColor: BRAND_YELLOW },

  headerRow: {
    position: 'absolute',
    top: 18,
    left: 40,
    right: 40,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: { width: 56, height: 56, borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff' },
  logo: { width: '100%', height: '100%' },
  brandTextWrap: { marginLeft: 12 },
  brandTitle: { fontSize: 16, color: BRAND_BLUE, fontWeight: 'bold', letterSpacing: 0.2 },
  brandSub: { fontSize: 9, color: TEXT_MUTED, marginTop: 2 },

  /* title under header */
  docTitleWrap: { marginTop: 8, marginBottom: 10 },
  docTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827',textAlign: 'center', letterSpacing: 1 },

  /* footer */
  footerWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, height: FOOTER_H, paddingHorizontal: 40, justifyContent: 'flex-end', paddingBottom: 12 },
  footerCanvas: { position: 'absolute', left: 0, right: 0, top: 0, height: 5 },
  footerBlue: { position: 'absolute', left: 0, right: 0, top: 0, height: 1, backgroundColor: BRAND_BLUE },
  footerGold: { position: 'absolute', left: 0, right: 0, top: 2, height: 2, backgroundColor: BRAND_YELLOW },
  footerTextBlock: { textAlign: 'center', color: BRAND_BLUE },
  footerLine: { fontSize: 9, marginTop: 3, textAlign: 'center', lineHeight: 1.4 },

  /* cards & text */
  card: { padding: 12, border: `1px solid ${BORDER}`, borderRadius: 12, backgroundColor: '#fff', marginBottom: 10 },
  label: { fontSize: 9, color: TEXT_MUTED, marginBottom: 4, textTransform: 'uppercase' },
  strong: { fontSize: 11, fontWeight: 'bold' },

  twoCol: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },

  metaRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  metaItem: { flex: 1 },

  /* table */
  table: { width: '100%', borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden', marginTop: 6 },
  thead: { flexDirection: 'row', backgroundColor: ROW_ALT, borderBottom: `1px solid ${BORDER}` },
  thSL: { width: 28, padding: 8, fontSize: 10, fontWeight: 'bold', color: TEXT_MUTED, textAlign: 'center' },
  thProduct: { flexGrow: 1, padding: 8, fontSize: 10, fontWeight: 'bold', color: TEXT_MUTED },
  thQty: { width: 60, padding: 8, fontSize: 10, fontWeight: 'bold', color: TEXT_MUTED, textAlign: 'right' },
  thPrice: { width: 80, padding: 8, fontSize: 10, fontWeight: 'bold', color: TEXT_MUTED, textAlign: 'right' },
  thAmount: { width: 90, padding: 8, fontSize: 10, fontWeight: 'bold', color: TEXT_MUTED, textAlign: 'right' },

  tr: { flexDirection: 'row', borderBottom: `1px solid ${SOFT}` },
  tdSL: { width: 28, padding: 8, fontSize: 11, textAlign: 'center' },
  tdProduct: { flexGrow: 1, padding: 8, fontSize: 11 },
  tdQty: { width: 60, padding: 8, fontSize: 11, textAlign: 'right' },
  tdPrice: { width: 80, padding: 8, fontSize: 11, textAlign: 'right' },
  tdAmount: { width: 90, padding: 8, fontSize: 11, textAlign: 'right' },

  /* totals */
  totalsWrap: { flexDirection: 'row', marginTop: 10 },
  totalsSpacer: { flex: 1 },
  totalsBox: { width: 260, borderRadius: 12, border: `1px solid ${BORDER}`, backgroundColor: '#ffffff' },
  totalsRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, borderBottom: `1px solid ${SOFT}` },
  totalsCellLabel: { flex: 1, fontSize: 11, color: TEXT_MUTED },
  totalsCellValue: { width: 100, textAlign: 'right', fontSize: 11 },
  grandRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 10, backgroundColor: ROW_ALT },
  grandLabel: { flex: 1, fontSize: 12, fontWeight: 'bold' },
  grandValue: { width: 100, textAlign: 'right', fontSize: 12, fontWeight: 'bold' },
});

/* --------------------------- PDF: component --------------------------- */
function InvoicePDF({ order, fullName }) {
  const addressLines = [
    '4th Floor, Safal Prelude, 404 Corporate Road, Near YMCA Club,',
    'Prahlad Nagar, Ahmedabad, Gujarat, India - 380015',
  ];

  const items = (order.productId || []).map((pid, i) => ({
    title: String(pid),
    qty: (order.quantity || [])[i] ?? 1,
    price: (order.price || [])[i] ?? 0,
  }));

  const money = (n) => `$${Number(n || 0).toFixed(2)}`;
  const subTotal = items.reduce((s, it) => s + Number(it.qty) * Number(it.price), 0);
  const shipping = Number(order.shippingCost || 0);
  const discount = Number(order.discount || 0);
  const grand = Number(order.total || subTotal + shipping - discount);

  return (
    <PDFDocument>
      <PDFPage size="A4" style={pdfStyles.page}>
        {/* Fixed header */}
        <PDFView style={pdfStyles.headerWrap} fixed>
          <PDFView style={pdfStyles.headerCanvas}>
            <PDFView style={pdfStyles.headerBlueLine} />
            <PDFView style={pdfStyles.headerGoldLine} />
          </PDFView>
          <PDFView style={pdfStyles.headerRow}>
            <PDFView style={{ flexDirection: 'row', alignItems: 'center' }}>
              <PDFView style={pdfStyles.logoBox}>
                <PDFImage src={pdfSafeLogo(LOGO_WEB_URL)} style={pdfStyles.logo} />
              </PDFView>
              <PDFView style={pdfStyles.brandTextWrap}>
                <PDFText style={pdfStyles.brandTitle}>AMRITA GLOBAL ENTERPRISES</PDFText>
                <PDFText style={pdfStyles.brandSub}>Textiles & Fabrics • B2B</PDFText>
              </PDFView>
            </PDFView>
          </PDFView>
        </PDFView>

        {/* Title BELOW header */}
        <PDFView style={pdfStyles.docTitleWrap}>
          <PDFText style={pdfStyles.docTitle}>INVOICE</PDFText>
        </PDFView>

        {/* Bill To / From */}
        <PDFView style={pdfStyles.twoCol}>
          <PDFView style={pdfStyles.col}>
            <PDFView style={pdfStyles.card}>
              <PDFText style={pdfStyles.label}>Bill To</PDFText>
              <PDFText style={pdfStyles.strong}>{fullName}</PDFText>
              {order.phone ? <PDFText>{order.phone}</PDFText> : null}
              {order.email ? <PDFText>{order.email}</PDFText> : null}
              {order.streetAddress ? <PDFText>{order.streetAddress}</PDFText> : null}
            </PDFView>
          </PDFView>
          <PDFView style={pdfStyles.col}>
            <PDFView style={pdfStyles.card}>
              <PDFText style={pdfStyles.label}>From</PDFText>
              <PDFText style={pdfStyles.strong}>Amrita Global Enterprises</PDFText>
              {addressLines.map((l, i) => <PDFText key={i}>{l}</PDFText>)}
              <PDFText>info@amritafashions.com • +91 98240 03484</PDFText>
            </PDFView>
          </PDFView>
        </PDFView>

        {/* Meta */}
        <PDFView style={pdfStyles.card}>
          <PDFView style={pdfStyles.metaRow}>
            <PDFView style={pdfStyles.metaItem}>
              <PDFText style={pdfStyles.label}>Invoice Number</PDFText>
              <PDFText style={pdfStyles.strong}>{order._id || '—'}</PDFText>
            </PDFView>
            <PDFView style={pdfStyles.metaItem}>
              <PDFText style={pdfStyles.label}>Invoice Date</PDFText>
              <PDFText style={pdfStyles.strong}>{dayjs(order.createdAt).format('MMMM D, YYYY')}</PDFText>
            </PDFView>
            <PDFView style={pdfStyles.metaItem}>
              <PDFText style={pdfStyles.label}>Payment</PDFText>
              <PDFText style={pdfStyles.strong}>{String(order.payment || '—').toUpperCase()}</PDFText>
            </PDFView>
            <PDFView style={pdfStyles.metaItem}>
              <PDFText style={pdfStyles.label}>Shipping</PDFText>
              <PDFText style={pdfStyles.strong}>{String(order.shipping || '—').toUpperCase()}</PDFText>
            </PDFView>
          </PDFView>
        </PDFView>

        {/* Items */}
        <PDFView style={pdfStyles.table}>
          <PDFView style={pdfStyles.thead}>
            <PDFText style={pdfStyles.thSL}>#</PDFText>
            <PDFText style={pdfStyles.thProduct}>Product</PDFText>
            <PDFText style={pdfStyles.thQty}>Qty</PDFText>
            <PDFText style={pdfStyles.thPrice}>Price</PDFText>
            <PDFText style={pdfStyles.thAmount}>Amount</PDFText>
          </PDFView>

          {(items.length ? items : [{ title: 'No items', qty: 0, price: 0 }]).map((it, i) => (
            <PDFView key={i} style={pdfStyles.tr}>
              <PDFText style={pdfStyles.tdSL}>{items.length ? i + 1 : ''}</PDFText>
              <PDFText style={pdfStyles.tdProduct}>{it.title}</PDFText>
              <PDFText style={pdfStyles.tdQty}>{it.qty}</PDFText>
              <PDFText style={pdfStyles.tdPrice}>{money(it.price)}</PDFText>
              <PDFText style={pdfStyles.tdAmount}>{money(Number(it.price) * Number(it.qty))}</PDFText>
            </PDFView>
          ))}
        </PDFView>

        {/* Totals */}
        <PDFView style={pdfStyles.totalsWrap}>
          <PDFView style={pdfStyles.totalsSpacer} />
          <PDFView style={pdfStyles.totalsBox}>
            <PDFView style={pdfStyles.totalsRow}>
              <PDFText style={pdfStyles.totalsCellLabel}>Subtotal</PDFText>
              <PDFText style={pdfStyles.totalsCellValue}>{money(subTotal)}</PDFText>
            </PDFView>
            <PDFView style={pdfStyles.totalsRow}>
              <PDFText style={pdfStyles.totalsCellLabel}>Shipping</PDFText>
              <PDFText style={pdfStyles.totalsCellValue}>{money(shipping)}</PDFText>
            </PDFView>
            <PDFView style={pdfStyles.totalsRow}>
              <PDFText style={pdfStyles.totalsCellLabel}>Discount</PDFText>
              <PDFText style={pdfStyles.totalsCellValue}>{money(discount)}</PDFText>
            </PDFView>
            <PDFView style={pdfStyles.grandRow}>
              <PDFText style={pdfStyles.grandLabel}>Total</PDFText>
              <PDFText style={pdfStyles.grandValue}>{money(grand)}</PDFText>
            </PDFView>
          </PDFView>
        </PDFView>

        {/* Notes */}
        {order.shippingInstructions ? (
          <PDFView style={[pdfStyles.card, { marginTop: 10 }]}>
            <PDFText style={pdfStyles.label}>Notes / Shipping Instructions</PDFText>
            <PDFText>{order.shippingInstructions}</PDFText>
          </PDFView>
        ) : null}

        {/* fixed footer */}
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

  const lineItems = (order.productId || []).map((pid, i) => ({
    title: String(pid),
    qty: (order.quantity || [])[i] ?? 1,
    price: (order.price || [])[i] ?? 0,
  }));

  /* ----------------------- PRINT -> PDF (A4, header/footer) ----------------------- */
  const handlePrint = useCallback(async () => {
    try {
      const instance = pdfRenderer(<InvoicePDF order={order} fullName={fullName} />);
      const blob = await instance.toBlob();
      const url = URL.createObjectURL(blob);

      // download
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${order._id || dayjs().format('YYYYMMDD_HHmmss')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      // preview tab (optional)
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e) {
      console.error('PDF generation failed, falling back to browser print.', e);
      window.print();
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
            <div className="invoice__header-wrapper border-2 border-bottom border-white mb-30">
              <div className="row align-items-center">
                {/* On-screen header with Next/Image */}
                <div className="col-md-7 col-sm-12">
                  <div className="d-flex align-items-center" style={{ gap: 12 }}>
                    <img
                      src={LOGO_WEB_URL}
                      alt="Amrita Global Enterprises"
                      width={110}
                      height={50}
                      
                      style={{ borderRadius: 6, background: '#fff' }}
                    />
                    <div>
                      <h3 className="mb-5" style={{ color: BRAND_BLUE, marginBottom: 0 }}>Amrita Global Enterprises</h3>
                      <p className="mb-0" style={{ color: TEXT_MUTED }}>Textiles & Fabrics • B2B</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Title BELOW header */}
            <div className="mb-20">
              <h2 className="text-uppercase" style={{ fontWeight: 800, letterSpacing: 1 }}>INVOICE</h2>
            </div>

            {/* Bill To / From */}
            <div className="row g-3 mb-20">
              <div className="col-md-6">
                <div className="p-3 rounded" style={{ border: '1px solid #e5e7eb', background: '#fff' }}>
                  <div className="text-uppercase" style={{ fontSize: 12, color: '#64748b' }}>Bill To</div>
                  <div style={{ fontWeight: 600 }}>{fullName}</div>
                  {(order.phone || user?.phone) && <div>{order.phone || user?.phone}</div>}
                  {(order.email || user?.email) && <div>{order.email || user?.email}</div>}
                  {(order.streetAddress || user?.address) && <div>{order.streetAddress || user?.address}</div>}
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3 rounded" style={{ border: '1px solid #e5e7eb', background: '#fff' }}>
                  <div className="text-uppercase" style={{ fontSize: 12, color: '#64748b' }}>From</div>
                  <div style={{ fontWeight: 600 }}>Amrita Global Enterprises</div>
                  <div>4th Floor, Safal Prelude, 404 Corporate Road, Near YMCA Club,</div>
                  <div>Prahlad Nagar, Ahmedabad, Gujarat, India - 380015</div>
                  <div>info@amritafashions.com • +91 98240 03484</div>
                </div>
              </div>
            </div>

            {/* Meta row */}
            <div className="row g-3 mb-30">
              <div className="col-md-3">
                <div className="p-3 rounded" style={{ border: '1px solid #e5e7eb', background: '#fff' }}>
                  <div className="text-uppercase" style={{ fontSize: 12, color: '#64748b' }}>Invoice Number</div>
                  <div style={{ fontWeight: 600 }}>{order._id || '—'}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 rounded" style={{ border: '1px solid #e5e7eb', background: '#fff' }}>
                  <div className="text-uppercase" style={{ fontSize: 12, color: '#64748b' }}>Invoice Date</div>
                  <div style={{ fontWeight: 600 }}>{dayjs(order.createdAt).format('MMMM D, YYYY')}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 rounded" style={{ border: '1px solid #e5e7eb', background: '#fff' }}>
                  <div className="text-uppercase" style={{ fontSize: 12, color: '#64748b' }}>Payment</div>
                  <div style={{ fontWeight: 600 }}>{String(order.payment || '—').toUpperCase()}</div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 rounded" style={{ border: '1px solid #e5e7eb', background: '#fff' }}>
                  <div className="text-uppercase" style={{ fontSize: 12, color: '#64748b' }}>Shipping</div>
                  <div style={{ fontWeight: 600 }}>{String(order.shipping || '—').toUpperCase()}</div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div
              className="pt-20 pb-20 pl-40 pr-40 bg-white mb-30"
              style={{ border: '1px solid #e5e7eb', borderRadius: 12 }}
            >
              <table className="table" style={{ marginBottom: 0 }}>
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 40, textAlign: 'center' }}>#</th>
                    <th>Product</th>
                    <th style={{ width: 80, textAlign: 'right' }}>Qty</th>
                    <th style={{ width: 110, textAlign: 'right' }}>Price</th>
                    <th style={{ width: 120, textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody className="table-group-divider">
                  {lineItems.length ? (
                    lineItems.map((li, i) => (
                      <tr key={i}>
                        <td style={{ textAlign: 'center' }}>{i + 1}</td>
                        <td>{li.title}</td>
                        <td style={{ textAlign: 'right' }}>{li.qty}</td>
                        <td style={{ textAlign: 'right' }}>${Number(li.price).toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>${(Number(li.price) * Number(li.qty)).toFixed(2)}</td>
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

            {/* Totals */}
            <div className="pl-40 pr-40 mb-30">
              <div className="row">
                <div className="col-lg-7"></div>
                <div className="col-lg-5">
                  <div className="p-3 rounded" style={{ border: '1px solid #e5e7eb', background: '#fff', borderRadius: 12 }}>
                    <div className="d-flex justify-content-between mb-2" style={{ color: '#64748b' }}>
                      <span>Subtotal</span>
                      <span>
                        ${lineItems.reduce((s, it) => s + Number(it.qty) * Number(it.price), 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-2" style={{ color: '#64748b' }}>
                      <span>Shipping</span>
                      <span>${Number(order.shippingCost || 0).toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2" style={{ color: '#64748b' }}>
                      <span>Discount</span>
                      <span>${Number(order.discount || 0).toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between pt-2 mt-2" style={{ borderTop: '1px solid #e5e7eb', fontWeight: 700 }}>
                      <span>Total</span>
                      <span>
                        ${Number(order.total || (lineItems.reduce((s, it) => s + Number(it.qty) * Number(it.price), 0) + Number(order.shippingCost || 0) - Number(order.discount || 0))).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {order.shippingInstructions ? (
              <div className="pl-40 pr-40 mb-20">
                <strong>Notes:</strong> {order.shippingInstructions}
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

      {/* Global print hints if user uses native browser print */}
      <style jsx global>{`
        @page { size: A4; margin: 16mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .tp-invoice-print-wrapper { box-shadow: none !important; }
          .tp-btn, .invoice__print { display: none !important; }
          table.table thead th { background: #f8fafc !important; }
        }
      `}</style>
    </>
  );
};

export default OrderArea;
