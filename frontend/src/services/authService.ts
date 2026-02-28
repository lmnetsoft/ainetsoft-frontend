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
 */
export const loginUser = async (loginData: any): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/login`, loginData);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
    throw new Error(errorMessage);
  }
};

/**
 * Step 1: Request an OTP for password recovery.
 */
export const requestPasswordReset = async (contactInfo: string): Promise<string> => {
  try {
    const response = await axios.post(`${API_URL}/forgot-password`, { contactInfo });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data || "Không tìm thấy tài khoản với thông tin này.";
    throw new Error(errorMessage);
  }
};

/**
 * Step 2: Submit the OTP and new password to the backend.
 */
export const resetPassword = async (resetData: { contactInfo: string, otp: string, newPassword: string }): Promise<string> => {
  try {
    const response = await axios.post(`${API_URL}/reset-password`, resetData);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data || "Mã OTP không đúng hoặc đã hết hạn.";
    throw new Error(errorMessage);
  }
};