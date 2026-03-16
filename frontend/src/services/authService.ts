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
 * Preserves 'chatGuestId' so visitors don't lose chat history during logout/expiry.
 */
const clearAuthData = () => {
    const keysToRemove = [
        'jwt_token', 
        'isAuthenticated', 
        'user', // FIX: Added to clear the master object
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
      const email = response.data.email;

      if (name || email) {
        // FIX: Save the full object so AddProduct.tsx can see the 'VERIFIED' status
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

export const logoutUser = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch (err) {
    console.error("Backend logout failed, clearing local state anyway.");
  } finally {
    clearAuthData();
    window.dispatchEvent(new Event('profileUpdate'));
  }
};

export const updateProfile = async (profileData: any): Promise<string> => {
  try {
    const response = await api.put('/auth/profile', profileData);
    
    // FIX: Re-fetch profile after update to ensure storage is 100% in sync
    await getUserProfile();

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
    
    // FIX: Save initial user state including verification status
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

export const resetPassword = async (resetData: { contactInfo: string, otp: string, newPassword: string }): Promise<string> => {
  try {
    const response = await api.post('/auth/reset-password', resetData);
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Xác thực mã OTP thất bại."));
  }
};

/**
 * UPDATED: upgradeToSeller now includes mandatory 'email' in the JSON Blob
 * to support users who registered with Phone but need an Email for Seller status.
 */
export const upgradeToSeller = async (formData: any): Promise<string> => {
  try {
    const bodyFormData = new FormData();

    // Prepare JSON part - Sync with backend SellerRegistrationDTO
    const registrationData = {
      phone: formData.phone,
      email: formData.email, 
      cccdNumber: formData.cccdNumber,
      shopName: formData.shopName,
      shopAddress: formData.shopAddress,
      taxCode: formData.taxCode,
      bankName: formData.bankName,
      accountNumber: formData.accountNumber,
      accountHolder: formData.accountHolder
    };

    // Wrap JSON in Blob to ensure Content-Type: application/json for this @RequestPart
    const jsonBlob = new Blob([JSON.stringify(registrationData)], {
      type: 'application/json'
    });
    bodyFormData.append('data', jsonBlob);

    // Append images
    if (formData.frontImage) {
      bodyFormData.append('frontImage', formData.frontImage);
    }
    if (formData.backImage) {
      bodyFormData.append('backImage', formData.backImage);
    }

    const response = await api.post('/auth/upgrade-seller', bodyFormData);
    
    // Crucial: Refresh profile so the UI reflects the PENDING status and updated email
    await getUserProfile(); 
    
    return response.data;
  } catch (error: any) {
    throw new Error(extractError(error, "Gửi hồ sơ Người bán thất bại."));
  }
};