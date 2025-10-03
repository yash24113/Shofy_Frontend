// src/redux/features/auth/authApi.js
import { apiSlice } from "@/redux/api/apiSlice";
import { userLoggedIn } from "./authSlice";
import Cookies from "js-cookie";

/** helpers */
const getSessionId = (sid) => {
  if (sid) return sid;
  if (typeof window !== "undefined") {
    return localStorage.getItem("sessionId") || "";
  }
  return "";
};

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
     * Login / Session (store sessionId in localStorage)
     * ────────────────────────────────────────── */
    loginUser: builder.mutation({
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
          if (user) {
            Cookies.set("userInfo", JSON.stringify({ user }), { expires: 0.5 }); // ~12h
          }
          if (sessionId && typeof window !== "undefined") {
            localStorage.setItem("sessionId", sessionId); // save for logout
          }
          if (user || sessionId) {
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
          if (user) {
            Cookies.set("userInfo", JSON.stringify({ user }), { expires: 0.5 });
          }
          if (sessionId && typeof window !== "undefined") {
            localStorage.setItem("sessionId", sessionId);
          }
          if (user || sessionId) {
            dispatch(userLoggedIn({ sessionId, user }));
          }
        } catch (err) {
          console.error("verifyLoginOTP error:", err);
        }
      },
    }),

    // Fetch session details (using sessionId from localStorage)
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
     * LOGOUT using sessionId from localStorage
     * Calls: DELETE /users/logout/{sessionId}
     * ────────────────────────────────────────── */
    logoutUser: builder.mutation({
      query: ({ sessionId } = {}) => {
        const sid = getSessionId(sessionId);
        // Guard: if somehow missing, still hit /users/logout to let server clear cookie (optional)
        const url = sid ? `users/logout/${encodeURIComponent(sid)}` : "users/logout";
        return {
          url,
          method: "DELETE", // change to 'POST' if your backend requires POST
          credentials: "include",
        };
      },
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (err) {
          // Even if server replies "session not found", clear local state to avoid ghost sessions
          console.warn("logoutUser server response:", err?.error || err);
        } finally {
          if (typeof window !== "undefined") {
            localStorage.removeItem("sessionId");
          }
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
