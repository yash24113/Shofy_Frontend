// app/cart/page.tsx (or wherever your CartPage lives in the App Router)
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import Wrapper from "@/layout/wrapper";
import HeaderTwo from "@/layout/headers/header-2";
import Footer from "@/layout/footers/footer";
import CommonBreadcrumb from "@/components/breadcrumb/common-breadcrumb";
import CartArea from "@/components/cart-wishlist/cart-area";

export const metadata = {
  title: "Shofy - Cart Page",
};

export default function CartPage() {
  // ----- Server-side guard -----
  const cookieStore = cookies();

  // Primary auth: session cookie (middleware also relies on this)
  const sessionId = cookieStore.get('sessionId')?.value || '';

  // Optional fallback: try to read userId from userInfo cookie if you set it
  let userId = '';
  const userInfoRaw = cookieStore.get('userInfo')?.value;
  if (userInfoRaw) {
    try {
      const parsed = JSON.parse(userInfoRaw);
      userId = String(parsed?.user?._id || '');
    } catch {
      // ignore JSON parse errors
    }
  }

  // If neither sessionId nor userId is present, bounce to login
  if (!sessionId && !userId) {
    redirect(`/login?redirect=${encodeURIComponent('/cart')}`);
  }
  // -----------------------------

  return (
    <Wrapper>
      <HeaderTwo style_2={true} />
      <h1 style={{position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden'}}>
        Shopping Cart - Review Your Items
      </h1>
      <CommonBreadcrumb title="Shopping Cart" subtitle="Shopping Cart" />
      <CartArea />
      <Footer primary_style={true} />
    </Wrapper>
  );
}
