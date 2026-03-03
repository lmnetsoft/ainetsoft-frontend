import api from './api'; // Import the pre-configured instance

/**
 * HELPER: Standardizes error extraction to prevent [object Object] bug.
 * Extracts the human-readable 'message' from the backend response.
 */
const extractError = (error: any, defaultMsg: string): string => {
  const errorData = error.response?.data;
  
  if (typeof errorData === 'string') {
    return errorData;
  }
  
  if (errorData && typeof errorData === 'object') {
    // Extracts 'message' field common in your Spring Boot backend
    return errorData.message || errorData.error || defaultMsg;
  }

  return error.message || defaultMsg;
};

/**
 * UPDATED: Fetches profile and syncs identity data to localStorage.
 * Dispatches 'profileUpdate' so the Header avatar shows up on first load.
 */
export const getUserProfile = async (): Promise<any> => {
  try {
    const response = await api.get('/auth/me'); 
    
    if (response.data) {
      localStorage.setItem('userName', response.data.fullName || 'Thành viên');
      localStorage.setItem('userAvatar', response.data.avatarUrl || '');
      localStorage.setItem('userRoles', JSON.stringify(response.data.roles || []));

      // TRIGGER: Tell the Header to refresh the photo immediately
      window.dispatchEvent(new Event('profileUpdate'));
    }
    
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Không thể tải thông tin cá nhân."));
  }
};

/**
 * Handles dynamic updates for any user field.
 * Dispatches 'profileUpdate' so UI components sync instantly.
 */
export const updateProfile = async (profileData: any): Promise<string> => {
  try {
    const response = await api.put('/auth/profile', profileData);
    
    // Sync UI local storage if basic info changed
    if (profileData.fullName) localStorage.setItem('userName', profileData.fullName);
    if (profileData.avatarUrl) localStorage.setItem('userAvatar', profileData.avatarUrl);

    // TRIGGER: Tell Header to refresh
    window.dispatchEvent(new Event('profileUpdate'));

    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Cập nhật hồ sơ thất bại."));
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
    throw new Error(extractError(error, "Nâng cấp tài khoản Người bán thất bại."));
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

export const registerUser = async (userData: any): Promise<string> => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Đăng ký thất bại."));
  }
};

/**
 * Standardizes Login and ensures immediate UI sync.
 * This fixes the missing avatar on the Home page right after login.
 */
export const loginUser = async (loginData: any): Promise<any> => {
  try {
    const response = await api.post('/auth/login', loginData);
    
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userName', response.data.fullName);
    localStorage.setItem('userAvatar', response.data.avatarUrl || '');
    localStorage.setItem('userRoles', JSON.stringify(response.data.roles || []));
    
    // TRIGGER: Force Header to show the avatar right after login
    window.dispatchEvent(new Event('profileUpdate'));
    
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Đăng nhập thất bại."));
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