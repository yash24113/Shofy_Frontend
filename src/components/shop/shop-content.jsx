'use client';
import React, { useState, useEffect, useRef } from 'react';
import ProductItem from '../products/fashion/product-item';
import ShopListItem from './shop-list-item';
import ShopTopLeft from './shop-top-left';
import ShopTopRight from './shop-top-right';
import ShopSidebarFilters from './ShopSidebarFilters';
import ResetButton from './shop-filter/reset-button';
import EmptyState from '@/components/common/empty-state';

// ====== config ======
const COLS_PER_ROW = 4;
const INITIAL_ROWS = 3;
const STEP_GRID = COLS_PER_ROW;
const INITIAL_ROWS_SEARCH = 5;
const STEP_SEARCH = 5;

const ShopContent = ({
  all_products = [],
  products = [],
  otherProps,
  shop_right,
  hidden_sidebar,
}) => {
  const {
    priceFilterValues,
    selectHandleFilter,
    setCurrPage,
    currPage = 1,
    selectedFilters,
    handleFilterChange,
  } = otherProps || {};

  const { setPriceValue, priceValue } = priceFilterValues || {};
  const [filteredRows, setFilteredRows] = useState(products);

  // detect SEARCH (row-wise) mode from ?searchText=
  const [isSearchMode, setIsSearchMode] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const usp = new URLSearchParams(window.location.search);
    setIsSearchMode(
      usp.has('searchText') &&
      String(usp.get('searchText') || '').trim().length > 0
    );
  }, []);

  // visible count
  const initialVisible = isSearchMode
    ? Math.min(INITIAL_ROWS_SEARCH, products.length || 0)
    : Math.min(INITIAL_ROWS * COLS_PER_ROW, products.length || 0);
  const [visibleCount, setVisibleCount] = useState(initialVisible);

  const prevCountRef = useRef(0);
  useEffect(() => { prevCountRef.current = visibleCount; }, [visibleCount]);

  // empty state centering
  const [centerOffset, setCenterOffset] = useState(140);
  useEffect(() => {
    const calc = () => {
      const header =
        document.querySelector('.tp-header-area') ||
        document.querySelector('.tp-header-style-primary');
      const toolbar = document.querySelector('.shop-toolbar-sticky');
      const h = header ? header.getBoundingClientRect().height : 0;
      const t = toolbar ? toolbar.getBoundingClientRect().height : 0;
      setCenterOffset(h + t);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  // sync on products / mode change
  useEffect(() => {
    setFilteredRows(products);
    setVisibleCount(
      isSearchMode
        ? Math.min(INITIAL_ROWS_SEARCH, products.length || 0)
        : Math.min(INITIAL_ROWS * COLS_PER_ROW, products.length || 0)
    );
    setCurrPage?.(1);
  }, [products, isSearchMode, setCurrPage]);

  const maxPrice = all_products.reduce(
    (m, p) => Math.max(m, +p?.salesPrice || +p?.price || 0),
    1000
  );

  const pv = Array.isArray(priceValue) ? priceValue : [0, maxPrice];
  const priceActive = pv[0] > 0 || pv[1] < maxPrice;
  const facetsActive =
    selectedFilters && Object.values(selectedFilters).some((v) =>
      Array.isArray(v) ? v.length > 0 : !!v
    );
  const anyActive = !!(priceActive || facetsActive);

  const resetAll = () => {
    setPriceValue?.([0, maxPrice]);
    handleFilterChange?.({});
    setCurrPage?.(1);
  };

  // infinite scroll
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const onIntersect = (entries) => {
      const entry = entries[0];
      if (!entry.isIntersecting || loadingRef.current) return;
      const step = isSearchMode ? STEP_SEARCH : STEP_GRID;
      if (visibleCount < filteredRows.length) {
        loadingRef.current = true;
        requestAnimationFrame(() => {
          setVisibleCount((c) => Math.min(c + step, filteredRows.length));
          setTimeout(() => { loadingRef.current = false; }, 100);
        });
      }
    };

    const io = new IntersectionObserver(onIntersect, {
      root: null,
      rootMargin: '240px 0px',
      threshold: 0.01,
    });

    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [filteredRows.length, visibleCount, isSearchMode]);

  // reveal on viewport
  const gridRef = useRef(null);
  useEffect(() => {
    const host = gridRef.current;
    if (!host) return;
    const els = host.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && en.target.classList.add('reveal--visible')),
      { root: null, rootMargin: '60px 0px', threshold: 0.1 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [filteredRows, visibleCount, isSearchMode]);

  return (
    <section className="tp-shop-area pb-120">
      <div className="container">
        <div className="row">
          {/* sidebar */}
          {!shop_right && !hidden_sidebar && (
            <aside className="col-xl-3 col-lg-4 d-none d-lg-block">
              <div className="sticky-filter">
                <div className="filter-header d-flex align-items-center justify-content-between">
                  <h3 className="tp-shop-widget-title mb-0">Filter</h3>
                  <ResetButton
                    className="filter-reset-btn"
                    active={anyActive}
                    setPriceValues={setPriceValue}
                    maxPrice={maxPrice}
                    handleFilterChange={handleFilterChange}
                    aria-label="Reset all filters"
                  />
                </div>
                <ShopSidebarFilters
                  selected={selectedFilters}
                  onFilterChange={handleFilterChange}
                  hideTitle={true}
                />
              </div>
            </aside>
          )}

          {/* main */}
          <div className={hidden_sidebar ? 'col-xl-12 col-lg-12' : 'col-xl-9 col-lg-8 col-12'}>
            <div className="tp-shop-main-wrapper">
              <div className="shop-toolbar-sticky">
                <div className="tp-shop-top mb-45">
                  <div className="row">
                    <div className="col-xl-6">
                      <ShopTopLeft
                        showing={filteredRows.slice(0, visibleCount).length}
                        total={all_products.length}
                      />
                    </div>
                    {/* <div className="col-xl-6"><ShopTopRight selectHandleFilter={selectHandleFilter} /></div> */}
                  </div>
                </div>
              </div>

              <div className="tp-shop-items-wrapper tp-shop-item-primary">
                {filteredRows.length === 0 ? (
                  <div className="shop-empty" style={{ ['--page-offset']: `${centerOffset}px` }}>
                    <EmptyState
                      title="No products match your filters"
                      subtitle="Try adjusting your filters or explore more categories."
                      tips={['Clear some filters', 'Try a different category', 'Widen the price range']}
                      primaryAction={{ label: 'Reset all filters', onClick: resetAll }}
                      secondaryAction={{ label: 'Browse all products', href: '/fabric' }}
                    />
                  </div>
                ) : (
                  <>
                    <div className="tab-content" id="productTabContent">
                      <div className="tab-pane fade show active" id="grid-tab-pane">
                        <div ref={gridRef} className={`products-grid ${isSearchMode ? 'is-list' : ''}`}>
                          {filteredRows.slice(0, visibleCount).map((item, idx) => {
                            const perRow = isSearchMode ? 1 : COLS_PER_ROW;
                            const delayMs = (idx % perRow) * 60;
                            const isNew = idx >= prevCountRef.current - (isSearchMode ? STEP_SEARCH : STEP_GRID);
                            return (
                              <div
                                key={item?._id || item?.id || idx}
                                className={`product-cell reveal ${isNew ? 'item-appear' : ''}`}
                                style={{ animationDelay: `${delayMs}ms` }}
                              >
                                <div className={`product-card ${isSearchMode ? 'row-card' : ''}`}>
                                  {isSearchMode ? (
                                    <ShopListItem product={item} />
                                  ) : (
                                    <ProductItem product={item} />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div ref={sentinelRef} className="sentinel" />
                  </>
                )}
              </div>
            </div>
          </div>

          {shop_right && <aside className="col-xl-3 col-lg-4 d-none d-lg-block"></aside>}
        </div>
      </div>

      <style jsx>{`
        .shop-empty {
          min-height: calc(100vh - var(--page-offset, 140px));
          display: grid;
          place-items: center;
          padding: 8px 0;
        }

        /* Grid layout */
        .products-grid {
          display: grid;
          gap: 24px;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          align-items: stretch;
        }
        @media (max-width: 1199px) { .products-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 991px)  { .products-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 575px)  { .products-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; } }

        /* Row-wise list (search mode) */
        .products-grid.is-list { grid-template-columns: 1fr; gap: 16px; }

        .product-cell { will-change: transform, opacity; min-width: 0; }
        .product-card {
          width: 100%;
          max-width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        /* Reveal animations */
        .reveal {
          opacity: 0;
          transform: translateY(12px) scale(0.98);
          transition: opacity .32s ease-out, transform .32s ease-out;
        }
        .reveal.reveal--visible { opacity: 1; transform: translateY(0) scale(1); }
        .item-appear { animation: ytp-pop .35s ease-out both; }
        @keyframes ytp-pop {
          0% { opacity: 0; transform: translateY(10px) scale(0.98); }
          60%{ opacity: 1; transform: translateY(0) scale(1.005); }
          100%{ opacity: 1; transform: translateY(0) scale(1); }
        }

        .sentinel { width: 100%; height: 1px; }
      `}</style>

      {/* ---------- HARD OVERRIDES (with Next/Image fallbacks) ---------- */}
      <style jsx global>{`
        /* Stop nested rows/cols from constraining cards */
        .products-grid .product-card .row,
        .products-grid .product-card [class*="col-"] {
          width: 100% !important;
          max-width: 100% !important;
          flex: 1 1 auto !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        .products-grid .product-card a { display: block; max-width: 100% !important; }

        /* Theme thumb wrappers */
        .products-grid .product-card .tp-product-thumb,
        .products-grid .product-card .product-thumb,
        .products-grid .product-card .thumb,
        .products-grid .product-card .image,
        .products-grid .product-card .card-img,
        .products-grid .product-card .card-image,
        .products-grid .product-card .product-media,
        .products-grid .product-card .media,
        .products-grid .product-card .thumbnail,
        .products-grid .product-card .tp-product-img,
        .products-grid .product-card .tp-product__thumb {
          position: relative !important;
          display: block !important;
          width: 100% !important;
          max-width: 100% !important;
          overflow: hidden !important;
          border-radius: 12px !important;
          aspect-ratio: 1 / 1 !important; /* square in grid */
        }

        /* ★★★★★ Next/Image fallback: span that directly contains an <img> */
        .products-grid .product-card span:has(> img) {
          position: relative !important;
          display: block !important;
          width: 100% !important;
          max-width: 100% !important;
          overflow: hidden !important;
          border-radius: 12px !important;
          aspect-ratio: 1 / 1 !important; /* square in grid */
        }

        /* In list (search) mode, use a fixed square thumbnail */
        .products-grid.is-list .product-card .tp-product-thumb,
        .products-grid.is-list .product-card .product-thumb,
        .products-grid.is-list .product-card .thumb,
        .products-grid.is-list .product-card .image,
        .products-grid.is-list .product-card .card-img,
        .products-grid.is-list .product-card .card-image,
        .products-grid.is-list .product-card .product-media,
        .products-grid.is-list .product-card .media,
        .products-grid.is-list .product-card .thumbnail,
        .products-grid.is-list .product-card .tp-product-img,
        .products-grid.is-list .product-card .tp-product__thumb,
        .products-grid.is-list .product-card span:has(> img) {
          width: 240px !important;
          max-width: 40vw !important;
          aspect-ratio: 1 / 1 !important;
          float: left !important;
          margin-right: 16px !important;
        }

        /* Make image fill its wrapper (theme or Next/Image) */
        .products-grid .product-card .tp-product-thumb img,
        .products-grid .product-card .product-thumb img,
        .products-grid .product-card .thumb img,
        .products-grid .product-card .image img,
        .products-grid .product-card .card-img img,
        .products-grid .product-card .card-image img,
        .products-grid .product-card .product-media img,
        .products-grid .product-card .media img,
        .products-grid .product-card .thumbnail img,
        .products-grid .product-card .tp-product-img img,
        .products-grid .product-card .tp-product__thumb img,
        .products-grid .product-card span:has(> img) > img {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          max-width: none !important;
          max-height: none !important;
        }

        /* Guard against tiny fixed widths */
        .products-grid .product-card,
        .products-grid .product-card > * {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
        }
      `}</style>
    </section>
  );
};

export default ShopContent;
