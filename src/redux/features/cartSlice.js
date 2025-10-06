// redux/features/cartSlice.js
import { createSlice } from "@reduxjs/toolkit";

/* ------------ SSR-safe localStorage helpers (call ONLY in browser) ------------ */
const isBrowser = () => typeof window !== "undefined";
const safeGet = (key) => {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const safeSet = (key, value) => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
};

/* ---------------- helpers ---------------- */
const productKey = (p) => p?._id || p?.id || null;
const computeDistinctCount = (items = []) =>
  new Set(items.map((it) => productKey(it)).filter(Boolean)).size;

/* ---------------- state (no browser APIs here) ---------------- */
const initialState = {
  cart_products: [],     // rehydrated on client
  orderQuantity: 1,
  cartMiniOpen: false,
  distinctCount: 0,
  /** UI event for toasts (read & clear by bindCartSideEffects) */
  lastEvent: null,       // { level: 'success'|'error', message: string } | null
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    /* Rehydrate from localStorage (dispatch once on client) */
    get_cart_products(state) {
      const arr = safeGet("cart_products");
      const loaded = Array.isArray(arr) ? arr : [];
      state.cart_products = loaded;
      state.distinctCount = computeDistinctCount(loaded);
      state.lastEvent = null;
    },

    add_cart_product(state, { payload }) {
      const pid = productKey(payload);
      if (!pid) {
        state.lastEvent = { level: "error", message: "Missing product id" };
        return;
      }

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
        state.lastEvent = {
          level: "success",
          message: `${newItem.orderQuantity} ${newItem.title} added to cart`,
        };
      } else {
        const item = state.cart_products[idx];
        const addQty = state.orderQuantity || 1;
        const newQty = (item.orderQuantity || 1) + addQty;

        if (
          typeof item.quantity === "number" &&
          item.quantity > 0 &&
          newQty > item.quantity
        ) {
          state.lastEvent = {
            level: "error",
            message: "No more quantity available for this product!",
          };
        } else {
          item.orderQuantity = newQty;
          state.lastEvent = {
            level: "success",
            message: `${item.title} quantity updated to ${newQty}`,
          };
        }
      }

      state.distinctCount = computeDistinctCount(state.cart_products);
      safeSet("cart_products", state.cart_products);
    },

    increment(state) {
      state.orderQuantity = (state.orderQuantity || 1) + 1;
      state.lastEvent = null;
    },

    decrement(state) {
      state.orderQuantity = state.orderQuantity > 1 ? state.orderQuantity - 1 : 1;
      state.lastEvent = null;
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
      state.lastEvent = null;
    },

    remove_product(state, { payload }) {
      const pid = productKey(payload) || payload?.id;
      const before = state.cart_products.length;
      state.cart_products = state.cart_products.filter(
        (item) => productKey(item) !== pid
      );
      state.distinctCount = computeDistinctCount(state.cart_products);
      safeSet("cart_products", state.cart_products);

      if (state.cart_products.length !== before) {
        state.lastEvent = {
          level: "error",
          message: `${payload?.title || "Product"} removed from cart`,
        };
      } else {
        state.lastEvent = null;
      }
    },

    initialOrderQuantity(state) {
      state.orderQuantity = 1;
      state.lastEvent = null;
    },

    clearCart(state) {
      state.cart_products = [];
      state.distinctCount = 0;
      safeSet("cart_products", state.cart_products);
      state.lastEvent = { level: "success", message: "Cart cleared" };
    },

    openCartMini(state) {
      state.cartMiniOpen = true;
    },
    closeCartMini(state) {
      state.cartMiniOpen = false;
    },

    /* let the UI clear an already-handled event */
    clearCartEvent(state) {
      state.lastEvent = null;
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
  clearCartEvent,
} = cartSlice.actions;

/* ---------------- selectors ---------------- */
export const selectCartDistinctCount = (state) =>
  state.cart?.distinctCount ??
  computeDistinctCount(state.cart?.cart_products || []);

export const selectCartEvent = (state) => state.cart?.lastEvent || null;

export default cartSlice.reducer;

/* =========================================================================
   Optional: bindCartSideEffects(store)
   - Call this ONCE from a CLIENT component (e.g., AppProvider) to show toasts.
   - It dynamically imports your toast util only in the browser.
   - Keeps this file SSR-safe and still gives you notifications.
   ======================================================================== */
export function bindCartSideEffects(store) {
  if (!isBrowser()) return () => {};
  let prevEvent = null;
  const unsubscribe = store.subscribe(() => {
    const state = store.getState();
    const evt = selectCartEvent(state);
    if (!evt || evt === prevEvent) return;
    prevEvent = evt;

    // fire-and-forget dynamic import to avoid SSR crashes
    import("@/utils/toast")
      .then((m) => {
        if (evt.level === "success") m?.notifySuccess?.(evt.message);
        else m?.notifyError?.(evt.message);
        store.dispatch(clearCartEvent());
      })
      .catch(() => {
        // swallow if toast module not available
        store.dispatch(clearCartEvent());
      });
  });
  return unsubscribe;
}
