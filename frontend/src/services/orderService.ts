import api from './api';

/**
 * Fetches orders for the current user, optionally filtered by status.
 * Session cookie is handled automatically by the 'api' instance.
 */
export const getMyOrders = async (status: string = 'ALL'): Promise<any[]> => {
  try {
    const response = await api.get('/orders/me', {
      params: { status }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data || "Không thể tải danh sách đơn hàng.");
  }
};

/**
 * NEW: The actual checkout function.
 * Connects to OrderService.placeOrder(contactInfo, paymentMethod)
 */
export const placeOrder = async (paymentMethod: string): Promise<any> => {
  try {
    const response = await api.post('/orders/checkout', { paymentMethod });
    return response.data;
  } catch (error: any) {
    // This will catch "Giỏ hàng trống" or "Hết hàng" errors from the backend
    throw new Error(error.response?.data || "Đặt hàng thất bại.");
  }
};

/**
 * SELLER FEATURE: Fetches orders containing the seller's products.
 */
export const getSellerOrders = async (shopName: string): Promise<any[]> => {
  try {
    const response = await api.get(`/orders/seller/${shopName}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data || "Không thể tải đơn hàng của shop.");
  }
};