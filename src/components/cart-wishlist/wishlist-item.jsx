'use client';
import React, { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
// internal
import { Close } from "@/svg";
import { add_cart_product } from "@/redux/features/cartSlice";
import { remove_wishlist_product } from "@/redux/features/wishlist-slice";
import LoginArea from "@/components/login-register/login-area";
import RegisterArea from "@/components/login-register/register-area";

const WishlistItem = ({ product }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { _id, img, title, salesPrice } = product || {};
  const { cart_products } = useSelector((state) => state.cart);
  const isAddToCart = cart_products?.find?.((item) => item?._id === _id);
  const dispatch = useDispatch();
  const [moving, setMoving] = useState(false);

  // auth modal state: 'login' | 'register' | null
  const [authModal, setAuthModal] = useState(null);

  // Build the "redirect back here" URL for your LoginForm (it reads ?redirect=...)
  const currentUrlWithQuery = useMemo(() => {
    const url =
      typeof window !== "undefined"
        ? new URL(window.location.href)
        : new URL("http://localhost");
    return url.pathname + url.search;
  }, [pathname, searchParams]);

  // When opening/closing a modal, reflect state in the URL so LoginForm sees ?redirect=...
  const pushAuthQuery = useCallback(
    (type) => {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      if (type) {
        url.searchParams.set("auth", type);
        url.searchParams.set("redirect", currentUrlWithQuery);
      } else {
        url.searchParams.delete("auth");
        url.searchParams.delete("redirect");
      }
      const qs = url.searchParams.toString();
      router.push(qs ? `${url.pathname}?${qs}` : url.pathname, { scroll: false });
    },
    [currentUrlWithQuery, router]
  );

  // Close modal helper
  const closeAuth = useCallback(() => {
    setAuthModal(null);
    pushAuthQuery(null);
  }, [pushAuthQuery]);

  // Open login modal and set URL
  const openLogin = useCallback(() => {
    setAuthModal("login");
    pushAuthQuery("login");
  }, [pushAuthQuery]);

  // Open register modal and set URL
  const openRegister = useCallback(() => {
    setAuthModal("register");
    pushAuthQuery("register");
  }, [pushAuthQuery]);

  const imageUrl =
    img?.startsWith?.("http")
      ? img
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${img}`;

  const slug = product?.slug || _id;

  const handleAddProduct = async (prd) => {
    // ✅ Check sessionId in Local Storage
    const hasSession =
      typeof window !== "undefined" && !!localStorage.getItem("sessionId");

    if (!hasSession) {
      // No session → open LOGIN MODAL (not page), and embed redirect to this URL
      openLogin();
      return;
    }

    // Session exists → proceed to move to cart
    try {
      setMoving(true);
      dispatch(add_cart_product(prd));
      dispatch(remove_wishlist_product({ title, id: _id }));
    } finally {
      setTimeout(() => setMoving(false), 250);
    }
  };

  const handleRemovePrd = (prd) => {
    dispatch(remove_wishlist_product(prd));
  };

  // If the URL already has ?auth=login|register (deep-link), open accordingly
  useEffect(() => {
    const auth = searchParams.get("auth");
    if (auth === "login" || auth === "register") {
      setAuthModal(auth);
    }
  }, [searchParams]);

  return (
    <>
      <tr className="wishlist-row">
        {/* img */}
        <td className="tp-cart-img wishlist-cell">
          <Link href={`/fabric/${slug}`} className="wishlist-img-link">
            {img && (
              <Image
                src={imageUrl}
                alt={title || "product img"}
                width={70}
                height={100}
                className="wishlist-img"
                priority={false}
              />
            )}
          </Link>
        </td>

        {/* title */}
        <td className="tp-cart-title wishlist-cell">
          <Link href={`/fabric/${slug}`} className="wishlist-title">
            {title}
          </Link>
        </td>

        {/* price */}
        <td className="tp-cart-price wishlist-cell">
          <span className="wishlist-price">
            ${(salesPrice || 0).toFixed(2)}
          </span>
        </td>

        {/* add to cart */}
        <td className="tp-cart-add-to-cart wishlist-cell wishlist-cell-center">
          <button
            onClick={() => handleAddProduct(product)}
            type="button"
            className={`btn-ghost-invert square ${moving ? "is-loading" : ""}`}
            aria-busy={moving ? "true" : "false"}
            title="Move to Cart"
            disabled={!!isAddToCart && !moving}
          >
            {moving ? "Moving…" : "Move to Cart"}
          </button>
        </td>

        {/* remove */}
        <td className="tp-cart-action wishlist-cell">
          <button
            onClick={() => handleRemovePrd({ title, id: _id })}
            className="btn-ghost-invert square"
            type="button"
            title="Remove from wishlist"
          >
            <Close />
            <span> Remove</span>
          </button>
        </td>
      </tr>

      {/* ---------- AUTH MODALS (rendered inline) ---------- */}
      {authModal === "login" && (
        <LoginArea onClose={closeAuth} onSwitchToRegister={openRegister} />
      )}
      {authModal === "register" && (
        <RegisterArea onClose={closeAuth} onSwitchToLogin={openLogin} />
      )}

      {/* -------- INTERNAL CSS (scoped) -------- */}
      <style jsx>{`
        /* Row */
        .wishlist-row {
          border-bottom: 1px solid #eef0f3;
          transition: background-color 160ms ease, box-shadow 180ms ease;
        }
        .wishlist-row:hover {
          background: #fafbfc;
        }

        /* Cells */
        .wishlist-cell {
          padding: 14px 12px;
          vertical-align: middle;
        }
        .wishlist-cell-center {
          text-align: center;
        }

        /* Image */
        .wishlist-img-link {
          display: inline-block;
          line-height: 0;
        }
        .wishlist-img {
          width: 70px;
          height: 100px;
          object-fit: cover;
          border-radius: 10px;
          background: #f3f5f8;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
        }

        /* Text */
        .wishlist-title {
          display: inline-block;
          font-weight: 600;
          line-height: 1.3;
          color: #0f172a;
          text-decoration: none;
        }
        .wishlist-title:hover {
          text-decoration: underline;
        }
        .wishlist-price {
          font-weight: 600;
          color: #0f172a;
        }

        /* Shared square ghost-invert button */
        .btn-ghost-invert {
          --navy: #0b1620;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          padding: 10px 18px;
          border-radius: 0; /* square */
          font-weight: 600;
          font-size: 15px;
          line-height: 1;
          cursor: pointer;
          user-select: none;
          text-decoration: none;
          background: var(--navy);
          color: #fff;
          border: 1px solid var(--navy);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22);
          transition: background 180ms ease, color 180ms ease,
            border-color 180ms ease, box-shadow 180ms ease,
            transform 120ms ease;
        }
        .btn-ghost-invert:hover {
          background: #fff;
          color: var(--navy);
          border-color: var(--navy);
          box-shadow: 0 0 0 1px var(--navy) inset, 0 8px 20px rgba(0, 0, 0, 0.12);
          transform: translateY(-1px);
        }
        .btn-ghost-invert:active {
          transform: translateY(0);
          background: #f8fafc;
          color: var(--navy);
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
        }
        .btn-ghost-invert:focus-visible {
          outline: 0;
          box-shadow: 0 0 0 3px rgba(11, 22, 32, 0.35);
        }
        .btn-ghost-invert.is-loading {
          pointer-events: none;
          opacity: 0.9;
        }

        @media (max-width: 640px) {
          .wishlist-cell {
            padding: 10px 8px;
          }
          .wishlist-img {
            width: 56px;
            height: 80px;
            border-radius: 8px;
          }
          .btn-ghost-invert {
            min-height: 42px;
            padding: 9px 16px;
          }
        }
      `}</style>
    </>
  );
};

export default WishlistItem;
