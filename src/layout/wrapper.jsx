'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

if (typeof window !== 'undefined') {
  require('bootstrap/dist/js/bootstrap');
}

import BackToTopCom from '@/components/common/back-to-top';
import ProductModal from '@/components/common/product-modal';
import { get_cart_products, initialOrderQuantity } from '@/redux/features/cartSlice';
import { fetchWishlist } from '@/redux/features/wishlist-slice'; // ⟵ NEW
import { get_compare_products } from '@/redux/features/compareSlice';
import useAuthCheck from '@/hooks/use-auth-check';
import Loader from '@/components/loader/loader';

/* userId selector used across the app */
const selectUserIdFromStore = (state) =>
  state?.auth?.user?._id ||
  state?.auth?.user?.id ||
  state?.auth?.userInfo?._id ||
  state?.auth?.userInfo?.id ||
  state?.user?.user?._id ||
  null;

const Wrapper = ({ children }) => {
  const { productItem } = useSelector((state) => state.productModal);
  const userId = useSelector(selectUserIdFromStore);
  const dispatch = useDispatch();
  const authChecked = useAuthCheck();

  useEffect(() => {
    // cart & compare can still hydrate from their own sources
    dispatch(get_cart_products());
    dispatch(get_compare_products());
    dispatch(initialOrderQuantity());

    // wishlist is server-backed now — only fetch if logged in
    if (userId) {
      dispatch(fetchWishlist(userId));
    }
  }, [dispatch, userId]);

  if (!authChecked) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height: '100vh' }}>
        <Loader spinner="fade" loading />
      </div>
    );
  }

  return (
    <div id="wrapper">
      {children}
      <BackToTopCom />
      <ToastContainer position="top-right" autoClose={3000} />
      {productItem && <ProductModal />}
    </div>
  );
};

export default Wrapper;
