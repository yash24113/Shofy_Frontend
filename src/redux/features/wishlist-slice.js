// redux/features/wishlist-slice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { notifyError, notifySuccess } from "@/utils/toast";

/* ------------------------- API base helpers ------------------------- */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
const WISHLIST_BASE = (() => {
  if (!API_BASE) return "https://test.amrita-fashions.com/shopy";
  if (/\/api$/i.test(API_BASE)) return API_BASE.replace(/\/api$/i, "");
  if (/\/shopy$/i.test(API_BASE)) return API_BASE;
  return `${API_BASE}/shopy`;
})();

/* ------------------------------- GET ------------------------------- */
/** GET /shopy/wishlist/:userId  -> returns array of {_id,...} or ids */
export const fetchWishlist = createAsyncThunk(
  "wishlist/fetchWishlist",
  async (userId, { rejectWithValue }) => {
    try {
      if (!userId) return [];
      const url = `${WISHLIST_BASE}/wishlist/${encodeURIComponent(userId)}`;
      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`GET wishlist ${res.status}`);
      const data = await res.json();

      // Expected shape: { success, data: { products: [ {_id,...} ] } }
      if (Array.isArray(data?.data?.products)) return data.data.products;

      // Fallback shapes:
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.items)) return data.items;
      if (Array.isArray(data?.data?.items)) return data.data.items;

      const idsA = data?.data?.productIds;
      const idsB = data?.productIds;
      if (Array.isArray(idsA)) return idsA.map((x) => ({ _id: x?._id || x?.id || x }));
      if (Array.isArray(idsB)) return idsB.map((x) => ({ _id: x?._id || x?.id || x }));

      return [];
    } catch (e) {
      return rejectWithValue(e.message || "Failed to fetch wishlist");
    }
  }
);

/* ------------------------------- PUT ------------------------------- */
/** PUT /shopy/wishlist/:userId  body: { userId, productIds } */
async function putWishlistIds(userId, productIds) {
  const url = `${WISHLIST_BASE}/wishlist/add`;
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, productIds }),
  });
  if (!res.ok) throw new Error(`PUT wishlist ${res.status}`);
  return res.json();
}

/* Toggle helper to find product id */
const getPid = (x) => x?._id || x?.id || x?.product?._id || x?.productId || x?.product || x;

/** Toggle an item in wishlist (server is source of truth; optimistic) */
export const toggleWishlistItem = createAsyncThunk(
  "wishlist/toggleWishlistItem",
  async ({ userId, product }, { getState, rejectWithValue }) => {
    try {
      if (!userId) throw new Error("Not logged in");
      const state = getState();
      const current = state.wishlist?.wishlist || [];
      const pid = String(getPid(product));
      if (!pid) throw new Error("Product ID missing");

      const exists = current.some((it) => String(getPid(it)) === pid);
      let nextList;

      if (exists) {
        nextList = current.filter((it) => String(getPid(it)) !== pid);
      } else {
        // store minimal product doc (id + some label fields) for local UI
        const title =
          product?.title ||
          product?.name ||
          product?.product?.name ||
          product?.seoTitle ||
          "Product";
        const item = { ...product, _id: pid, id: pid, title };
        nextList = [...current, item];
      }

      // Always push only IDs to server
      const productIds = nextList.map((it) => getPid(it)).filter(Boolean);
      await putWishlistIds(userId, productIds);

      // Fire UI toast
      if (exists) {
        notifyError("Removed from wishlist");
      } else {
        notifySuccess("Added to wishlist");
      }

      // Return full next list to reducer (keep local docs for rendering)
      return nextList;
    } catch (e) {
      return rejectWithValue(e.message || "Failed to update wishlist");
    }
  }
);

/* ------------------------------ DELETE ----------------------------- */
/** DELETE /shopy/wishlist/:userId/product/:productId */
export const removeWishlistItem = createAsyncThunk(
  "wishlist/removeWishlistItem",
  async ({ userId, productId, title }, { getState, rejectWithValue }) => {
    try {
      if (!userId) throw new Error("Not logged in");

      const url = `${WISHLIST_BASE}/wishlist/${encodeURIComponent(
        userId
      )}/product/${encodeURIComponent(productId)}`;
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`DELETE wishlist ${res.status}`);

      notifyError(`${title || "Item"} removed from wishlist`);

      // Build the new list locally
      const current = getState().wishlist?.wishlist || [];
      const next = current.filter((it) => String(getPid(it)) !== String(productId));
      return next;
    } catch (e) {
      return rejectWithValue(e.message || "Failed to remove from wishlist");
    }
  }
);

/* ------------------------------- Slice ----------------------------- */
const initialState = {
  wishlist: [],     // array of product docs (local for UI; server persists IDs)
  loading: false,
  error: null,
};

export const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    // In case you want a plain setter (rarely needed now)
    set_wishlist(state, { payload }) {
      state.wishlist = Array.isArray(payload) ? payload : [];
    },
    clear_wishlist(state) {
      state.wishlist = [];
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, { payload }) => {
        state.loading = false;
        // payload may be ids only; normalize to docs with _id
        state.wishlist = (Array.isArray(payload) ? payload : []).map((x) => {
          const id = getPid(x);
          return typeof x === "object" ? { ...x, _id: id, id } : { _id: id, id };
        });
      })
      .addCase(fetchWishlist.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload || "Failed fetching wishlist";
      })
      // toggle
      .addCase(toggleWishlistItem.pending, (state) => {
        state.error = null;
      })
      .addCase(toggleWishlistItem.fulfilled, (state, { payload }) => {
        state.wishlist = Array.isArray(payload) ? payload : [];
      })
      .addCase(toggleWishlistItem.rejected, (state, { payload }) => {
        state.error = payload || "Failed updating wishlist";
      })
      // remove
      .addCase(removeWishlistItem.fulfilled, (state, { payload }) => {
        state.wishlist = Array.isArray(payload) ? payload : [];
      })
      .addCase(removeWishlistItem.rejected, (state, { payload }) => {
        state.error = payload || "Failed removing wishlist item";
      });
  },
});

export const { set_wishlist, clear_wishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
