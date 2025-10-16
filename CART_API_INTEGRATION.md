# Cart API Integration

This document outlines the changes made to integrate cart functionality with the backend API instead of using Redux for cart state management.

## API Endpoints Used

- `GET /cart/user/:userId` - Fetch cart data for a specific user
- `PUT /cart/update/:productId` - Update cart item quantity
- `DELETE /cart/remove/:productId` - Remove single item from cart
- `DELETE /cart/clear` - Clear all items from cart

## Files Modified

### 1. `src/redux/features/cartApi.js` (NEW)
- Created new API service using RTK Query
- Includes all cart operations: get, update, remove, clear
- Provides React hooks for easy integration

### 2. `src/redux/api/apiSlice.js`
- Added "Cart" to tagTypes for cache invalidation

### 3. `src/components/cart-wishlist/cart-item.jsx`
- Replaced Redux dispatch calls with API mutations
- Added loading states for quantity buttons and remove button
- Updated increment/decrement to use PUT API
- Updated remove functionality to use DELETE API
- Added proper error handling

### 4. `src/components/cart-wishlist/cart-area.jsx`
- Replaced Redux cart data with API data fetching
- Added loading and error states
- Updated clear cart functionality to use DELETE API
- Added proper error handling and retry functionality

### 5. `src/components/common/cart-mini-sidebar.jsx`
- Updated to use API data instead of Redux
- Updated remove functionality to use DELETE API
- Added loading states for remove buttons

### 6. `src/hooks/use-cart-info.js`
- Updated to work with both API data and Redux fallback
- Handles different data structures from API vs Redux
- Maintains backward compatibility

## Key Features

### Loading States
- All buttons show loading states during API calls
- Disabled state prevents multiple simultaneous requests
- Visual feedback with opacity changes

### Error Handling
- Console error logging for failed operations
- Graceful degradation when API calls fail
- Retry functionality in cart area

### Data Structure Compatibility
- Handles both API response formats and Redux data structures
- Flexible field mapping (salesPrice vs price, orderQuantity vs quantity)
- Fallback to Redux data when API data is unavailable

### Cache Management
- RTK Query handles caching automatically
- Cache invalidation on mutations ensures fresh data
- Optimistic updates where appropriate

## Usage

### Fetching Cart Data
```javascript
const { data: cartData, isLoading, error } = useGetCartDataQuery(userId);
```

### Updating Cart Item
```javascript
const [updateCartItem] = useUpdateCartItemMutation();
await updateCartItem({ productId, quantity }).unwrap();
```

### Removing Cart Item
```javascript
const [removeCartItem] = useRemoveCartItemMutation();
await removeCartItem(productId).unwrap();
```

### Clearing Cart
```javascript
const [clearCart] = useClearCartMutation();
await clearCart().unwrap();
```

## Migration Notes

- The system maintains backward compatibility with Redux cart data
- API data takes precedence when available
- All existing functionality is preserved
- Loading states improve user experience
- Error handling provides better feedback

## Requirements

- User must be authenticated (userId required)
- API endpoints must be properly configured in environment variables
- Backend must support the specified API endpoints
