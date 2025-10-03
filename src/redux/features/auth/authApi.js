// src/redux/features/auth/authApi.js
import { apiSlice } from "@/redux/api/apiSlice";
import { userLoggedIn } from "./authSlice";
import Cookies from "js-cookie";

/** tiny helper so we never forget to include the sid */
const getSessionId = (sid) => sid || Cookies.get("sessionId") || "";

export const authApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    /* ──────────────────────────────────────────
     * Registration
     * ────────────────────────────────────────── */
    sendRegistrationOTP: builder.mutation({
      query: (data) => ({
        url: "users/send-otp",
        method: "POST",
        credentials: "include",
        body: data,
      }),
    }),
    verifyOTPAndRegister: builder.mutation({
      query: ({ email, otp }) => ({
        url: "users/verify-otp",
        method: "POST",
        credentials: "include",
        body: { email, otp },
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (err) {
          console.error("verifyOTPAndRegister error:", err);
        }
      },
    }),

    /* ──────────────────────────────────────────
     * Login / Session (uses sessionId from your response)
     * ────────────────────────────────────────── */
    loginUser: builder.mutation({
      // Your actual endpoint base: https://test.amrita-fashions.com/shopy/
      query: ({ identifier, password }) => ({
        url: "users/login",
        method: "POST",
        credentials: "include",
        body: { identifier, password },
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          const { user, sessionId } = data || {};
          if (user && sessionId) {
            Cookies.set("userInfo", JSON.stringify({ user }), { expires: 0.5 }); // ~12h
            Cookies.set("sessionId", sessionId, { expires: 0.5 });
            dispatch(userLoggedIn({ sessionId, user }));
          }
        } catch (err) {
          console.error("loginUser error:", err);
        }
      },
    }),

    requestLoginOTP: builder.mutation({
      query: ({ email }) => ({
        url: "users/login/otp/request",
        method: "POST",
        credentials: "include",
        body: { email },
      }),
    }),

    verifyLoginOTP: builder.mutation({
      query: ({ email, otp }) => ({
        url: "users/login/otp/verify",
        method: "POST",
        credentials: "include",
        body: { email, otp },
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          const { user, sessionId } = data || {};
          if (user && sessionId) {
            Cookies.set("userInfo", JSON.stringify({ user }), { expires: 0.5 });
            Cookies.set("sessionId", sessionId, { expires: 0.5 });
            dispatch(userLoggedIn({ sessionId, user }));
          }
        } catch (err) {
          console.error("verifyLoginOTP error:", err);
        }
      },
    }),

    // Fetch session details (tries query param; if your server reads cookie, it still works)
    getSessionInfo: builder.query({
      query: ({ sessionId } = {}) => {
        const sid = getSessionId(sessionId);
        const url = sid ? `users/session?sessionId=${encodeURIComponent(sid)}` : "users/session";
        return { url, credentials: "include" };
      },
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          const user = data?.session?.user || data?.user || data;
          if (user) dispatch(userLoggedIn({ user }));
        } catch (err) {
          console.error("getSessionInfo error:", err);
        }
      },
    }),

    /* ──────────────────────────────────────────
     * LOGOUT using sessionId in BODY (+ query fallback)
     * ────────────────────────────────────────── */
    logoutUser: builder.mutation({
      // Many backends prefer POST for logout; using POST avoids DELETE-body quirks.
      query: ({ sessionId } = {}) => {
        const sid = getSessionId(sessionId);
        return {
          url: sid ? `users/logout?sessionId=${encodeURIComponent(sid)}` : "users/logout",
          method: "POST",
          credentials: "include",
          body: { sessionId: sid }, // send in body as primary signal
        };
      },
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (err) {
          // even if server says "session not found", clear local state
          console.warn("logoutUser server response:", err?.error || err);
        } finally {
          Cookies.remove("sessionId");
          Cookies.remove("userInfo");
        }
      },
    }),

    /* ──────────────────────────────────────────
     * Update Profile
     * ────────────────────────────────────────── */
    updateProfile: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `users/${id}`,
        method: "PUT",
        credentials: "include",
        body: data,
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(userLoggedIn({ user: data }));
        } catch (err) {
          console.error("updateProfile error:", err);
        }
      },
    }),

    /* ──────────────────────────────────────────
     * Extra auth endpoints
     * ────────────────────────────────────────── */
    confirmEmail: builder.query({
      query: (token) => ({
        url: `users/verify-email/${token}`,
        method: "GET",
        credentials: "include",
      }),
    }),

    resetPassword: builder.mutation({
      query: ({ verifyEmail }) => ({
        url: "users/password/forgot/request",
        method: "POST",
        credentials: "include",
        body: { email: verifyEmail },
      }),
    }),

    confirmForgotPassword: builder.mutation({
      query: ({ password, token }) => ({
        url: "users/password/forgot/confirm",
        method: "POST",
        credentials: "include",
        body: { password, token },
      }),
    }),
  }),
});

// Export hooks
export const {
  useSendRegistrationOTPMutation,
  useVerifyOTPAndRegisterMutation,
  useLoginUserMutation,
  useRequestLoginOTPMutation,
  useVerifyLoginOTPMutation,
  useGetSessionInfoQuery,
  useLogoutUserMutation,
  useUpdateProfileMutation,
  useConfirmEmailQuery,
  useResetPasswordMutation,
  useConfirmForgotPasswordMutation,
} = authApi;
