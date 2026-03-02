import axios from 'axios';

const API_URL = 'http://localhost:8080/api/orders';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Fetches orders for the current user, optionally filtered by status.
 */
export const getMyOrders = async (status: string = 'ALL'): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_URL}/me`, {
      params: { status },
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data || "Không thể tải danh sách đơn hàng.");
  }
};