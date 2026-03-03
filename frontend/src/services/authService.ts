import api from './api'; 

/**
 * HELPER: Standardizes error extraction to prevent [object Object] bug.
 */
const extractError = (error: any, defaultMsg: string): string => {
  const errorData = error.response?.data;
  
  if (typeof errorData === 'string') return errorData;
  
  if (errorData && typeof errorData === 'object') {
    return errorData.message || errorData.error || defaultMsg;
  }

  return error.message || defaultMsg;
};

/**
 * UPDATED: Fetches profile and syncs identity data.
 */
export const getUserProfile = async (): Promise<any> => {
  try {
    const response = await api.get('/auth/me'); 
    
    if (response.data) {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userName', response.data.fullName || 'Thành viên');
      localStorage.setItem('userAvatar', response.data.avatarUrl || '');
      localStorage.setItem('userRoles', JSON.stringify(response.data.roles || []));

      window.dispatchEvent(new Event('profileUpdate'));
    }
    
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
        localStorage.clear();
        window.dispatchEvent(new Event('profileUpdate'));
    }
    throw new Error(extractError(error, "Không thể tải thông tin cá nhân."));
  }
};

/**
 * NEW: Informs backend to destroy the JSESSIONID and clears local state.
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch (err) {
    console.error("Backend logout failed, clearing local state anyway.");
  } finally {
    localStorage.clear();
    window.dispatchEvent(new Event('profileUpdate'));
  }
};

/**
 * Handles profile updates and triggers a UI refresh.
 */
export const updateProfile = async (profileData: any): Promise<string> => {
  try {
    const response = await api.put('/auth/profile', profileData);
    
    if (profileData.fullName) localStorage.setItem('userName', profileData.fullName);
    if (profileData.avatarUrl) localStorage.setItem('userAvatar', profileData.avatarUrl);

    window.dispatchEvent(new Event('profileUpdate'));
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Cập nhật hồ sơ thất bại."));
  }
};

/**
 * FIXED: Added back the missing changePasswordUser required by ChangePassword.tsx
 */
export const changePasswordUser = async (passwordData: { currentPassword: string, newPassword: string }): Promise<string> => {
  try {
    const response = await api.post('/auth/change-password', passwordData);
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Đổi mật khẩu thất bại."));
  }
};

export const loginUser = async (loginData: any): Promise<any> => {
  try {
    const response = await api.post('/auth/login', loginData);
    
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userName', response.data.fullName);
    localStorage.setItem('userAvatar', response.data.avatarUrl || '');
    localStorage.setItem('userRoles', JSON.stringify(response.data.roles || []));
    
    window.dispatchEvent(new Event('profileUpdate'));
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Đăng nhập thất bại."));
  }
};

export const registerUser = async (userData: any): Promise<string> => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Đăng ký thất bại."));
  }
};

export const requestPasswordReset = async (contactInfo: string): Promise<string> => {
  try {
    const response = await api.post('/auth/forgot-password', { contactInfo });
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Không tìm thấy tài khoản."));
  }
};

export const resetPassword = async (resetData: { contactInfo: string, otp: string, newPassword: string }): Promise<string> => {
  try {
    const response = await api.post('/auth/reset-password', resetData);
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Mã OTP không đúng hoặc đã hết hạn."));
  }
};

export const upgradeToSeller = async (): Promise<string> => {
  try {
    const response = await api.post('/auth/upgrade-seller');
    await getUserProfile(); 
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Nâng cấp Người bán thất bại."));
  }
};