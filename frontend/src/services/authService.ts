import api from './api'; 

const extractError = (error: any, defaultMsg: string): string => {
  const errorData = error.response?.data;
  if (typeof errorData === 'string') return errorData;
  if (errorData && typeof errorData === 'object') {
    return errorData.message || errorData.error || defaultMsg;
  }
  return error.message || defaultMsg;
};

/**
 * Utility to clear ONLY authentication data.
 * This preserves the 'chatGuestId' so visitors don't lose chat history.
 */
const clearAuthData = () => {
    const keysToRemove = [
        'jwt_token', 
        'isAuthenticated', 
        'userName', 
        'userEmail', 
        'userPhone', 
        'userAvatar', 
        'userRoles'
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
};

export const getUserProfile = async (): Promise<any> => {
  try {
    const response = await api.get('/auth/me'); 
    
    if (response.data) {
      // Logic check: We want to ensure the user is actually valid.
      // We are more lenient now to support Social Users who might have generic names.
      const name = response.data.fullName;
      const email = response.data.email;

      if (name || email) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userName', name || 'Thành viên');
        
        // Save identity for Chat and Profile components
        localStorage.setItem('userEmail', response.data.email || '');
        localStorage.setItem('userPhone', response.data.phone || '');
        localStorage.setItem('userAvatar', response.data.avatarUrl || '');
        localStorage.setItem('userRoles', JSON.stringify(response.data.roles || []));
      } else {
        // Only remove if the response is completely empty
        clearAuthData();
      }

      window.dispatchEvent(new Event('profileUpdate'));
    }
    
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
        // Token expired or invalid: Clear auth but keep Visitor IDs
        clearAuthData();
        window.dispatchEvent(new Event('profileUpdate'));
    }
    throw new Error(extractError(error, "Không thể tải thông tin cá nhân."));
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch (err) {
    console.error("Backend logout failed, clearing local state anyway.");
  } finally {
    // PROTECT VISITOR ID: Use specific removal instead of .clear()
    clearAuthData();
    window.dispatchEvent(new Event('profileUpdate'));
  }
};

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
    
    if (response.data.token) {
      localStorage.setItem('jwt_token', response.data.token);
    }
    
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userName', response.data.fullName || 'Thành viên');

    // Save full identity for Chat/Header immediately
    localStorage.setItem('userEmail', response.data.email || '');
    localStorage.setItem('userPhone', response.data.phone || '');
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
    throw new Error(extractError(error, "Yêu cầu khôi phục mật khẩu thất bại."));
  }
};

export const resetPassword = async (resetData: { contactInfo: string, otp: string, newPassword: string }): Promise<string> => {
  try {
    const response = await api.post('/auth/reset-password', resetData);
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Xác thực mã OTP thất bại."));
  }
};

export const upgradeToSeller = async (): Promise<string> => {
  try {
    const response = await api.post('/auth/upgrade-seller');
    // Refresh the profile to get the new ROLE_SELLER in localStorage
    await getUserProfile(); 
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Nâng cấp Người bán thất bại."));
  }
};