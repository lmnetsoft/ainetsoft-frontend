import api from './api';

const extractError = (error: any, defaultMsg: string): string => {
  const errorData = error.response?.data;
  if (typeof errorData === 'string') return errorData;
  if (errorData && typeof errorData === 'object') return errorData.message || errorData.error || defaultMsg;
  return error.message || defaultMsg;
};

/**
 * Retrieves orders for the current user.
 */
export const getMyOrders = async (status: string = 'ALL'): Promise<any[]> => {
  try {
    const response = await api.get('/orders/my-orders', { params: { status } });
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Không thể tải danh sách đơn hàng."));
  }
};

/**
 * 🛠️ FIXED: Creates a new order from the cart.
 * Updated to accept a full data object (address, payment method, etc.)
 */
export const placeOrder = async (checkoutData: any): Promise<any> => {
  try {
    // Send the full object to match the @RequestBody Order in Java
    const response = await api.post('/orders/checkout', checkoutData);
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Đặt hàng thất bại."));
  }
};

/**
 * 🛠️ NEW: Checks if a product can be reviewed.
 * Required for the "Write Review" button logic in ProductDetail.tsx
 */
export const checkReviewEligibility = async (productId: string): Promise<{ eligible: boolean, orderId?: string }> => {
  try {
    const response = await api.get(`/orders/eligible-to-review/${productId}`);
    return response.data;
  } catch (error: any) {
    console.error("Eligibility check failed", error);
    return { eligible: false };
  }
};

/**
 * Cancels an order.
 */
export const cancelOrder = async (orderId: string): Promise<any> => {
  try {
    const response = await api.post(`/orders/cancel/${orderId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Hủy đơn hàng thất bại."));
  }
};

/**
 * Seller-specific: Get orders for their shop.
 */
export const getSellerOrders = async (status: string = 'ALL'): Promise<any[]> => {
  try {
    const response = await api.get('/orders/seller', { params: { status } });
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Không thể tải đơn hàng của shop."));
  }
};

/**
 * Seller-specific: Update status.
 */
export const updateOrderStatus = async (orderId: string, status: string): Promise<any> => {
  try {
    const response = await api.put(`/orders/seller/update-status/${orderId}`, { status });
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Cập nhật trạng thái thất bại."));
  }
};