import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth';

/**
 * MANDATORY: This tells Axios to include the session cookie in every request.
 */
axios.defaults.withCredentials = true;

/**
 * UPDATED: Fetches profile and syncs identity data to localStorage.
 */
export const getUserProfile = async (): Promise<any> => {
  try {
    const response = await axios.get(`${API_URL}/me`);
    
    if (response.data) {
      localStorage.setItem('userName', response.data.fullName || 'Thành viên');
      localStorage.setItem('userAvatar', response.data.avatarUrl || '');
      localStorage.setItem('userRoles', JSON.stringify(response.data.roles || []));
    }
    
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data || "Không thể tải thông tin cá nhân.");
  }
};

/**
 * UPDATED: Handles dynamic updates for any user field, 
 * including embedded Bank and Address data.
 */
export const updateProfile = async (profileData: any): Promise<string> => {
  try {
    const response = await axios.put(`${API_URL}/profile`, profileData);
    
    if (profileData.fullName) localStorage.setItem('userName', profileData.fullName);
    if (profileData.avatarUrl) localStorage.setItem('userAvatar', profileData.avatarUrl);

    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data || "Cập nhật hồ sơ thất bại.");
  }
};

/**
 * NEW: Request to upgrade the current user to a SELLER role.
 */
export const upgradeToSeller = async (): Promise<string> => {
  try {
    const response = await axios.post(`${API_URL}/upgrade-seller`);
    
    // On success, we should refresh the profile to get the new 'SELLER' role in localStorage
    await getUserProfile(); 
    
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data || "Nâng cấp tài khoản Người bán thất bại.");
  }
};

export const changePasswordUser = async (passwordData: { currentPassword: string, newPassword: string }): Promise<string> => {
  try {
    const response = await axios.post(`${API_URL}/change-password`, passwordData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data || "Đổi mật khẩu thất bại.");
  }
};

export const registerUser = async (userData: any): Promise<string> => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data || "Máy chủ không phản hồi.");
  }
};

export const loginUser = async (loginData: any): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/login`, loginData);
    
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userName', response.data.fullName);
    localStorage.setItem('userAvatar', response.data.avatarUrl || '');
    localStorage.setItem('userRoles', JSON.stringify(response.data.roles || []));
    
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data || "Đăng nhập thất bại.");
  }
};

export const requestPasswordReset = async (contactInfo: string): Promise<string> => {
  try {
    const response = await axios.post(`${API_URL}/forgot-password`, { contactInfo });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data || "Không tìm thấy tài khoản.");
  }
};

export const resetPassword = async (resetData: { contactInfo: string, otp: string, newPassword: string }): Promise<string> => {
  try {
    const response = await axios.post(`${API_URL}/reset-password`, resetData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data || "Mã OTP không đúng hoặc đã hết hạn.");
  }
};