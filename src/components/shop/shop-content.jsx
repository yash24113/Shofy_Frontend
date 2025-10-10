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
const COLS_PER_ROW = 4;     // exactly 4 per load step
const INITIAL_ROWS = 3;     // show 3 rows initially (12 items)
const STEP = COLS_PER_ROW;  // load 1 row (4 items) each time the sentinel appears

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

  // how many products visible
  const [visibleCount, setVisibleCount] = useState(
    Math.min(INITIAL_ROWS * COLS_PER_ROW, products.length || 0)
  );

  // keep the previous count to add appear-anim only on fresh items
  const prevCountRef = useRef(0);
  useEffect(() => { prevCountRef.current = visibleCount; }, [visibleCount]);

  // measure header + toolbar to center the empty state
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

  // sync when incoming products change
  useEffect(() => {
    setFilteredRows(products);
    setVisibleCount(Math.min(INITIAL_ROWS * COLS_PER_ROW, products.length || 0));
    setCurrPage?.(1);
  }, [products, setCurrPage]);

  const maxPrice = all_products.reduce(
    (m, p) => Math.max(m, +p?.salesPrice || +p?.price || 0),
    1000
  );

  // active filters?
  const pv = Array.isArray(priceValue) ? priceValue : [0, maxPrice];
  const priceActive = pv[0] > 0 || pv[1] < maxPrice;
  const facetsActive =
    selectedFilters && Object.values(selectedFilters).some((v) =>
      Array.isArray(v) ? v.length > 0 : !!v
    );
  const anyActive = !!(priceActive || facetsActive);

  // reset handler
  const resetAll = () => {
    setPriceValue?.([0, maxPrice]);
    handleFilterChange?.({});
    setCurrPage?.(1);
  };

  // ===== infinite scroll via IntersectionObserver =====
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const onIntersect = (entries) => {
      const entry = entries[0];
      if (!entry.isIntersecting) return;
      if (loadingRef.current) return;

      if (visibleCount < filteredRows.length) {
        loadingRef.current = true;
        requestAnimationFrame(() => {
          setVisibleCount((c) => Math.min(c + STEP, filteredRows.length));
          setTimeout(() => { loadingRef.current = false; }, 120);
        });
      }
    };

    const io = new IntersectionObserver(onIntersect, {
      root: null,
      rootMargin: '200px 0px',
      threshold: 0.01,
    });

    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [filteredRows.length, visibleCount]);

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
                    {/* <div className="col-xl-6">
                      <ShopTopRight selectHandleFilter={selectHandleFilter} />
                    </div> */}
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
                        {/* Grid with 4 columns on lg+, responsive below */}
                        <div className="products-grid">
                          {filteredRows.slice(0, visibleCount).map((item, idx) => {
                            const isNew = idx >= prevCountRef.current - STEP; // last revealed chunk
                            return (
                              <div
                                key={item?._id || item?.id || idx}
                                className={`product-cell ${isNew ? 'item-appear' : ''}`}
                              >
                                <div className="product-card">
                                  <ProductItem product={item} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="tab-pane fade" id="list-tab-pane">
                        <div className="tp-shop-list-wrapper tp-shop-item-primary mb-70">
                          {filteredRows.slice(0, visibleCount).map((item, idx) => {
                            const isNew = idx >= prevCountRef.current - STEP;
                            return (
                              <div
                                key={item?._id || item?.id || idx}
                                className={`list-cell ${isNew ? 'item-appear' : ''}`}
                              >
                                <div className="product-card">
                                  <ShopListItem product={item} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* sentinel for infinite scroll */}
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

        /* Grid: 4 columns on large, responsive down */
        .products-grid {
          display: grid;
          gap: 24px;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          align-items: stretch;
        }
        @media (max-width: 1199px) {
          .products-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 991px) {
          .products-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 575px) {
          .products-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        }

        .product-cell, .list-cell { will-change: transform, opacity; }
        .product-card {
          width: 100%;
          max-width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        /* appear animation for newly revealed items */
        .item-appear {
          opacity: 0;
          transform: translateY(10px);
          animation: fadeUp .35s ease-out forwards;
        }
        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }

        /* Sentinel to trigger loads (invisible) */
        .sentinel { width: 100%; height: 1px; }
      `}</style>

      {/* Global overrides to neutralize conflicting theme/Bootstrap rules
          and fix “skinny image” issue inside unknown ProductItem markup */}
      <style jsx global>{`
        /* Force any nested bootstrap-like cols inside grid items to fill the cell */
        .products-grid .product-card [class*="col-"] {
          width: 100% !important;
          max-width: 100% !important;
          flex: 1 1 auto !important;
          padding: 0 !important;
        }

        /* Make top product media square & cover */
        .products-grid .product-card img {
          display: block;
          width: 100% !important;
          height: auto;
          object-fit: cover;
        }

        /* If your ProductItem uses a dedicated thumb wrapper, normalize it */
        .products-grid .product-card .tp-product-thumb,
        .products-grid .product-card .product-thumb,
        .products-grid .product-card .thumb,
        .products-grid .product-card .image,
        .products-grid .product-card .card-img,
        .products-grid .product-card .card-image {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;     /* <-- prevents tall pill images */
          overflow: hidden;
          border-radius: 12px;
        }
        .products-grid .product-card .tp-product-thumb img,
        .products-grid .product-card .product-thumb img,
        .products-grid .product-card .thumb img,
        .products-grid .product-card .image img,
        .products-grid .product-card .card-img img,
        .products-grid .product-card .card-image img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Ensure the whole card isn’t constrained to a tiny width by any external rule */
        .products-grid .product-card,
        .products-grid .product-card > * {
          max-width: 100% !important;
        }
      `}</style>
    </section>
  );
};

export default ShopContent;
