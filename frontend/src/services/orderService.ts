import api from './api';

const extractError = (error: any, defaultMsg: string): string => {
  const errorData = error.response?.data;
  if (typeof errorData === 'string') return errorData;
  if (errorData && typeof errorData === 'object') return errorData.message || errorData.error || defaultMsg;
  return error.message || defaultMsg;
};

export const getMyOrders = async (status: string = 'ALL'): Promise<any[]> => {
  try {
    const response = await api.get('/orders/my-orders', { params: { status } });
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Không thể tải danh sách đơn hàng."));
  }
};

export const placeOrder = async (checkoutData: any): Promise<any> => {
  try {
    const response = await api.post('/orders/checkout', checkoutData);
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Đặt hàng thất bại."));
  }
};

export const checkReviewEligibility = async (productId: string): Promise<{ eligible: boolean, orderId?: string }> => {
  try {
    const response = await api.get(`/orders/eligible-to-review/${productId}`);
    return response.data;
  } catch (error: any) {
    console.error("Eligibility check failed", error);
    return { eligible: false };
  }
};

export const cancelOrder = async (orderId: string): Promise<any> => {
  try {
    const response = await api.post(`/orders/cancel/${orderId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Hủy đơn hàng thất bại."));
  }
};

export const getSellerOrders = async (status: string = 'ALL'): Promise<any[]> => {
  try {
    const response = await api.get('/orders/seller', { params: { status } });
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Không thể tải đơn hàng của shop."));
  }
};

export const updateOrderStatus = async (orderId: string, status: string): Promise<any> => {
  try {
    const response = await api.put(`/orders/seller/update-status/${orderId}`, { status });
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Cập nhật trạng thái thất bại."));
  }
};

// ==========================================
// 🚀 NEW: API TRẢ HÀNG / HOÀN TIỀN
// ==========================================
export const requestReturnOrder = async (orderId: string, payload: { reason: string, description: string, images: string[] }): Promise<any> => {
    try {
      const response = await api.post(`/orders/${orderId}/return`, payload);
      return response.data;
    } catch (error: any) {
      throw new Error(extractError(error, "Yêu cầu trả hàng thất bại."));
    }
};
  
export const processReturnOrder = async (orderId: string, isApproved: boolean): Promise<any> => {
    try {
      const response = await api.put(`/orders/seller/${orderId}/return-process`, { isApproved });
      return response.data;
    } catch (error: any) {
      throw new Error(extractError(error, "Xử lý trả hàng thất bại."));
    }
};