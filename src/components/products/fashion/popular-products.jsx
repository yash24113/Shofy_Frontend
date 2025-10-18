'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';

// If not imported globally, uncomment these:
// import 'swiper/css';
// import 'swiper/css/pagination';

import { useDispatch, useSelector } from 'react-redux';
import { TextShapeLine } from '@/svg';
import ErrorMsg from '@/components/common/error-msg';
import { HomeTwoPopularPrdLoader } from '@/components/loader';
import { useGetPopularNewProductsQuery } from '@/redux/features/newProductApi';
import { add_cart_product } from '@/redux/features/cartSlice';
import { notifyError } from '@/utils/toast';

/* ---------- helpers ---------- */
const isAbsUrl = (s) => /^(https?:)?\/\//i.test(s || '');
const pickUrlDeep = function pick(v) {
  if (!v) return '';
  if (typeof v === 'string') {
    const s = v.trim().replace(/\s+/g, '');
    return s.startsWith('//') ? `https:${s}` : s;
  }
  if (Array.isArray(v)) {
    for (const x of v) {
      const got = pickUrlDeep(x);
      if (got) return got;
    }
    return '';
  }
  if (typeof v === 'object') {
    const direct =
      v.secure_url ||
      v.url ||
      v.path ||
      v.key ||
      v.src ||
      v.publicUrl ||
      v.imageUrl;
    const fromDirect = pickUrlDeep(direct);
    if (fromDirect) return fromDirect;
    for (const val of Object.values(v)) {
      const got = pickUrlDeep(val);
      if (got) return got;
    }
    return '';
  }
  return '';
};

function absoluteUrlFromAnything(src) {
  const raw = pickUrlDeep(src);
  if (!raw) return '';
  if (isAbsUrl(raw)) return raw;

  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  const clean = String(raw)
    .replace(/^\/+/, '')
    .replace(/^api\/uploads\/?/, '')
    .replace(/^uploads\/?/, '');
  return base ? `${base}/uploads/${clean}` : `/${clean}`;
}

function getItemImage(item) {
  const p = item?.product || item;
  return (
    absoluteUrlFromAnything(p?.img) ||
    absoluteUrlFromAnything(p?.image) ||
    absoluteUrlFromAnything(p?.images) ||
    absoluteUrlFromAnything(p?.thumbnail) ||
    absoluteUrlFromAnything(p?.cover) ||
    absoluteUrlFromAnything(p?.photo) ||
    absoluteUrlFromAnything(p?.picture) ||
    absoluteUrlFromAnything(p?.media) ||
    absoluteUrlFromAnything(p?.featuredImage) ||
    absoluteUrlFromAnything(p?.defaultImage) ||
    ''
  );
}

/* ---------- helper for hover tag ---------- */
function getTrendTag(p) {
  const name = (p?.name || '').toLowerCase();
  if (/(denim|jean)/i.test(name)) return 'Trending Denim';
  if (/(knit|jersey|interlock|rib)/i.test(name)) return 'Hot in Knits';
  if (/(twill|poplin|oxford|weave|woven)/i.test(name)) return 'Best in Weaves';
  return 'Trending Product';
}

/* ---------- slider options (with dots) ---------- */
const SLIDER_OPTS = {
  spaceBetween: 24,
  rewind: true,
  speed: 650,
  centeredSlides: false,
  autoplay: {
    delay: 2600,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  },
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  breakpoints: {
    1200: { slidesPerView: 5, slidesOffsetBefore: 16, slidesOffsetAfter: 16 },
    992: { slidesPerView: 4, slidesOffsetBefore: 16, slidesOffsetAfter: 16 },
    768: { slidesPerView: 3, slidesOffsetBefore: 12, slidesOffsetAfter: 12 },
    576: { slidesPerView: 2, slidesOffsetBefore: 8, slidesOffsetAfter: 8 },
    0: { slidesPerView: 1, slidesOffsetBefore: 8, slidesOffsetAfter: 8 },
  },
  keyboard: { enabled: true, onlyInViewport: true },
};

export default function PopularProducts() {
  const { data, isError, isLoading } = useGetPopularNewProductsQuery();
  const { cart_products } = useSelector((s) => s.cart);
  const dispatch = useDispatch();

  const addToCart = (prd) => {
    if (prd?.status === 'out-of-stock') {
      notifyError('This product is out of stock');
      return;
    }
    dispatch(add_cart_product(prd));
  };

  let carousel = <ErrorMsg msg="No Products found!" />;
  if (isLoading) carousel = <HomeTwoPopularPrdLoader loading />;
  if (!isLoading && isError) carousel = <ErrorMsg msg="There was an error" />;

  if (
    !isLoading &&
    !isError &&
    data?.success &&
    Array.isArray(data.data) &&
    data.data.length
  ) {
    const items = data.data;

    carousel = (
      <Swiper
        {...SLIDER_OPTS}
        modules={[Pagination, Autoplay]}
        className="tp-category-slider-active-2"
      >
        {items.map((seoDoc, idx) => {
          const p = seoDoc.product || seoDoc;
          const src = getItemImage(seoDoc) || '/assets/img/product/product-1.jpg';
          const pid = p?._id;
          const pname = p?.name ?? 'Product';

          return (
            <SwiperSlide key={seoDoc._id || pid || idx}>
              <div className="tp-category-item-2 text-center tp-slide-card">
                {/* Product Card */}
                <div className="pp-tile">
                  <Link
                    href={`/product-details/${pid}`}
                    className="pp-tile-link"
                    aria-label={pname}
                  >
                    <Image
                      src={src}
                      alt={pname}
                      fill
                      sizes="(max-width: 768px) 60vw, 224px"
                      priority={idx === 0}
                      loading={idx === 0 ? undefined : 'lazy'}
                      quality={60}
                      className="pp-img"
                    />
                    {/* Hover overlay */}
                    <div className="pp-overlay">
                      <span className="pp-badge">{getTrendTag(p)}</span>
                      <h4 className="pp-title">{pname}</h4>
                    </div>
                  </Link>
                </div>

                {/* Bottom caption */}
                <div className="tp-category-content-2">
                  <h3 className="tp-category-title-2">
                    <Link href={`/product-details/${pid}`}>
                      {String(pname).slice(0, 40)}
                    </Link>
                  </h3>
                  <div className="tp-category-btn-2">
                    {cart_products?.some?.((cp) => cp._id === pid) ? (
                      <Link href="/cart" className="tp-btn tp-btn-border">
                        View Cart
                      </Link>
                    ) : (
                      // eslint-disable-next-line jsx-a11y/anchor-is-valid
                      <a onClick={() => addToCart(p)} className="tp-btn tp-btn-border">
                        Add to Cart
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
        {/* dots */}
        <div className="swiper-pagination" />
      </Swiper>
    );
  }

  return (
    <section className="tp-category-area pb-95 pt-95">
      <div className="container">
        <div className="row">
          <div className="col-xl-12">
            <div className="tp-section-title-wrapper-2 text-center mb-50">
              <span className="tp-section-title-pre-2">
                Most Loved by Fashion Designers
                <TextShapeLine />
              </span>
              <h3 className="tp-section-title-2">
                Our Top-Rated Knit, Denim &amp; Weaves
              </h3>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-xl-12">
            <div className="tp-category-slider-2 p-relative">{carousel}</div>
          </div>
        </div>
      </div>

      {/* ====== STYLE SECTION ====== */}
      <style jsx global>{`
        /* layout & swiper */
        .tp-category-area {
          margin-bottom: 48px;
        }
        .tp-category-slider-2 .swiper {
          padding: 6px 8px 24px;
          overflow: hidden;
        }
        .tp-slide-card {
          padding: 6px;
          box-sizing: border-box;
        }

        /* ---------- PRODUCT CARD ---------- */
        .pp-tile {
          position: relative;
          width: 100%;
          aspect-ratio: 224 / 260;
          background: var(--tp-grey-1);
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid var(--tp-grey-2);
          box-shadow: 0 6px 14px rgba(17, 35, 56, 0.05);
          transition: transform 0.25s ease, box-shadow 0.25s ease,
            border-color 0.25s ease;
        }
        .pp-tile:hover {
          transform: translateY(-5px);
          border-color: var(--tp-theme-primary);
          box-shadow: 0 8px 22px rgba(44, 76, 151, 0.15);
        }

        .pp-tile-link {
          display: block;
          width: 100%;
          height: 100%;
          position: relative;
        }

        .pp-img {
          object-fit: contain !important;  /* keep full image visible */
          object-position: center;
          transition: transform 0.4s ease;
          background: var(--tp-grey-1);
        }
        .pp-tile:hover .pp-img {
          transform: scale(1.05);
        }

        /* hover overlay */
        .pp-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-end;
          padding: 14px 12px 16px;
          background: linear-gradient(
            180deg,
            rgba(17, 35, 56, 0) 40%,
            rgba(17, 35, 56, 0.8) 100%
          );
          opacity: 0;
          transition: opacity 0.25s ease-in-out;
        }
        .pp-tile:hover .pp-overlay {
          opacity: 1;
        }

        /* badge */
        .pp-badge {
          margin-bottom: 8px;
          padding: 6px 10px;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            var(--tp-theme-secondary),
            var(--tp-theme-primary)
          );
          color: #fff;
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 0.2px;
          box-shadow: 0 2px 10px rgba(44, 76, 151, 0.25);
        }

        .pp-title {
          color: #fff;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.3;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        /* caption */
        .tp-category-content-2 {
          margin-top: 10px;
        }
        .tp-category-title-2 a {
          color: var(--tp-text-1);
          font-weight: 600;
          transition: color 0.2s ease;
        }
        .tp-category-title-2 a:hover {
          color: var(--tp-theme-primary);
        }

        /* CTA button */
        .tp-btn.tp-btn-border {
          border-color: var(--tp-theme-primary);
          color: var(--tp-theme-primary);
          transition: all 0.2s ease;
        }
        .tp-btn.tp-btn-border:hover {
          background: var(--tp-theme-primary);
          color: #fff;
        }

        /* ---------- DOT PAGINATION (replaces scrollbar) ---------- */
        .swiper-pagination {
          margin-top: 16px;
          text-align: center;
          position: static;
        }
        .swiper-pagination-bullet {
          background: var(--tp-grey-7);
          opacity: 1;
          width: 10px;
          height: 10px;
          margin: 0 6px !important;
          transition: all 0.3s ease;
        }
        .swiper-pagination-bullet-active {
          background: var(--tp-theme-primary);
          width: 24px;
          border-radius: 6px;
        }
      `}</style>
    </section>
  );
}
