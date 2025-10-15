'use client'

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

if (typeof window !== "undefined") {
  require("bootstrap/dist/js/bootstrap");
}

import BackToTopCom from "@/components/common/back-to-top";
import ProductModal from "@/components/common/product-modal";
import { get_cart_products, initialOrderQuantity } from "@/redux/features/cartSlice";
// ❌ remove old localstorage action
// import { get_wishlist_products } from "@/redux/features/wishlist-slice";
// ✅ use server-backed thunk instead
import { fetchWishlist } from "@/redux/features/wishlist-slice";
import { get_compare_products } from "@/redux/features/compareSlice";
import useAuthCheck from "@/hooks/use-auth-check";
import Loader from "@/components/loader/loader";

/** helpers to resolve userId */
const selectUserIdFromStore = (s) =>
  s?.auth?.user?._id ||
  s?.auth?.user?.id ||
  s?.auth?.userInfo?._id ||
  s?.auth?.userInfo?.id ||
  s?.user?.user?._id ||
  null;

const getUserIdFromLocal = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("userId") || localStorage.getItem("userid") || null;
};

const Wrapper = ({ children }) => {
  const { productItem } = useSelector((state) => state.productModal);
  const dispatch = useDispatch();
  const authChecked = useAuthCheck();

  // base bootstrapping
  useEffect(() => {
    dispatch(get_cart_products());
    dispatch(get_compare_products());
    dispatch(initialOrderQuantity());
  }, [dispatch]);

  // fetch wishlist from server when auth is checked and a userId is available
  const reduxUserId = useSelector(selectUserIdFromStore);
  const effectiveUserId = reduxUserId || getUserIdFromLocal();

  useEffect(() => {
    if (!authChecked) return;
    if (!effectiveUserId) return; // not logged in, skip fetching wishlist
    dispatch(fetchWishlist({ userId: effectiveUserId }));
  }, [authChecked, effectiveUserId, dispatch]);

  if (!authChecked) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height: "100vh" }}>
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
