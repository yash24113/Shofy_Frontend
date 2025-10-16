'use client';
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectUserId } from "@/utils/userSelectors";
import { useGetCartDataQuery } from "@/redux/features/cartApi";

const useCartInfo = () => {
    const userId = useSelector(selectUserId);
    
    // Try to get cart data from API first
    const { data: cartData } = useGetCartDataQuery(userId, {
        skip: !userId,
    });
    
    // Fallback to Redux cart data if API data is not available
    const { cart_products = [] } = useSelector((state) => state.cart);
    
    // Use API data if available, otherwise fallback to Redux
    // Ensure cartItems is always an array
    const cartItems = Array.isArray(cartData?.cartItems) 
        ? cartData.cartItems 
        : Array.isArray(cartData) 
            ? cartData 
            : Array.isArray(cart_products) 
                ? cart_products 
                : [];

    const { total, quantity } = useMemo(() => {
        return cartItems.reduce(
            (cartTotal, cartItem) => {
                const { salesPrice, price, orderQuantity, quantity: itemQuantity } = cartItem;
                const itemPrice = salesPrice || price || 0;
                const qty = orderQuantity || itemQuantity || 0;
                const itemTotal = itemPrice * qty;
                cartTotal.total += itemTotal;
                cartTotal.quantity += qty;
                return cartTotal;
            },
            {
                total: 0,
                quantity: 0,
            }
        );
    }, [cartItems]);

    return {
        quantity,
        total: Number(total.toFixed(2)),
    };
}

export default useCartInfo;