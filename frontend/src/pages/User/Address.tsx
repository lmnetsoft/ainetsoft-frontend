import React, { useState, useEffect } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css'; 
import ToastNotification from '../../components/Toast/ToastNotification';
// 🚀 ADDED sendOtp to imports
import { getUserProfile, updateProfile, sendOtp } from '../../services/authService';
import './Profile.css'; 
// 🚀 ADDED OtpVerification import
import OtpVerification from '../../components/OtpVerification/OtpVerification';

const Address = () => {
  const [addressData, setAddressData] = useState({
    receiverName: '', 
    phone: '84', 
    province: '',
    ward: '',
    detail: ''
  });

  // 🚀 NEW: Track original phone to detect changes
  const [originalPhone, setOriginalPhone] = useState('84');

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 🚀 NEW: Track OTP Context
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  useEffect(() => {
    const fetchAddressInfo = async () => {
      try {
        setLoading(true);
        const data = await getUserProfile();
        
        let rawPhone = (data.addresses && data.addresses.length > 0) 
          ? data.addresses[0].phone 
          : data.phone;

        let normalizedPhone = '84';
        if (rawPhone) {
            const digits = rawPhone.replace(/\D/g, '');
            if (digits.startsWith('084')) {
                normalizedPhone = digits.slice(1);
            } else if (digits.startsWith('0')) {
                normalizedPhone = '84' + digits.slice(1);
            } else {
                normalizedPhone = digits;
            }
        }

        if (data.addresses && data.addresses.length > 0) {
          setAddressData({
            ...data.addresses[0],
            phone: normalizedPhone
          });
        } else {
          setAddressData(prev => ({
            ...prev,
            receiverName: data.fullName || '',
            phone: normalizedPhone
          }));
        }
        
        // 🚀 Set the baseline to detect changes
        setOriginalPhone(normalizedPhone);
        
      } catch (error: any) {
        console.error("Lỗi tải địa chỉ:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAddressInfo();
    document.title = "ĐỊA CHỈ CỦA TÔI | AiNetsoft";
  }, []);

  const validateVNPhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const regex = /^(84|0)(3|5|7|8|9)\d{8}$/;
    return regex.test(cleanPhone);
  };

  const handleSave = async () => {
    if (!addressData.receiverName || !addressData.province || !addressData.ward || !addressData.detail) {
      setToastMessage("Vui lòng điền đầy đủ thông tin.");
      setShowToast(true);
      return;
    }

    if (!addressData.phone || !validateVNPhone(addressData.phone)) {
      setToastMessage("Số điện thoại không hợp lệ hoặc không thuộc nhà mạng Việt Nam.");
      setShowToast(true);
      return;
    }

    // 🚀 NEW: Detect if phone number changed
    const phoneChanged = addressData.phone !== originalPhone;

    try {
      setIsSaving(true);

      // 🚀 NEW: Trigger OTP if phone changed
      if (phoneChanged) {
        await sendOtp(addressData.phone);
        setShowOtpModal(true);
        setToastMessage("Mã xác minh đã được gửi đến số điện thoại mới.");
        setShowToast(true);
        setIsSaving(false);
        return; // Pause save process to wait for OTP
      }

      // If no phone change, proceed normally
      await performFinalUpdate();
    } catch (error: any) {
      setToastMessage(error.message || "Cập nhật địa chỉ thất bại.");
      setShowToast(true);
      setIsSaving(false);
    }
  };

  // 🚀 NEW: Extracted the final update logic to support the OTP flow
  const performFinalUpdate = async (otpCode?: string) => {
    const finalPhone = addressData.phone.startsWith('+') ? addressData.phone : `+${addressData.phone}`;

    const payload = {
      fullName: addressData.receiverName,
      phone: finalPhone,
      otpCode: otpCode, // Gatekeeper token passed if applicable
      addresses: [{ ...addressData, phone: finalPhone, isDefault: true }]
    };
    
    const result = await updateProfile(payload);
    setToastMessage(result || "Cập nhật địa chỉ thành công!");
    setShowToast(true);
    setOriginalPhone(addressData.phone); // Update baseline on success
    setIsSaving(false);
  };

  // 🚀 NEW: OTP verification handler
  const handleVerifyOtp = async (code: string) => {
    try {
      setIsVerifyingOtp(true);
      await performFinalUpdate(code);
      setShowOtpModal(false);
    } catch (error: any) {
      setToastMessage(error.message || "Mã xác thực không chính xác.");
      setShowToast(true);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="user-profile-supreme-layout">
      {/* 🚀 STABILITY FIX: Wrap content in loading check inside the mounted container */}
      {loading ? (
        <div className="profile-loading-box">Đang tải địa chỉ...</div>
      ) : (
        <>
          <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
          
          {/* 🚀 ADDED OTP MODAL */}
          {showOtpModal && (
            <div className="admin-modal-overlay">
              <div className="seller-review-modal" style={{ maxWidth: '480px', height: 'auto', padding: '10px' }}>
                 <OtpVerification 
                   phoneNumber={addressData.phone}
                   onBack={() => setShowOtpModal(false)}
                   onVerify={handleVerifyOtp}
                   onResend={() => sendOtp(addressData.phone)}
                 />
              </div>
            </div>
          )}

          <div className="profile-content-header centered-header">
            <h1>ĐỊA CHỈ CỦA TÔI</h1>
            <p>Vietnam là mặc định, đồng bộ với hồ sơ cá nhân</p>
          </div>
          
          <hr className="supreme-divider" />

          <div className="profile-main-grid">
            <form className="profile-data-form" onSubmit={(e) => e.preventDefault()}>
              
              <div className="supreme-form-row">
                <label>Tên người nhận <span className="req">*</span></label>
                <div className="input-group-container">
                  <input 
                    type="text" 
                    value={addressData.receiverName} 
                    onChange={(e) => setAddressData({...addressData, receiverName: e.target.value})} 
                    placeholder="Nhập tên người nhận"
                  />
                </div>
              </div>

              <div className="supreme-form-row">
                <label>Số điện thoại <span className="req">*</span></label>
                <div className="input-group-container">
                  <PhoneInput
                    country={'vn'} 
                    preferredCountries={['vn']}
                    value={addressData.phone}
                    onChange={(phone) => setAddressData({ ...addressData, phone })}
                    enableSearch={true}
                    searchPlaceholder="Tìm kiếm quốc gia..."
                    containerClass="supreme-phone-container"
                    inputStyle={{ width: '100%', height: '45px', paddingLeft: '48px', fontSize: '0.9375rem' }}
                    specialLabel={""}
                    forceDialCode={true}
                    countryCodeEditable={false}
                  />
                </div>
              </div>

              <div className="supreme-form-row">
                <label>Tỉnh / Thành phố <span className="req">*</span></label>
                <div className="input-group-container">
                  <input 
                    type="text" 
                    value={addressData.province} 
                    onChange={(e) => setAddressData({...addressData, province: e.target.value})} 
                    placeholder="Tỉnh / Thành phố"
                  />
                </div>
              </div>

              <div className="supreme-form-row">
                <label>Phường / Xã <span className="req">*</span></label>
                <div className="input-group-container">
                  <input 
                    type="text" 
                    value={addressData.ward} 
                    onChange={(e) => setAddressData({...addressData, ward: e.target.value})} 
                    placeholder="Phường / Xã"
                  />
                </div>
              </div>

              <div className="supreme-form-row">
                <label>Địa chỉ cụ thể <span className="req">*</span></label>
                <div className="input-group-container">
                  <input 
                    type="text" 
                    value={addressData.detail} 
                    onChange={(e) => setAddressData({...addressData, detail: e.target.value})} 
                    placeholder="Số nhà, tên đường..."
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="save-btn-supreme" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Đang lưu..." : "Lưu địa chỉ"}
                </button>
              </div>
            </form>

            <div className="profile-avatar-column" style={{ border: 'none' }}></div>
          </div>
        </>
      )}
    </div>
  );
};

export default Address;