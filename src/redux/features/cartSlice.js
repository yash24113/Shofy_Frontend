// redux/features/cartSlice.js
import { createSlice } from "@reduxjs/toolkit";

/* ---------------- SSR-safe localStorage helpers ---------------- */
const isBrowser = () => typeof window !== "undefined";
const safeGet = (key) => {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};
const safeSet = (key, value) => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

/* ---------------- helpers ---------------- */
const productKey = (p) => p?._id || p?.id || null;
const computeDistinctCount = (items = []) =>
  new Set(items.map((it) => productKey(it)).filter(Boolean)).size;

/* ---------------- state ---------------- */
const initialState = {
  cart_products: [],     // still used in some pages; sidebar uses server data now
  orderQuantity: 1,
  cartMiniOpen: false,
  distinctCount: 0,      // unique products by _id/id
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    /* Rehydrate legacy local cart (if you still need it elsewhere) */
    get_cart_products(state) {
      const loaded = safeGet("cart_products") || [];
      state.cart_products = loaded;
      state.distinctCount = computeDistinctCount(loaded);
    },

    add_cart_product(state, { payload }) {
      const pid = productKey(payload);
      if (!pid) return;

      const idx = state.cart_products.findIndex((it) => productKey(it) === pid);

      if (idx === -1) {
        const newItem = {
          ...payload,
          _id: pid,
          id: pid,
          orderQuantity: state.orderQuantity || 1,
          quantity:
            typeof payload?.quantity === "number" && payload.quantity > 0
              ? payload.quantity
              : 1,
          title: payload?.title || payload?.name || "Product",
          price:
            typeof payload?.price === "string" || typeof payload?.price === "number"
              ? parseFloat(payload.price) || 0
              : 0,
          image: payload?.image || payload?.imageUrl || payload?.img || "",
        };
        state.cart_products.push(newItem);
      } else {
        const item = state.cart_products[idx];
        const addQty = state.orderQuantity || 1;
        const nextQty = (item.orderQuantity || 1) + addQty;

        if (
          typeof item.quantity === "number" &&
          item.quantity > 0 &&
          nextQty > item.quantity
        ) {
          // exceed stock → ignore
        } else {
          item.orderQuantity = nextQty;
        }
      }

      state.distinctCount = computeDistinctCount(state.cart_products);
      safeSet("cart_products", state.cart_products);
    },

    increment(state) {
      state.orderQuantity = (state.orderQuantity || 1) + 1;
    },

    decrement(state) {
      state.orderQuantity = state.orderQuantity > 1 ? state.orderQuantity - 1 : 1;
    },

    quantityDecrement(state, { payload }) {
      const pid = productKey(payload);
      state.cart_products = state.cart_products.map((item) => {
        if (productKey(item) === pid && (item.orderQuantity || 1) > 1) {
          return { ...item, orderQuantity: (item.orderQuantity || 1) - 1 };
        }
        return item;
      });
      state.distinctCount = computeDistinctCount(state.cart_products);
      safeSet("cart_products", state.cart_products);
    },

    remove_product(state, { payload }) {
      const pid = productKey(payload) || payload?.id;
      state.cart_products = state.cart_products.filter(
        (item) => productKey(item) !== pid
      );
      state.distinctCount = computeDistinctCount(state.cart_products);
      safeSet("cart_products", state.cart_products);
    },

    initialOrderQuantity(state) {
      state.orderQuantity = 1;
    },

    clearCart(state) {
      state.cart_products = [];
      state.distinctCount = 0;
      safeSet("cart_products", state.cart_products);
    },

    openCartMini(state) {
      state.cartMiniOpen = true;
    },
    closeCartMini(state) {
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
  initialOrderQuantity,
  clearCart,
  closeCartMini,
  openCartMini,
} = cartSlice.actions;

/* ---------------- selectors ---------------- */
export const selectCartDistinctCount = (state) =>
  state.cart?.distinctCount ??
  computeDistinctCount(state.cart?.cart_products || []);

export default cartSlice.reducer;
