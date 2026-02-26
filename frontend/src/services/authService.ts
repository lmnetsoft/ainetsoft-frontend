import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth';

/**
 * Sends registration data to the Spring Boot backend.
 */
export const registerUser = async (userData: any): Promise<string> => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data || "Máy chủ không phản hồi. Vui lòng thử lại sau.";
    throw new Error(errorMessage);
  }
};

/**
 * Sends login credentials to the backend.
 * @param loginData - Contains contactInfo (email/phone) and password.
 */
export const loginUser = async (loginData: any): Promise<string> => {
  try {
    const response = await axios.post(`${API_URL}/login`, loginData);
    // Backend returns a plain string: "Đăng nhập thành công!"
    return response.data;
  } catch (error: any) {
    // Captches 401 Unauthorized or other backend errors
    const errorMessage = error.response?.data || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
    throw new Error(errorMessage);
  }
};