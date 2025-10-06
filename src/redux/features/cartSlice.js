import { createSlice } from "@reduxjs/toolkit";
import { getLocalStorage, setLocalStorage } from "@/utils/localstorage";
import { notifyError, notifySuccess } from "@/utils/toast";

const safeToast = {
  success: (m) => { try { notifySuccess?.(m); } catch {} },
  error:   (m) => { try { notifyError?.(m); } catch {} },
};

const lsGetArray = (key) => {
  const v = getLocalStorage(key);
  return Array.isArray(v) ? v : [];
};

const initialState = {
  cart_products: lsGetArray("cart_products"),
  orderQuantity: 1,         // global add-qty control (kept for compatibility)
  cartMiniOpen: false,
};

const upsertLocalStorage = (state) => {
  try { setLocalStorage("cart_products", state.cart_products); } catch {}
};

const getProductId = (o = {}) => o.productId || o._id || o.id;

// normalize minimal product object for cart
const toCartItem = (src = {}, defaultsQty = 1) => {
  const productId = getProductId(src);
  return {
    ...src,
    productId,
    title: src.title || src.name || "Product",
    price: Number(src.price ?? 0),
    image: src.image || src.imageUrl || src.img || "",
    orderQuantity: Number(src.orderQuantity ?? defaultsQty),
  };
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Add one (or global orderQuantity) of the product
    add_cart_product: (state, { payload }) => {
      try {
        const productId = getProductId(payload);
        if (!productId) {
          console.error("add_cart_product: missing productId", payload);
          return;
        }
        const idx = state.cart_products.findIndex((p) => p.productId === productId);

        if (idx === -1) {
          const qty = Number(state.orderQuantity || 1);
          const newItem = toCartItem(payload, qty);
          state.cart_products.push(newItem);
          safeToast.success(`${newItem.title} added to cart`);
        } else {
          const item = state.cart_products[idx];
          const inc = Number(state.orderQuantity || 1);
          const nextQty = Number(item.orderQuantity || 1) + inc;

          // optional stock cap if payload.quantity exists
          const stock = Number(payload?.quantity ?? item?.quantity ?? Infinity);
          if (nextQty > stock) {
            safeToast.error("No more quantity available for this product!");
          } else {
            item.orderQuantity = nextQty;
            safeToast.success(`${item.title} quantity updated to ${nextQty}`);
          }
        }
        upsertLocalStorage(state);
      } catch (err) {
        console.error("add_cart_product error:", err);
        safeToast.error("Failed to add item to cart");
      }
    },

    // OLD global controls kept for compatibility (used by PDP add-qty widgets)
    increment: (state) => {
      state.orderQuantity = Number(state.orderQuantity || 1) + 1;
    },
    decrement: (state) => {
      const cur = Number(state.orderQuantity || 1);
      state.orderQuantity = cur > 1 ? cur - 1 : 1;
    },

    // Decrement quantity of a specific cart item
    quantityDecrement: (state, { payload }) => {
      const productId = getProductId(payload);
      if (!productId) return;

      state.cart_products = state.cart_products.map((item) => {
        if (item.productId === productId) {
          const cur = Number(item.orderQuantity || 1);
          if (cur > 1) item.orderQuantity = cur - 1;
        }
        return item;
      });
      upsertLocalStorage(state);
    },

    remove_product: (state, { payload }) => {
      const productId = getProductId(payload);
      const title = payload?.title || "Item";
      state.cart_products = state.cart_products.filter((i) => i.productId !== productId);
      upsertLocalStorage(state);
      safeToast.error(`${title} removed from cart`);
    },

    get_cart_products: (state) => {
      state.cart_products = lsGetArray("cart_products");
    },

    initialOrderQuantity: (state) => {
      state.orderQuantity = 1;
    },

    clearCart: (state) => {
      let ok = true;
      try {
        if (typeof window !== "undefined") {
          ok = window.confirm("Are you sure you want to remove all items ?");
        }
      } catch {}
      if (ok) {
        state.cart_products = [];
        upsertLocalStorage(state);
      }
    },

    openCartMini: (state) => { state.cartMiniOpen = true; },
    closeCartMini: (state) => { state.cartMiniOpen = false; },
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

export default cartSlice.reducer;
