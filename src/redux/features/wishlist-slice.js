// src/redux/features/wishlist-slice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { notifyError, notifySuccess } from "@/utils/toast";

/** Helpers */
const getApiBase = () => (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
const pickId = (x) =>
  x?._id || x?.id || x?.product?._id || x?.product?.id || (typeof x?.product === "string" ? x.product : null);

/** PUT all ids to server */
async function putAll(userId, ids) {
  const API_BASE = getApiBase();
  const url = `${API_BASE}/wishlist/${encodeURIComponent(userId)}`;
  const res = await fetch(url, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, productIds: ids }),
  });
  if (!res.ok) throw new Error(`PUT wishlist failed ${res.status}`);
  return res.json().catch(() => ({}));
}

/** GET server wishlist (array of products or ids) */
export const fetchWishlist = createAsyncThunk(
  "wishlist/fetchWishlist",
  async ({ userId }, { rejectWithValue }) => {
    try {
      const API_BASE = getApiBase();
      const url = `${API_BASE}/wishlist/${encodeURIComponent(userId)}`;
      const res = await fetch(url, { method: "GET", credentials: "include", headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`GET wishlist failed ${res.status}`);
      const data = await res.json();
      // normalize to array of { _id }
      let list =
        (Array.isArray(data?.data?.products) && data?.data?.products) ||
        (Array.isArray(data?.items) && data.items) ||
        (Array.isArray(data) && data) ||
        [];
      return list;
    } catch (e) {
      return rejectWithValue(e?.message || "Failed to fetch wishlist");
    }
  }
);

/** TOGGLE one product id, sync full list with PUT */
export const toggleWishlistItem = createAsyncThunk(
  "wishlist/toggleWishlistItem",
  async ({ userId, productId }, { getState, rejectWithValue }) => {
    try {
      if (!userId) throw new Error("Missing userId");
      if (!productId) throw new Error("Missing productId");

      const state = getState();
      const curr = state?.wishlist?.wishlist || [];
      const ids = new Set(curr.map(pickId).filter(Boolean).map(String));

      let actionMsg;
      if (ids.has(String(productId))) {
        ids.delete(String(productId));
        actionMsg = "removed from wishlist";
      } else {
        ids.add(String(productId));
        actionMsg = "added to wishlist";
      }

      await putAll(userId, Array.from(ids));
      return { productId: String(productId), actionMsg };
    } catch (e) {
      return rejectWithValue(e?.message || "Toggle wishlist failed");
    }
  }
);

const initialState = {
  wishlist: [],
  loading: false,
  error: null,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    remove_wishlist_product: (state, { payload }) => {
      const pid = String(pickId(payload));
      state.wishlist = (state.wishlist || []).filter((it) => String(pickId(it)) !== pid);
      notifyError(`${payload?.title || "Item"} removed from wishlist`);
    },
    // optional: clear, hydrate, etc.
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.wishlist = Array.isArray(payload) ? payload : [];
      })
      .addCase(fetchWishlist.rejected, (state, { payload }) => {
        state.loading = false; state.error = payload || "Failed to load wishlist";
      })
      .addCase(toggleWishlistItem.fulfilled, (state, { payload }) => {
        const { productId, actionMsg } = payload || {};
        const idx = state.wishlist.findIndex((x) => String(pickId(x)) === String(productId));
        if (idx === -1) {
          // keep minimal object to mark present; your UI may replace with full product later
          state.wishlist.push({ _id: productId });
          notifySuccess(`Item ${actionMsg}`);
        } else {
          const removed = state.wishlist[idx];
          state.wishlist.splice(idx, 1);
          notifyError(`${removed?.title || "Item"} ${actionMsg}`);
        }
      })
      .addCase(toggleWishlistItem.rejected, (state, { payload }) => {
        state.error = payload || "Failed to update wishlist";
        notifyError(state.error);
      });
  },
});

export const { remove_wishlist_product } = wishlistSlice.actions;
export default wishlistSlice.reducer;
