import { apiSlice } from "../api/apiSlice";

export const cartApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get cart data for a specific user
    getCartData: builder.query({
      query: (userId) => {
        console.log('Cart API: Fetching cart data for user', { userId });
        return {
          url: `cart/user/${userId}`,
          method: "GET",
        };
      },
      providesTags: ["Cart"],
      keepUnusedDataFor: 300, // 5 minutes
      async onQueryStarted(userId, { queryFulfilled, dispatch }) {
        try {
          console.log('Cart API: Starting cart fetch for user', { userId });
          const result = await queryFulfilled;
          console.log('Cart API: Cart fetch successful', { userId, data: result.data });
        } catch (err) {
          console.error("Cart API: Failed to fetch cart data:", err);
        }
      },
    }),

    // Update cart item quantity
    updateCartItem: builder.mutation({
      query: ({ productId, quantity, userId }) => {
        console.log('Cart API: Updating cart item', { productId, quantity, userId });
        return {
          url: `cart/update/${productId}`,
          method: "PUT",
          body: { quantity, userId },
        };
      },
      invalidatesTags: ["Cart"],
      async onQueryStarted({ productId, quantity }, { queryFulfilled, dispatch }) {
        try {
          console.log('Cart API: Starting update for', { productId, quantity });
          const result = await queryFulfilled;
          console.log('Cart API: Update successful', result);
          // Optimistic update could be added here if needed
        } catch (err) {
          console.error("Cart API: Failed to update cart item:", err);
        }
      },
    }),

    // Remove single item from cart
    removeCartItem: builder.mutation({
      query: ({productId, userId}) => {
        console.log('Cart API: Removing cart item', { productId, userId });
        return {
          url: `cart/remove/${productId}`,
          method: "DELETE",
          body: {userId}
        };
      },
      invalidatesTags: ["Cart"],
      async onQueryStarted({productId}, { queryFulfilled, dispatch }) {
        try {
          console.log('Cart API: Starting removal for', { productId });
          const result = await queryFulfilled;
          console.log('Cart API: Removal successful', result);
        } catch (err) {
          console.error("Cart API: Failed to remove cart item:", err);
        }
      },
    }),

    // Clear all items from cart
    clearCart: builder.mutation({
      query: () => ({
        url: "cart/clear",
        method: "DELETE",
      }),
      invalidatesTags: ["Cart"],
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          await queryFulfilled;
        } catch (err) {
          console.error("Failed to clear cart:", err);
        }
      },
    }),

    // Add item to cart
    addToCart: builder.mutation({
      query: ({ productId, userId, quantity = 1 }) => {
        console.log('Cart API: Adding item to cart', { productId, userId, quantity });
        return {
          url: "cart/add",
          method: "POST",
          body: { productId, userId, quantity },
        };
      },
      invalidatesTags: ["Cart"],
      async onQueryStarted({ productId, userId, quantity }, { queryFulfilled, dispatch }) {
        try {
          console.log('Cart API: Starting add for', { productId, quantity });
          const result = await queryFulfilled;
          console.log('Cart API: Add successful', result);
        } catch (err) {
          console.error("Cart API: Failed to add item to cart:", err);
        }
      },
    }),
  }),
});

export const {
  useGetCartDataQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  useAddToCartMutation,
} = cartApi;
