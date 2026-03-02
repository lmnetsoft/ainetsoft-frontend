import api from './api'; // Import the pre-configured instance

/**
 * UPDATED: Fetches profile and syncs identity data to localStorage.
 */
export const getUserProfile = async (): Promise<any> => {
  try {
    const response = await api.get('/auth/me'); // Using relative path
    
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
 * Handles dynamic updates for any user field, 
 * including embedded Bank and Address data.
 */
export const updateProfile = async (profileData: any): Promise<string> => {
  try {
    const response = await api.put('/auth/profile', profileData);
    
    // Sync UI local storage if basic info changed
    if (profileData.fullName) localStorage.setItem('userName', profileData.fullName);
    if (profileData.avatarUrl) localStorage.setItem('userAvatar', profileData.avatarUrl);

    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data || "Cập nhật hồ sơ thất bại.");
  }
};

/**
 * Request to upgrade the current user to a SELLER role.
 */
export const upgradeToSeller = async (): Promise<string> => {
  try {
    const response = await api.post('/auth/upgrade-seller');
    
    // Refresh the profile to get the new 'SELLER' role in localStorage
    await getUserProfile(); 
    
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data || "Nâng cấp tài khoản Người bán thất bại.");
  }
};

export const changePasswordUser = async (passwordData: { currentPassword: string, newPassword: string }): Promise<string> => {
  try {
    const response = await api.post('/auth/change-password', passwordData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data || "Đổi mật khẩu thất bại.");
  }
};

export const registerUser = async (userData: any): Promise<string> => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data || "Đăng ký thất bại.");
  }
};

export const loginUser = async (loginData: any): Promise<any> => {
  try {
    const response = await api.post('/auth/login', loginData);
    
    // Crucial: Setup initial state
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
    const response = await api.post('/auth/forgot-password', { contactInfo });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data || "Không tìm thấy tài khoản.");
  }
};

export const resetPassword = async (resetData: { contactInfo: string, otp: string, newPassword: string }): Promise<string> => {
  try {
    const response = await api.post('/auth/reset-password', resetData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data || "Mã OTP không đúng hoặc đã hết hạn.");
  }
};