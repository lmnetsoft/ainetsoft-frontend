import api from './api';

const extractError = (error: any, defaultMsg: string): string => {
  const errorData = error.response?.data;
  if (typeof errorData === 'string') return errorData;
  if (errorData && typeof errorData === 'object') return errorData.message || errorData.error || defaultMsg;
  return error.message || defaultMsg;
};

/**
 * Retrieves orders for the current user.
 * Matches @GetMapping("/my-orders") in OrderController.java
 */
export const getMyOrders = async (status: string = 'ALL'): Promise<any[]> => {
  try {
    // We send 'ALL' or the specific status; backend filters accordingly
    const response = await api.get('/orders/my-orders', { params: { status } });
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Không thể tải danh sách đơn hàng."));
  }
};

/**
 * Creates a new order from the cart.
 */
export const placeOrder = async (paymentMethod: string): Promise<any> => {
  try {
    const response = await api.post('/orders/checkout', { paymentMethod });
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Đặt hàng thất bại."));
  }
};

/**
 * FIX: Added the missing cancelOrder function.
 * Matches @PostMapping("/cancel/{orderId}") in OrderController.java
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