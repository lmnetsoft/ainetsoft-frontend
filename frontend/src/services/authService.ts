import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth';

/**
 * Sends registration data to the Spring Boot backend.
 * @param userData - The object containing fullName, email, phone, and password.
 * @returns Promise<string> - The success message from the server.
 */
export const registerUser = async (userData: any): Promise<string> => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    // The backend returns a plain string: "Đăng ký thành công!"
    return response.data;
  } catch (error: any) {
    // Extracts the custom error message from your Java AuthService
    // (e.g., "Email này đã được sử dụng!")
    const errorMessage = error.response?.data || "Máy chủ không phản hồi. Vui lòng thử lại sau.";
    throw new Error(errorMessage);
  }
};