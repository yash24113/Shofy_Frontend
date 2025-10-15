'use client';

import React, { useEffect, useState, useId, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';

import { formatProductForCart, formatProductForWishlist } from '@/utils/authUtils';
import { add_to_wishlist } from '@/redux/features/wishlist-slice';
import { add_cart_product } from '@/redux/features/cartSlice';

import { Cart, CartActive, Wishlist, WishlistActive, QuickView, Share } from '@/svg';
import { handleProductModal } from '@/redux/features/productModalSlice';
import { useGetProductsByGroupcodeQuery } from '@/redux/features/productApi';
import { useGetSeoByProductQuery } from '@/redux/features/seoApi';

/* 🔎 add search */
import useGlobalSearch from '@/hooks/useGlobalSearch';
import { buildSearchPredicate } from '@/utils/searchMiddleware';

/* ---------------- helpers ---------------- */
const nonEmpty = (v) => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && String(v).trim() !== '');
const pick = (...xs) => xs.find(nonEmpty);
const toText = (v) => {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) return v.map(toText).filter(Boolean).join(', ');
  if (typeof v === 'object') return toText(v.name ?? v.value ?? v.title ?? v.label ?? '');
  return '';
};
const isNoneish = (s) => {
  if (!s) return true;
  const t = String(s).trim().toLowerCase().replace(/\s+/g, ' ');
  return ['none', 'na', 'none/ na', 'none / na', 'n/a', '-'].includes(t);
};
const round = (n, d = 1) => (isFinite(n) ? Number(n).toFixed(d).replace(/\.0+$/, '') : '');
const gsmToOz = (gsm) => gsm * 0.0294935;
const cmToInch = (cm) => cm / 2.54;
const uniq = (arr) => {
  const seen = new Set();
  return arr.filter((x) => {
    const k = String(x).trim().toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};
const stripHtml = (s) => String(s || '').replace(/<[^>]*>/g, ' ');

/* ---- user/store helpers ---- */
const selectUserIdFromStore = (state) =>
  state?.auth?.user?._id ||
  state?.auth?.user?.id ||
  state?.auth?.userInfo?._id ||
  state?.auth?.userInfo?.id ||
  state?.user?.user?._id ||
  null;

const getUserIdFromLocal = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userid') || localStorage.getItem('userId') || null;
};

/* ---------------- API + storage helpers ---------------- */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/+$/, '');
const WISHLIST_BASE = (() => {
  if (!API_BASE) return 'https://test.amrita-fashions.com/shopy';
  if (/\/api$/i.test(API_BASE)) return API_BASE.replace(/\/api$/i, '');
  if (/\/shopy$/i.test(API_BASE)) return API_BASE;
  return `${API_BASE}/shopy`;
})();

const WISHLIST_ITEMS_KEY = 'wishlist_items';

const readWishlistLocal = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WISHLIST_ITEMS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

const writeWishlistLocal = (items) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WISHLIST_ITEMS_KEY, JSON.stringify(items || []));
    window.dispatchEvent(new CustomEvent('wishlist-local-changed', { detail: { count: items?.length || 0 } }));
  } catch(err) {console.warn('writeWishlistLocal failed', err);}
};

/** GET /shopy/wishlist/:userId -> list of {_id,...} OR ids */
async function fetchServerWishlist(userId) {
  if (!userId) return [];
  try {
    const url = `${WISHLIST_BASE}/wishlist/${encodeURIComponent(userId)}`;
    const res = await fetch(url, { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!res.ok) throw new Error(`GET wishlist ${res.status}`);
    const data = await res.json();

    // Common shapes
    if (Array.isArray(data?.data?.products)) return data.data.products;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data?.items)) return data.data.items;

    const idsA = data?.data?.productIds;
    const idsB = data?.productIds;
    if (Array.isArray(idsA)) return idsA.map((x) => ({ _id: x?._id || x?.id || x }));
    if (Array.isArray(idsB)) return idsB.map((x) => ({ _id: x?._id || x?.id || x }));

    return [];
  } catch (e) {
    console.warn('fetchServerWishlist failed', e);
    return [];
  }
}

/** PUT /shopy/wishlist/:userId with { userId, productIds } (id array only) */
async function putServerWishlist(userId, ids) {
  if (!userId) return false;
  try {
    const url = `${WISHLIST_BASE}/wishlist/${encodeURIComponent(userId)}`;
    const res = await fetch(url, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, productIds: ids }),
    });
    return res.ok;
  } catch (e) {
    console.warn('putServerWishlist failed', e);
    return false;
  }
}

/** Merge local + server → union (by id), write to server, mirror to local */
async function syncWishlistTwoWay(userId) {
  if (!userId) return;
  const local = readWishlistLocal(); // [{_id, ...}]
  const localIds = new Set(local.map((x) => String(x?._id || x?.id)).filter(Boolean));

  const serverList = await fetchServerWishlist(userId); // mixed shapes
  const serverIds = new Set(
    (serverList || []).map((x) => String(x?._id || x?.id || x)).filter(Boolean)
  );

  // union
  const unionIds = new Set([...localIds, ...serverIds]);

  // PUT union to server
  const ok = await putServerWishlist(userId, Array.from(unionIds));
  if (ok) {
    // mirror to local (store as minimal objects {_id})
    const merged = Array.from(unionIds).map((id) => ({ _id: id }));
    writeWishlistLocal(merged);
    try {
      window.dispatchEvent(new CustomEvent('wishlist-synced', { detail: { count: merged.length } }));
    } catch(err) {console.log(err);}
  }
  return ok;
}

/* ---------------- Component ---------------- */
const ProductItem = ({ product }) => {
  const router = useRouter();
  const rainbowId = useId();
  const dispatch = useDispatch();
  const { debounced: q } = useGlobalSearch();

  const [showActions, setShowActions] = useState(false);
  const [supportsHover, setSupportsHover] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSupportsHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
    }
  }, []);

  // userId (store → localStorage)
  const userIdFromStore = useSelector(selectUserIdFromStore);
  const userId = userIdFromStore || getUserIdFromLocal();

  // basic cart/wishlist UI state from redux
  const cartItems = useSelector((s) => s.cart?.cart_products || []);
  const wishlistItems = useSelector((s) => s.wishlist?.wishlist || []);

  /* image helpers */
  const valueToUrlString = (v) => {
    if (!v) return '';
    if (typeof v === 'string') return v.trim();
    if (Array.isArray(v)) return valueToUrlString(v[0]);
    if (typeof v === 'object') return valueToUrlString(v.secure_url || v.url || v.path || v.key);
    return '';
  };
  const isHttpUrl = (s) => /^https?:\/\//i.test(s);

  const imageUrl = useMemo(() => {
    const raw =
      valueToUrlString(product?.img) ||
      valueToUrlString(product?.image1) ||
      valueToUrlString(product?.image2);
    if (!raw) return '/assets/img/product/default-product-img.jpg';
    if (isHttpUrl(raw)) return raw;
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
    const clean = (p) => (p || '').replace(/^\/+/, '').replace(/^api\/uploads\/?/, '').replace(/^uploads\/?/, '');
    return `${base}/uploads/${clean(raw)}`;
  }, [product]);

  /* title, slug, category, options */
  const productId = product?._id || product?.product?._id || product?.product;
  const { data: seoResp } = useGetSeoByProductQuery(productId, { skip: !productId });
  const seoDoc = Array.isArray(seoResp?.data) ? seoResp?.data?.[0] : seoResp?.data;

  const titleHtml =
    pick(
      product?.name,
      product?.product?.name,
      product?.productname,
      product?.title,
      product?.productTitle,
      seoDoc?.title,
      product?.seoTitle,
      product?.groupcode?.name
    ) || '—';
  const titleText = stripHtml(titleHtml);
  const slug = product?.slug || product?.product?.slug || seoDoc?.slug || productId;

  const categoryLabel =
    pick(
      product?.category?.name,
      product?.product?.category?.name,
      product?.categoryName,
      seoDoc?.category
    ) || '';

  const groupcodeId = product?.groupcode?._id || product?.groupcode || null;
  const { data: groupItems = [], isFetching, isError } =
    useGetProductsByGroupcodeQuery(groupcodeId, { skip: !groupcodeId });
  const optionCount = Array.isArray(groupItems) ? groupItems.length : 0;
  const showOptionsBadge = !!groupcodeId && !isFetching && !isError && optionCount > 1;

  /* values */
  const fabricTypeVal =
    toText(pick(product?.fabricType, product?.fabric_type, seoDoc?.fabricType)) || 'Woven Fabrics';
  const contentVal = toText(pick(product?.content, product?.contentName, product?.content_label, seoDoc?.content));
  const gsm = Number(pick(product?.gsm, product?.weightGsm, product?.weight_gsm));
  const weightVal = isFinite(gsm) && gsm > 0 ? `${round(gsm)} gsm / ${round(gsmToOz(gsm))} oz` : toText(product?.weight);
  const designVal = toText(pick(product?.design, product?.designName, seoDoc?.design));
  const colorsVal = toText(pick(product?.colors, product?.color, product?.colorName, seoDoc?.colors));
  const widthCm = Number(pick(product?.widthCm, product?.width_cm, product?.width));
  const widthVal = isFinite(widthCm) && widthCm > 0 ? `${round(widthCm,0)} cm / ${round(cmToInch(widthCm),0)} inch` : toText(product?.widthLabel);
  const finishVal = toText(pick(product?.finish, product?.subfinish?.name, product?.finishName, seoDoc?.finish));
  const structureVal = toText(pick(product?.structure, product?.substructure?.name, product?.structureName, seoDoc?.structure));
  const motifVal = toText(pick(product?.motif, product?.motifName, seoDoc?.motif));
  const leadTimeVal = toText(pick(product?.leadTime, product?.lead_time, seoDoc?.leadTime));

  const details = uniq(
    [fabricTypeVal, contentVal, weightVal, designVal, colorsVal, widthVal, finishVal, structureVal, motifVal, leadTimeVal]
      .filter((v) => nonEmpty(v) && !isNoneish(v))
  );
  const mid = Math.ceil(details.length / 2);
  const leftDetails = details.slice(0, mid);
  const rightDetails = details.slice(mid);

  const showCategory =
    categoryLabel &&
    String(categoryLabel).trim().toLowerCase() !== String(fabricTypeVal).trim().toLowerCase();

  /* share */
  const handleShare = async (_prd, e) => {
    e?.stopPropagation?.(); e?.preventDefault?.();
    try {
      const url =
        (typeof window !== 'undefined'
          ? `${window.location.origin}/fabric/${slug}`
          : `/fabric/${slug}`);
      const title = typeof titleHtml === 'string' ? titleHtml : 'Fabric';
      const text = 'Check out this fabric on Amrita Global Enterprises';
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, text, url });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        alert('Link copied!');
      } else {
        prompt('Copy link', url);
      }
    } catch(err) { console.log('share error', err); }
  };

  const inCart = cartItems.some((it) => String(it?._id) === String(productId));
  const inWishlist = wishlistItems.some((it) => String(it?._id) === String(productId));

  /* 🔎 visibility by global search */
  const isVisible = useMemo(() => {
    const query = (q || '').trim();
    if (query.length < 2) return true;
    const fields = [
      () => titleText,
      () => slug || '',
      () => categoryLabel || '',
      () => details.join(' '),
      () => fabricTypeVal || '',
      () => designVal || '',
      () => colorsVal || '',
    ];
    const pred = buildSearchPredicate(query, fields, { mode: 'AND', normalize: true });
    return pred(product);
  }, [q, titleText, slug, categoryLabel, details, fabricTypeVal, designVal, colorsVal, product]);

  /* cart */
  const handleAddProduct = (prd, e) => {
    e?.stopPropagation?.(); e?.preventDefault?.();
    dispatch(add_cart_product(formatProductForCart(prd)));
  };

  /* wishlist add (local first → sync if logged in) */
  const handleWishlistProduct = async (prd, e) => {
    e?.stopPropagation?.(); e?.preventDefault?.();

    // 1) Redux/UI
    const formatted = formatProductForWishlist(prd);
    dispatch(add_to_wishlist(formatted));

    // 2) localStorage merge
    const curr = readWishlistLocal(); // [{_id,...}]
    const map = new Map(curr.map((x) => [String(x?._id || x?.id), x]));
    const id = String(formatted?._id || formatted?.id || prd?._id || prd?.id);
    map.set(id, { _id: id, ...formatted });
    const next = Array.from(map.values());
    writeWishlistLocal(next);

    // 3) server sync if logged
    const uid = userId || getUserIdFromLocal();
    if (uid) {
      await syncWishlistTwoWay(uid);
    }
  };

  /* ⛓️ auto-sync when user logs in or returns to tab */
  useEffect(() => {
    const uid = userId || getUserIdFromLocal();
    if (uid) { syncWishlistTwoWay(uid); }
  }, [userId]);

  useEffect(() => {
    const onFocus = () => {
      const uid = userId || getUserIdFromLocal();
      if (uid) syncWishlistTwoWay(uid);
    };
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        const uid = userId || getUserIdFromLocal();
        if (uid) syncWishlistTwoWay(uid);
      }
    };
    const onStorage = (e) => {
      if (e.key === 'userid' || e.key === 'userId') {
        const uid = e.newValue;
        if (uid) syncWishlistTwoWay(uid);
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('storage', onStorage);
    };
  }, [userId]);

  if (!isVisible) return null;

  return (
    <div className="product-col">
      <div
        className={`fashion-product-card ${showActions ? 'show-actions' : ''}`}
        onMouseEnter={() => supportsHover && setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onTouchStart={() => setShowActions(true)}
      >
        <div className="card-wrapper">
          <div className="product-image-container">
            <Link
              href={`/fabric/${slug}`}
              aria-label={typeof titleHtml === 'string' ? titleHtml : 'View product'}
              className="image-link"
              onClick={(e) => {
                if (!supportsHover && !showActions) {
                  e.preventDefault();
                  setShowActions(true);
                }
              }}
            >
              <div className="image-wrapper">
                <Image
                  src={imageUrl}
                  alt={typeof titleHtml === 'string' ? titleHtml : 'product image'}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 320px"
                  className="img-main"
                  priority={false}
                />
                <div className="image-overlay" />
              </div>
            </Link>

            {showOptionsBadge && (
              <button
                type="button"
                className="options-ribbon"
                onClick={() => router.push(`/fabric/${slug}`)}
                aria-label={`${optionCount} options for ${typeof titleHtml === 'string' ? titleHtml : 'this product'}`}
              >
                <span className="ribbon-inner">
                  <span className="ribbon-icon" aria-hidden="true">
                    <Image
                      src="/assets/img/product/icons/tshirt.svg"
                      alt="Options Icon"
                      width={20}
                      height={20}
                      className="badge-icon"
                      priority={false}
                    />
                  </span>
                  <span className="ribbon-text"><strong>{optionCount}</strong> Options</span>
                </span>
              </button>
            )}

            <div className="product-actions">
              <button
                type="button"
                onClick={(e) => handleAddProduct(product, e)}
                className={`action-button ${inCart ? 'active cart-active' : ''}`}
                aria-label={inCart ? 'In cart' : 'Add to cart'}
                aria-pressed={inCart}
                title={inCart ? 'Added to cart' : 'Add to cart'}
              >
                {inCart ? <CartActive /> : <Cart />}
              </button>

              <button
                type="button"
                onClick={(e) => handleWishlistProduct(product, e)}
                className={`action-button ${inWishlist ? 'active wishlist-active' : ''}`}
                aria-label={inWishlist ? 'In wishlist' : 'Add to wishlist'}
                aria-pressed={inWishlist}
                title={inWishlist ? 'Added to wishlist' : 'Add to wishlist'}
              >
                {inWishlist ? <WishlistActive /> : <Wishlist />}
              </button>

              <button type="button" onClick={(e) => handleShare(product, e)} className="action-button" aria-label="Share product" title="Share">
                <Share />
              </button>
              <button type="button" onClick={(e) => { e?.preventDefault?.(); e?.stopPropagation?.(); dispatch(handleProductModal({ ...product })); }} className="action-button" aria-label="Quick view" title="Quick view">
                <QuickView />
              </button>
            </div>
          </div>

          <div className="product-info">
            {showCategory ? <div className="product-category">{categoryLabel}</div> : null}

            <h3 className="product-title">
              <Link href={`/fabric/${slug}`}>
                <span dangerouslySetInnerHTML={{ __html: titleHtml }} />
              </Link>
            </h3>

            {details.length ? (
              <div className="spec-columns">
                <ul className="spec-col">
                  {leftDetails.map((v, i) => (
                    <li key={i} className="spec-row" title={v}>
                      <span className="spec-value">{v}</span>
                    </li>
                  ))}
                </ul>
                <ul className="spec-col">
                  {rightDetails.map((v, i) => (
                    <li key={i} className="spec-row" title={v}>
                      <span className="spec-value">{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* (styles unchanged from your version) */}
      <style jsx>{`
        :global(.products-grid){ display:flex; flex-wrap:wrap; gap:24px; margin:0; }
        :global(.products-grid .product-col){ flex:1 1 calc(25% - 24px); max-width:calc(25% - 24px); }
        @media (max-width:991px){ :global(.products-grid .product-col){ flex:1 1 calc(50% - 24px); max-width:calc(50% - 24px); } }
        @media (max-width:575px){ :global(.products-grid .product-col){ flex:1 1 100%; max-width:100%; } }

        .fashion-product-card{
          --primary:#0f172a; --muted:#6b7280; --accent:#7c3aed;
          --success:#10b981; --danger:#ef4444; --maroon:#800000;
          --card-bg:#fff; --card-border:rgba(17,24,39,.12); --inner-border:rgba(17,24,39,.08);
          --shadow-sm:0 1px 2px rgba(0,0,0,.04);
          position:relative; width:100%; height:100%;
          transition:transform .3s ease-out, box-shadow .3s ease-out;
        }
        .fashion-product-card:hover{ transform:translateY(-2px); }
        .card-wrapper{ background:var(--card-bg); border:2px solid var(--card-border); border-radius:14px; overflow:hidden; box-shadow:var(--shadow-sm); }

        .product-image-container{ position:relative; aspect-ratio:1/1; min-height:220px; overflow:hidden; }
        .image-link{ display:block; height:100%; }
        .image-wrapper{ position:relative; width:100%; height:100%; transition:transform .6s cubic-bezier(.22,1,.36,1); background:#fff; }
        .fashion-product-card:hover .image-wrapper{ transform:scale(1.02); }
        :global(.img-main){ position:absolute; inset:0; object-fit:cover; }
        .image-overlay{ position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,.16) 0%, transparent 40%); z-index:1; }

        .options-ribbon{ position:absolute; left:50%; transform:translateX(-50%); bottom:10px; border:0; background:transparent; cursor:pointer; z-index:3; }
        .ribbon-inner{ display:flex; align-items:center; gap:8px; height:clamp(22px, 5.2vw, 30px); padding:0 clamp(8px, 2.2vw, 14px); border-radius:999px; background:rgba(255,255,255,0.28); backdrop-filter:blur(8px) saturate(180%); border:1px solid rgba(255,255,255,0.28); box-shadow:0 4px 10px rgba(0,0,0,0.10); transition:all .2s ease; }
        .options-ribbon:hover .ribbon-inner{ background:rgba(255,255,255,0.45); }
        .ribbon-icon{ display:inline-grid; place-items:center; width:clamp(16px, 4.5vw, 20px); height:clamp(16px, 4.5vw, 20px); }
        .badge-icon{ width:100%; height:100%; display:block; filter:drop-shadow(0 0 2px rgba(255,255,255,0.9)); }
        .ribbon-text{ font-size:clamp(12px, 3.2vw, 14px); font-weight:600; color:#111827; letter-spacing:.2px; line-height:1; }
        .ribbon-text strong{ font-weight:800; margin-right:4px; }

        .product-actions{ position:absolute; top:12px; right:12px; display:flex; flex-direction:column; gap:8px; opacity:0; transform:translateY(-6px); transition:opacity .25s ease, transform .25s ease; z-index:3; }
        @media (hover:hover) and (pointer:fine){
          .fashion-product-card:hover .product-actions,
          .fashion-product-card:focus-within .product-actions{ opacity:1; transform:translateY(0); }
        }
        .fashion-product-card.show-actions .product-actions{ opacity:1; transform:translateY(0); }

        .action-button{ width:34px; height:34px; border-radius:50%; display:grid; place-items:center; background:rgba(255,255,255,.95); backdrop-filter:blur(4px); border:1px solid rgba(0,0,0,.06); box-shadow:0 4px 12px rgba(0,0,0,.08); transition:transform .2s ease, box-shadow .2s ease, background .2s ease, border-color .2s ease, color .2s ease; }
        .action-button :global(svg){ width:16px; height:16px; color:var(--primary); transition:color .2s ease; }
        .action-button:hover{ background:var(--maroon); border-color:var(--maroon); box-shadow:0 6px 16px rgba(128,0,0,.25); transform:scale(1.06); }
        .action-button:hover :global(svg){ color:#fff !important; }
        .action-button.active{ box-shadow:0 6px 16px rgba(0,0,0,.12); }
        .action-button.cart-active{ background:#f0fdf4; border-color:rgba(16,185,129,.35); }
        .action-button.cart-active :global(svg){ color:#10b981; }
        .action-button.wishlist-active{ background:#fef2f2; border-color:rgba(239,68,68,.35); }
        .action-button.wishlist-active :global(svg){ color:#ef4444; }
        .action-button:focus-visible{ outline:2px solid #800000; outline-offset:2px; }

        .product-info{ padding:18px 12px 12px; border-top:1px solid var(--inner-border); background:#fff; }
        .product-category{ font-size:11px; font-weight:600; letter-spacing:.02em; color:#6b7280; margin-bottom:4px; }
        .product-title{ font-family:'Montserrat',system-ui,Arial,sans-serif; font-size:clamp(14px,1.9vw,16px); font-weight:700; line-height:1.22; letter-spacing:.002em; color:#111827; margin:0 0 6px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; word-break:break-word; }
        .product-title :global(a){ color:inherit; text-decoration:none; }
        .product-title :global(a:hover){ color:#800000; }

        .spec-columns{ display:grid; grid-template-columns:1fr 1fr; gap:0 16px; margin-top:4px; }
        @media (max-width:340px){ .spec-columns{ grid-template-columns:1fr; } }
        .spec-col{ list-style:none; margin:0; padding:0; }
        .spec-row{ display:block; padding:5px 0; border-bottom:1px dashed rgba(17,24,39,.06); }
        .spec-row:last-child{ border-bottom:0; }
        .spec-value{ font-size:12.5px; font-weight:500; color:#374151; line-height:1.28; letter-spacing:.005em; }

        .price-wrapper{ display:none; }
      `}</style>
    </div>
  );
};

export default ProductItem;
