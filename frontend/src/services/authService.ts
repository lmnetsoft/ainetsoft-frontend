import api from './api'; 

/**
 * Utility to extract clean error messages from backend responses.
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
 * Utility to clear ONLY authentication data.
 */
const clearAuthData = () => {
    const keysToRemove = [
        'jwt_token', 
        'isAuthenticated', 
        'user', 
        'userName', 
        'userEmail', 
        'userPhone', 
        'userAvatar', 
        'userRoles',
        'userPermissions',
        'isGlobalAdmin' 
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
};

export const getUserProfile = async (): Promise<any> => {
  try {
    const response = await api.get('/auth/me'); 
    
    if (response.data) {
      const name = response.data.fullName;
      if (name || response.data.email) {
        localStorage.setItem('user', JSON.stringify(response.data));
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userName', name || 'Thành viên');
        localStorage.setItem('userEmail', response.data.email || '');
        localStorage.setItem('userPhone', response.data.phone || '');
        localStorage.setItem('userAvatar', response.data.avatarUrl || '');
        localStorage.setItem('userRoles', JSON.stringify(response.data.roles || []));
        localStorage.setItem('userPermissions', JSON.stringify(response.data.permissions || []));
        localStorage.setItem('isGlobalAdmin', response.data.isGlobalAdmin ? 'true' : 'false');
      } else {
        clearAuthData();
      }
      window.dispatchEvent(new Event('profileUpdate'));
    }
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
        clearAuthData();
        window.dispatchEvent(new Event('profileUpdate'));
    }
    throw new Error(extractError(error, "Không thể tải thông tin cá nhân."));
  }
};

/**
 * NEW: Public lookup for Nice URLs (localhost:5173/shop-name)
 */
export const getUserProfileBySlug = async (slug: string): Promise<any> => {
  try {
    const response = await api.get(`/auth/public/shop/${slug}`);
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Không tìm thấy gian hàng này."));
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch (err) {
    console.error("Backend logout failed.");
  } finally {
    clearAuthData();
    window.dispatchEvent(new Event('profileUpdate'));
  }
};

export const updateProfile = async (profileData: any): Promise<string> => {
  try {
    const response = await api.put('/auth/profile', profileData);
    await getUserProfile();
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Cập nhật hồ sơ thất bại."));
  }
};

/**
 * NEW: Specifically for the 'Thiết lập Shop' Admin Board.
 * Handles text updates + Business License file upload.
 */
export const updateShopSettings = async (formData: FormData): Promise<any> => {
  try {
    const response = await api.put('/auth/seller/settings', formData);
    await getUserProfile(); // Refresh storage
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Cập nhật thiết lập Shop thất bại."));
  }
};

export const changePasswordUser = async (passwordData: any): Promise<string> => {
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
    if (response.data.token) localStorage.setItem('jwt_token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data));
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userName', response.data.fullName || 'Thành viên');
    localStorage.setItem('userEmail', response.data.email || '');
    localStorage.setItem('userPhone', response.data.phone || '');
    localStorage.setItem('userAvatar', response.data.avatarUrl || '');
    localStorage.setItem('userRoles', JSON.stringify(response.data.roles || []));
    localStorage.setItem('userPermissions', JSON.stringify(response.data.permissions || []));
    localStorage.setItem('isGlobalAdmin', response.data.isGlobalAdmin ? 'true' : 'false');
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

export const resetPassword = async (resetData: any): Promise<string> => {
  try {
    const response = await api.post('/auth/reset-password', resetData);
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Xác thực mã OTP thất bại."));
  }
};

export const upgradeToSeller = async (formData: any): Promise<string> => {
  try {
    const bodyFormData = new FormData();
    const registrationData = {
      phone: formData.phone,
      email: formData.email, 
      cccdNumber: formData.cccdNumber,
      shopName: formData.shopName,
      taxCode: formData.taxCode,
      bankName: formData.bankName,
      accountNumber: formData.accountNumber,
      accountHolder: formData.accountHolder,
      stockAddresses: formData.stockAddresses,
      shippingMethods: formData.shippingMethods 
    };

    const jsonBlob = new Blob([JSON.stringify(registrationData)], { type: 'application/json' });
    bodyFormData.append('data', jsonBlob);

    if (formData.frontImage) bodyFormData.append('frontImage', formData.frontImage);
    if (formData.backImage) bodyFormData.append('backImage', formData.backImage);
    if (formData.license) bodyFormData.append('license', formData.license);

    const response = await api.post('/auth/upgrade-seller', bodyFormData);
    await getUserProfile(); 
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Gửi hồ sơ Người bán thất bại."));
  }
};