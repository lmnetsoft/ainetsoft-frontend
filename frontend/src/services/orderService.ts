import api from './api';

const extractError = (error: any, defaultMsg: string): string => {
  const errorData = error.response?.data;
  if (typeof errorData === 'string') return errorData;
  if (errorData && typeof errorData === 'object') return errorData.message || errorData.error || defaultMsg;
  return error.message || defaultMsg;
};

export const getMyOrders = async (status: string = 'ALL'): Promise<any[]> => {
  try {
    const response = await api.get('/orders/me', { params: { status } });
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Không thể tải danh sách đơn hàng."));
  }
};

export const placeOrder = async (paymentMethod: string): Promise<any> => {
  try {
    const response = await api.post('/orders/checkout', { paymentMethod });
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Đặt hàng thất bại."));
  }
};

export const getSellerOrders = async (shopName: string): Promise<any[]> => {
  try {
    const response = await api.get(`/orders/seller/${shopName}`);
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Không thể tải đơn hàng của shop."));
  }
};