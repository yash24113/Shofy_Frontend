'use client';

import React, { useEffect, useState, useId, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';

import { formatProductForCart, formatProductForWishlist } from '@/utils/authUtils';
import { add_to_cart, openCartMini, fetch_cart_products } from '@/redux/features/cartSlice';
import { toggleWishlistItem } from '@/redux/features/wishlist-slice';

import { Cart, CartActive, Wishlist, WishlistActive, QuickView, Share } from '@/svg';
import { handleProductModal } from '@/redux/features/productModalSlice';
import { useGetProductsByGroupcodeQuery } from '@/redux/features/productApi';
import { useGetSeoByProductQuery } from '@/redux/features/seoApi';

import useGlobalSearch from '@/hooks/useGlobalSearch';
import { buildSearchPredicate } from '@/utils/searchMiddleware';

import { selectUserId } from '@/utils/userSelectors';

/* helpers */
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

/* safely extract a comparable id */
const getAnyId = (obj) =>
  obj?._id || obj?.id || obj?.productId || obj?.slug || obj?.product?._id || obj?.product?.id || obj?.product;

/* ensure a robust cart payload for your slice */
const buildCartItem = (prd, opts = {}) => {
  const id = getAnyId(prd);
  const slug = prd?.slug || prd?.product?.slug || id;
  const name =
    prd?.name ||
    prd?.product?.name ||
    prd?.productname ||
    prd?.title ||
    prd?.productTitle ||
    prd?.groupcode?.name ||
    'Product';

  // fallbacks for price & image
  const price =
    prd?.price ??
    prd?.mrp ??
    prd?.minPrice ??
    prd?.sellingPrice ??
    prd?.product?.price ??
    0;

  const image =
    prd?.image ||
    prd?.img ||
    prd?.image1 ||
    prd?.image2 ||
    prd?.thumbnail ||
    prd?.images?.[0] ||
    prd?.mainImage ||
    '/assets/img/product/default-product-img.jpg';

  return {
    // common ids your reducers typically use:
    _id: id,
    id,
    productId: id,

    // core fields:
    name,
    slug,
    image,
    price,

    // cart fields:
    qty: opts.qty ?? 1,

    // keep original for reducers/selectors that need full object
    product: prd,

    // allow downstream overrides
    ...opts,
  };
};

const ProductItem = ({ product }) => {
  const router = useRouter();
  const rainbowId = useId();
  const dispatch = useDispatch();

  const { debounced: q } = useGlobalSearch();

  const [showActions, setShowActions] = useState(false);
  const [supportsHover, setSupportsHover] = useState(true);
  const [addingCart, setAddingCart] = useState(false);
  const [optimisticInCart, setOptimisticInCart] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSupportsHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
    }
  }, []);

  // Get userId from centralized selector (might not be required for local cart, but keep)
  const userId = useSelector(selectUserId);

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

  /* title, slug, category */
  const productId = getAnyId(product);
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

  /* options count */
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

  /* select from slices */
  const cartItems = useSelector((s) => s.cart?.cart_products || []);
  const wishlistItems = useSelector((s) => s.wishlist?.wishlist || []);

  // robust id matching against various shapes
  const inCartReal = cartItems.some((it) => String(getAnyId(it)) === String(productId));
  const inCart = inCartReal || optimisticInCart;
  const inWishlist = wishlistItems.some((it) => String(getAnyId(it)) === String(productId));

  /* ADD TO CART — server-backed with header/mini-cart refresh */
  const handleAddProduct = async (prd, e) => {
    e?.stopPropagation?.(); e?.preventDefault?.();
    if (addingCart) return;
    setAddingCart(true);

    try {
      // 1) Start with a safe normalized shape
      const baseItem = buildCartItem(prd, { qty: 1 });

      // 2) Merge any richer mapping you already have
      const mapped = (typeof formatProductForCart === 'function')
        ? { ...baseItem, ...formatProductForCart(prd) }
        : baseItem;

      // Require login
      if (!userId) {
        router.push('/login');
        return;
      }

      // 3) Call API thunk and refresh slice
      await dispatch(add_to_cart({ userId, productId: mapped.productId, quantity: mapped.qty })).unwrap();
      await dispatch(fetch_cart_products({ userId }));

      // 4) Optimistic UI + open mini cart
      setOptimisticInCart(true);
      dispatch(openCartMini());
      setShowActions(true);
    } catch (err) {
      console.error('Add to cart failed:', err);
    } finally {
      setAddingCart(false);
    }
  };

  // server-backed toggle (PUT)
  const handleWishlistProduct = async (prd, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    // If we still don't have a userId, go to login
    if (!userId) {
      router.push('/login');
      return;
    }

    const formatted = (typeof formatProductForWishlist === 'function')
      ? formatProductForWishlist(prd)
      : { product: prd, productId: getAnyId(prd) };

    try {
      await dispatch(toggleWishlistItem({ userId, product: formatted })).unwrap();
    } catch (err) {
      console.error('Wishlist toggle failed:', err);
    }
  };

  const openQuickView = (prd, e) => {
    e?.preventDefault?.(); e?.stopPropagation?.();
    dispatch(handleProductModal({ ...prd }));
  };

  /* 🔎 decide visibility for this item */
  const isVisible = useMemo(() => {
    const query = (q || '').trim();
    if (query.length < 2) return true; // no filtering until 2+ chars
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
                disabled={addingCart}
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

              <button
                type="button"
                onClick={(e) => {
                  e?.stopPropagation?.(); e?.preventDefault?.();
                  const url = (typeof window !== 'undefined'
                    ? `${window.location.origin}/fabric/${slug}`
                    : `/fabric/${slug}`);
                  const title = typeof titleHtml === 'string' ? titleHtml : 'Fabric';
                  const text = 'Check out this fabric on Amrita Global Enterprises';
                  (async () => {
                    try {
                      if (navigator?.share) await navigator.share({ title, text, url });
                      else if (navigator?.clipboard) {
                        await navigator.clipboard.writeText(url);
                        alert('Link copied!');
                      } else {
                        prompt('Copy link', url);
                      }
                    } catch {/* ignore */}
                  })();
                }}
                className="action-button"
                aria-label="Share product"
                title="Share"
              >
                <Share />
              </button>

              <button
                type="button"
                onClick={(e) => openQuickView(product, e)}
                className="action-button"
                aria-label="Quick view"
                title="Quick view"
              >
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
        .ribbon-inner:hover{ background:rgba(255,255,255,0.45); }
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
