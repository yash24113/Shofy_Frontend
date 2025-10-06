import { createSlice } from "@reduxjs/toolkit";
import { getLocalStorage, setLocalStorage } from "@/utils/localstorage";
import { notifyError, notifySuccess } from "@/utils/toast";

/* ---------- helpers ---------- */
const productKey = (p) => p?._id || p?.id || null;
const computeDistinctCount = (items = []) =>
  new Set(items.map((it) => productKey(it)).filter(Boolean)).size;

const loadCart = () => {
  const arr = getLocalStorage("cart_products");
  return Array.isArray(arr) ? arr : [];
};

/* ---------- state ---------- */
const initialProducts = loadCart();
const initialState = {
  cart_products: initialProducts,
  orderQuantity: 1,
  cartMiniOpen: false,
  /** Number of distinct products in cart (quantity ignored) */
  distinctCount: computeDistinctCount(initialProducts),
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    add_cart_product: (state, { payload }) => {
      try {
        const productId = productKey(payload);
        if (!productId) {
          console.error("Cannot add to cart: Product ID is missing", payload);
          return;
        }

        const existingIndex = state.cart_products.findIndex(
          (item) => productKey(item) === productId
        );

        if (existingIndex === -1) {
          // Add new item to cart
          const newItem = {
            ...payload,
            _id: productId, // normalize
            id: productId,
            orderQuantity: state.orderQuantity || 1,
            quantity:
              typeof payload.quantity === "number" && payload.quantity > 0
                ? payload.quantity
                : 1,
            title: payload.title || payload.name || "Product",
            price:
              typeof payload.price === "string" || typeof payload.price === "number"
                ? parseFloat(payload.price) || 0
                : 0,
            image: payload.image || payload.imageUrl || payload.img || "",
          };

          state.cart_products.push(newItem);
          notifySuccess(`${newItem.orderQuantity} ${newItem.title} added to cart`);
        } else {
          // Update existing item quantity (respect stock "quantity")
          const item = state.cart_products[existingIndex];
          const addQty = state.orderQuantity || 1;
          const newQty = (item.orderQuantity || 1) + addQty;

          // If "quantity" represents available stock, enforce it
          if (
            typeof item.quantity === "number" &&
            item.quantity > 0 &&
            newQty > item.quantity
          ) {
            notifyError("No more quantity available for this product!");
          } else {
            item.orderQuantity = newQty;
            notifySuccess(`${item.title} quantity updated to ${newQty}`);
          }
        }

        // Persist + recompute distinct count
        state.distinctCount = computeDistinctCount(state.cart_products);
        setLocalStorage("cart_products", state.cart_products);
        // console.log("Cart updated:", state.cart_products);
      } catch (error) {
        console.error("Error in add_cart_product:", error);
        notifyError("Failed to add item to cart");
      }
    },

    // Controls how many units to add on next add_cart_product
    increment: (state) => {
      state.orderQuantity = (state.orderQuantity || 1) + 1;
    },

    decrement: (state) => {
      state.orderQuantity =
        state.orderQuantity > 1 ? state.orderQuantity - 1 : 1;
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
      setLocalStorage("cart_products", state.cart_products);
    },

    // Remove a product entirely (by id)
    remove_product: (state, { payload }) => {
      const pid = productKey(payload) || payload?.id;
      const before = state.cart_products.length;
      state.cart_products = state.cart_products.filter(
        (item) => productKey(item) !== pid
      );
      if (state.cart_products.length !== before) {
        notifyError(`${payload?.title || "Product"} removed from cart`);
      }
      state.distinctCount = computeDistinctCount(state.cart_products);
      setLocalStorage("cart_products", state.cart_products);
    },

    // Load from localStorage
    get_cart_products: (state) => {
      const stored = loadCart();
      state.cart_products = stored;
      state.distinctCount = computeDistinctCount(stored);
    },

    initialOrderQuantity: (state) => {
      state.orderQuantity = 1;
    },

    clearCart: (state) => {
      const isClearCart = typeof window !== "undefined"
        ? window.confirm("Are you sure you want to remove all items ?")
        : true; // SSR-safe fallback
      if (isClearCart) {
        state.cart_products = [];
      }
      state.distinctCount = 0;
      setLocalStorage("cart_products", state.cart_products);
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
// Use this in your badge: const count = useSelector(selectCartDistinctCount);
export const selectCartDistinctCount = (state) =>
  state.cart?.distinctCount ?? computeDistinctCount(state.cart?.cart_products || []);

export default cartSlice.reducer;
