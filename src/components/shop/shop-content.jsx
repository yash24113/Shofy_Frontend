'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ProductItem from '../products/fashion/product-item';
import ShopListItem from './shop-list-item';
import ShopTopLeft from './shop-top-left';
import ShopTopRight from './shop-top-right';
import ShopSidebarFilters from './ShopSidebarFilters';
import ResetButton from './shop-filter/reset-button';
import EmptyState from '@/components/common/empty-state';
import AnimatedItemWrapper from './AnimatedItemWrapper'; // Adjust path if needed

const ITEMS_PER_PAGE = 40; // Define how many items to load at a time

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
  } = otherProps;

  const { setPriceValue, priceValue } = priceFilterValues || {};
  const [filteredRows, setFilteredRows] = useState(products);
  // This state now controls how many items are rendered from the filtered list
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // --- Infinite Scroll Logic ---
  const observer = useRef();
  const lastProductElementRef = useCallback(
    (node) => {
      // If a previous observer is set, disconnect it
      if (observer.current) observer.current.disconnect();

      // Create a new Intersection Observer
      observer.current = new IntersectionObserver((entries) => {
        // If the observed element is intersecting (visible) and there are more products to show...
        if (entries[0].isIntersecting && visibleCount < filteredRows.length) {
          // ...increment the visible count to show the next batch of products.
          setVisibleCount(
            (prevCount) => prevCount + ITEMS_PER_PAGE
          );
        }
      });

      // If the node (the last element) exists, start observing it
      if (node) observer.current.observe(node);
    },
    [visibleCount, filteredRows.length] // Dependencies for the callback
  );
  // --- End Infinite Scroll Logic ---


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

  // Reset visible items when filters change
  useEffect(() => {
    setFilteredRows(products);
    // Reset to the initial page size
    setVisibleCount(Math.min(ITEMS_PER_PAGE, products.length || 0));
    setCurrPage(1);
  }, [products, setCurrPage]);

  const maxPrice = all_products.reduce(
    (m, p) => Math.max(m, +p.salesPrice || +p.price || 0),
    1000
  );

  // any active filters?
  const pv = Array.isArray(priceValue) ? priceValue : [0, maxPrice];
  const priceActive = pv[0] > 0 || pv[1] < maxPrice;
  const facetsActive =
    selectedFilters &&
    Object.values(selectedFilters).some((v) =>
      Array.isArray(v) ? v.length > 0 : !!v
    );
  const anyActive = !!(priceActive || facetsActive);

  // reset handler
  const resetAll = () => {
    setPriceValue?.([0, maxPrice]);
    handleFilterChange?.({});
    setCurrPage?.(1);
  };

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
                        showing={Math.min(visibleCount, filteredRows.length)}
                        total={filteredRows.length} // Show total of filtered products
                      />
                    </div>
                    <div className="col-xl-6">
                      <ShopTopRight selectHandleFilter={selectHandleFilter} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="tp-shop-items-wrapper tp-shop-item-primary">
                {filteredRows.length === 0 ? (
                  <div className="shop-empty" style={{ ['--page-offset']: `${centerOffset}px` }}>
                    <EmptyState
                      title="No products match your filters"
                      subtitle="Try adjusting your filters or explore more categories."
                      tips={['Clear some filters','Try a different category','Widen the price range']}
                      primaryAction={{ label: 'Reset all filters', onClick: resetAll }}
                      secondaryAction={{ label: 'Browse all products', href: '/fabric' }}
                    />
                  </div>
                ) : (
                  <>
                    <div className="tab-content" id="productTabContent">
                      <div className="tab-pane fade show active" id="grid-tab-pane">
                        <div className="products-grid">
                          {filteredRows
                            .slice(0, visibleCount)
                            .map((item, index) => {
                              // If this is the last item in the current visible list, attach the ref to it
                              if (index === visibleCount - 1) {
                                return (
                                  <div ref={lastProductElementRef} key={item._id}>
                                    <AnimatedItemWrapper index={index}>
                                      <ProductItem product={item} />
                                    </AnimatedItemWrapper>
                                  </div>
                                );
                              }
                              return (
                                <AnimatedItemWrapper key={item._id} index={index}>
                                  <ProductItem product={item} />
                                </AnimatedItemWrapper>
                              );
                            })}
                        </div>
                      </div>

                      <div className="tab-pane fade" id="list-tab-pane">
                        <div className="tp-shop-list-wrapper tp-shop-item-primary mb-70">
                          {filteredRows
                            .slice(0, visibleCount)
                            .map((item, index) => {
                               if (index === visibleCount - 1) {
                                return (
                                  <div ref={lastProductElementRef} key={item._id}>
                                    <AnimatedItemWrapper index={index}>
                                      <ShopListItem product={item} />
                                    </AnimatedItemWrapper>
                                  </div>
                                );
                              }
                              return (
                                <AnimatedItemWrapper key={item._id} index={index}>
                                  <ShopListItem product={item} />
                                </AnimatedItemWrapper>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Optional: You can add a subtle loader here that shows while fetching */}
                    {visibleCount < filteredRows.length && (
                        <div className="load-more-wrapper mt-30">
                           <div className="loader"></div> {/* Simple CSS loader */}
                        </div>
                    )}
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
        .load-more-wrapper { 
            display: flex; 
            justify-content: center;
            height: 60px;
            align-items: center;
        }
        /* Simple CSS spinner for loading state */
        .loader {
          border: 4px solid #f3f3f3;
          border-radius: 50%;
          border-top: 4px solid #3498db;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
};

export default ShopContent;