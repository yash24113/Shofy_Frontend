import { createSlice } from "@reduxjs/toolkit";
import { getLocalStorage, setLocalStorage } from "@/utils/localstorage";
import { notifyError, notifySuccess } from "@/utils/toast";

const initialState = {
  cart_products: [],
  orderQuantity: 1,
  cartMiniOpen: false,
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    add_cart_product: (state, { payload }) => {
      try {
        // Ensure valid product ID
        const productId = payload._id || payload.id;
        if (!productId) {
          console.error("Cannot add to cart: Product ID is missing", payload);
          return;
        }

        // Check if the product already exists in cart
        const existingIndex = state.cart_products.findIndex(
          (item) => item.productId === productId
        );

        if (existingIndex === -1) {
          // Add new product
          const newItem = {
            ...payload,
            productId, // Store as primary key
            orderQuantity: 1,
            title: payload.title || payload.name || "Product",
            price: parseFloat(payload.price) || 0,
            image: payload.image || payload.imageUrl || "",
          };
          state.cart_products.push(newItem);
          notifySuccess(`${newItem.title} added to cart`);
        } else {
          // Increment existing quantity
          const existing = state.cart_products[existingIndex];
          const newQty = existing.orderQuantity + 1;
          existing.orderQuantity = newQty;
          notifySuccess(`${existing.title} quantity updated to ${newQty}`);
        }

        // Update local storage
        setLocalStorage("cart_products", state.cart_products);
        console.log("Cart updated:", state.cart_products);
      } catch (error) {
        console.error("Error in add_cart_product:", error);
        notifyError("Failed to add item to cart");
      }
    },

    increment: (state, { payload }) => {
      const productId = payload?.productId || payload?._id;
      const item = state.cart_products.find(
        (p) => p.productId === productId
      );
      if (item) {
        item.orderQuantity += 1;
        setLocalStorage("cart_products", state.cart_products);
      }
    },

    decrement: (state, { payload }) => {
      const productId = payload?.productId || payload?._id;
      const item = state.cart_products.find(
        (p) => p.productId === productId
      );
      if (item && item.orderQuantity > 1) {
        item.orderQuantity -= 1;
        setLocalStorage("cart_products", state.cart_products);
      }
    },

    quantityDecrement: (state, { payload }) => {
      const productId = payload?.productId || payload?._id;
      state.cart_products = state.cart_products.map((item) => {
        if (item.productId === productId && item.orderQuantity > 1) {
          item.orderQuantity -= 1;
        }
        return item;
      });
      setLocalStorage("cart_products", state.cart_products);
    },

    remove_product: (state, { payload }) => {
      const productId = payload.productId || payload._id || payload.id;
      state.cart_products = state.cart_products.filter(
        (item) => item.productId !== productId
      );
      setLocalStorage("cart_products", state.cart_products);
      notifyError(`${payload.title || "Item"} removed from cart`);
    },

    get_cart_products: (state) => {
      state.cart_products = getLocalStorage("cart_products") || [];
    },

    clearCart: (state) => {
      const isClear = window.confirm("Are you sure you want to remove all items?");
      if (isClear) {
        state.cart_products = [];
        setLocalStorage("cart_products", []);
      }
    },

    openCartMini: (state) => {
      state.cartMiniOpen = true;
    },

    closeCartMini: (state) => {
      state.cartMiniOpen = false;
    },
  },
});

export const {
  add_cart_product,
  increment,
  decrement,
  get_cart_products,
  remove_product,
  quantityDecrement,
  clearCart,
  closeCartMini,
  openCartMini,
} = cartSlice.actions;

export default cartSlice.reducer;
