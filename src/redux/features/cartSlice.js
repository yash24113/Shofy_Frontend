import { createSlice } from "@reduxjs/toolkit";
import { notifyError, notifySuccess } from "@/utils/toast";

/* --------------------------------
   SSR-safe localStorage helpers
--------------------------------- */
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
  } catch {
    /* ignore */
  }
};

/* ---------- helpers ---------- */
const productKey = (p) => p?._id || p?.id || null;
const computeDistinctCount = (items = []) =>
  new Set(items.map((it) => productKey(it)).filter(Boolean)).size;

/* ---------- state (NO localStorage reads here) ---------- */
const initialState = {
  cart_products: [],            // rehydrated on client via get_cart_products
  orderQuantity: 1,
  cartMiniOpen: false,
  distinctCount: 0,             // keeps count of distinct products
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    /* Rehydrate from localStorage (call on app start / layout useEffect) */
    get_cart_products: (state) => {
      const arr = safeGet("cart_products");
      const loaded = Array.isArray(arr) ? arr : [];
      state.cart_products = loaded;
      state.distinctCount = computeDistinctCount(loaded);
    },

    add_cart_product: (state, { payload }) => {
      try {
        const productId = productKey(payload);
        if (!productId) {
          console.error("Cannot add to cart: Product ID is missing", payload);
          return;
        }

        const idx = state.cart_products.findIndex(
          (it) => productKey(it) === productId
        );

        if (idx === -1) {
          const newItem = {
            ...payload,
            _id: productId, // normalize
            id: productId,
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
          if (isBrowser()) notifySuccess(`${newItem.orderQuantity} ${newItem.title} added to cart`);
        } else {
          const item = state.cart_products[idx];
          const addQty = state.orderQuantity || 1;
          const newQty = (item.orderQuantity || 1) + addQty;

          if (
            typeof item.quantity === "number" &&
            item.quantity > 0 &&
            newQty > item.quantity
          ) {
            if (isBrowser()) notifyError("No more quantity available for this product!");
          } else {
            item.orderQuantity = newQty;
            if (isBrowser()) notifySuccess(`${item.title} quantity updated to ${newQty}`);
          }
        }

        state.distinctCount = computeDistinctCount(state.cart_products);
        safeSet("cart_products", state.cart_products);
      } catch (e) {
        console.error("Error in add_cart_product:", e);
        if (isBrowser()) notifyError("Failed to add item to cart");
      }
    },

    // Controls how many units to add on next add_cart_product
    increment: (state) => {
      state.orderQuantity = (state.orderQuantity || 1) + 1;
    },

    decrement: (state) => {
      state.orderQuantity = state.orderQuantity > 1 ? state.orderQuantity - 1 : 1;
    },

    // Decrease a specific item's orderQuantity by 1 (not removing it)
    quantityDecrement: (state, { payload }) => {
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

    // Remove a product entirely (by id)
    remove_product: (state, { payload }) => {
      const pid = productKey(payload) || payload?.id;
      const before = state.cart_products.length;
      state.cart_products = state.cart_products.filter(
        (item) => productKey(item) !== pid
      );
      if (isBrowser() && state.cart_products.length !== before) {
        notifyError(`${payload?.title || "Product"} removed from cart`);
      }
      state.distinctCount = computeDistinctCount(state.cart_products);
      safeSet("cart_products", state.cart_products);
    },

    initialOrderQuantity: (state) => {
      state.orderQuantity = 1;
    },

    clearCart: (state) => {
      let proceed = true;
      if (isBrowser()) {
        proceed = window.confirm("Are you sure you want to remove all items ?");
      }
      if (proceed) {
        state.cart_products = [];
        state.distinctCount = 0;
        safeSet("cart_products", state.cart_products);
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
  initialOrderQuantity,
  clearCart,
  closeCartMini,
  openCartMini,
} = cartSlice.actions;

/* ---------- selectors ---------- */
export const selectCartDistinctCount = (state) =>
  state.cart?.distinctCount ??
  computeDistinctCount(state.cart?.cart_products || []);

export default cartSlice.reducer;
