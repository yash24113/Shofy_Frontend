'use client';
import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
// import 'swiper/css';
// import 'swiper/css/pagination';

import Link from 'next/link';
import { useGetTopRatedQuery } from '@/redux/features/newProductApi';
import { ArrowRightLong, TextShapeLine } from '@/svg';
import ErrorMsg from '@/components/common/error-msg';
import { HomeTwoFeaturedPrdLoader } from '@/components/loader';

/* ---------------- slider options ---------------- */
const slider_setting = {
  slidesPerView: 3,
  spaceBetween: 10,
  pagination: { el: '.tp-featured-pagination', clickable: true }, // ✅ dots only
  breakpoints: {
    1200: { slidesPerView: 3 },
    992:  { slidesPerView: 3 },
    768:  { slidesPerView: 2 },
    576:  { slidesPerView: 1 },
    0:    { slidesPerView: 1 },
  },
  keyboard: { enabled: true, onlyInViewport: true },
};

/* ---------------- robust image helpers ---------------- */
const isAbsUrl = (s) => /^(https?:)?\/\//i.test(s || '');
const pickUrlDeep = function pick(v) {
  if (!v) return '';
  if (typeof v === 'string') {
    const s = v.trim().replace(/\s+/g, '');
    return s.startsWith('//') ? `https:${s}` : s;
  }
  if (Array.isArray(v)) for (const x of v) { const got = pickUrlDeep(x); if (got) return got; }
  if (typeof v === 'object')
    for (const val of Object.values(v || {})) {
      const got = pickUrlDeep(val);
      if (got) return got;
    }
  return '';
};

function absoluteUrlFromAnything(src) {
  const raw = pickUrlDeep(src);
  if (!raw) return '';
  if (isAbsUrl(raw)) return raw;
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  const clean = String(raw).replace(/^\/+/, '').replace(/^api\/+/, '');
  return base ? `${base}/${clean}` : `/${clean}`;
}

function getImageUrl(item) {
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
    '/assets/img/product/default-product-img.jpg'
  );
}

/* ---------------- component ---------------- */
const WeeksFeatured = () => {
  const { data: products, isError, isLoading } = useGetTopRatedQuery();

  let content = null;
  if (isLoading) content = <HomeTwoFeaturedPrdLoader loading />;
  else if (isError) content = <ErrorMsg msg="There was an error" />;
  else if (!products?.data?.length) content = <ErrorMsg msg="No Products found!" />;
  else {
    const items = products.data;

    content = (
      <Swiper {...slider_setting} modules={[Pagination]} className="tp-featured-slider-active">
        {items.map((item, idx) => {
          const p = item?.product || item;
          const pid = p?._id || idx;
          const title = p?.name || item?.title || 'Product Name';
          const bg = getImageUrl(item);
          const slug = p?.slug || pid;
          const detailsHref = `/fabric/${encodeURIComponent(slug)}`;

          return (
            <SwiperSlide key={pid} className="tp-featured-item white-bg p-relative z-index-1">
              {/* Image */}
              <div
                className="tp-featured-thumb include-bg"
                aria-label={title}
                style={{
                  backgroundImage: `url(${bg})`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  aspectRatio: '16 / 9',
                  borderRadius: '16px',
                  backgroundColor: 'var(--tp-grey-1)',
                }}
              />

              {/* Content */}
              <div className="tp-featured-content">
                <div className="tp-latest-chip">Latest Collection</div>
                <h3 className="tp-featured-title">
                  <Link href={detailsHref} className="tp-featured-title-link">
                    {title}
                  </Link>
                </h3>
                <div className="tp-featured-btn">
                  <Link href={detailsHref} className="tp-btn tp-btn-border tp-btn-border-sm">
                    Shop Now <ArrowRightLong />
                  </Link>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
        {/* ✅ dots centered below */}
        <div className="tp-featured-pagination" />
      </Swiper>
    );
  }

  return (
    <section className="tp-featured-slider-area grey-bg-6 fix pt-95 pb-120">
      <div className="container">
        <div className="row">
          <div className="col-xl-12">
            <div className="tp-section-title-wrapper-2 mb-50">
              <span className="tp-section-title-pre-2">
                On-Trend Textures <TextShapeLine />
              </span>
              <h3 className="tp-section-title-2">The Ultimate Fabric Collection</h3>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-xl-12">
            <div className="tp-featured-slider">{content}</div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* Card layout */
        .tp-featured-item {
          background: var(--tp-common-white);
          border: 1px solid var(--tp-grey-2);
          border-radius: 18px;
          overflow: hidden;
          transition: box-shadow 0.25s ease, transform 0.25s ease;
        }
        .tp-featured-item:hover {
          box-shadow: 0 10px 24px rgba(17, 35, 56, 0.12);
          transform: translateY(-2px);
        }

        .tp-featured-content { padding: 18px 18px 22px; }

        .tp-latest-chip {
          display: inline-block;
          font-size: 12px;
          letter-spacing: .06em;
          color: var(--tp-common-white);
          background: var(--tp-theme-primary);
          padding: 6px 10px;
          border-radius: 999px;
          margin-bottom: 10px;
        }

        .tp-featured-title { margin: 0 0 10px; line-height: 1.25; color: var(--tp-text-1); }
        .tp-featured-title-link {
          color: var(--tp-text-1);
          text-decoration: none;
          transition: color .2s ease;
        }
        .tp-featured-title-link:hover { color: var(--tp-theme-primary); }

        /* Hide arrows entirely */
        .tp-featured-slider-arrow,
        .tp-nav-prev,
        .tp-nav-next { display: none !important; }

        /* ✅ Centered dot pagination */
        .tp-featured-pagination {
          margin-top: 28px;
          text-align: center;
          position: static;
        }
        .tp-featured-pagination .swiper-pagination-bullet {
          background: var(--tp-grey-7);
          opacity: 1;
          width: 10px;
          height: 10px;
          margin: 0 6px !important;
          transition: all 0.3s ease;
        }
        .tp-featured-pagination .swiper-pagination-bullet-active {
          background: var(--tp-theme-primary);
          width: 24px;
          border-radius: 6px;
        }

        /* Section bg */
        .tp-featured-slider-area.grey-bg-6 { background: var(--tp-grey-1); }
      `}</style>
    </section>
  );
};

export default WeeksFeatured;
