import React, { useState, useEffect } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css'; 
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ToastNotification from '../../components/Toast/ToastNotification';
import { getUserProfile, updateProfile } from '../../services/authService';
import './Profile.css';

const Address = () => {
  const [addressData, setAddressData] = useState({
    receiverName: '', 
    phone: '', 
    province: '',
    ward: '',
    detail: ''
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchAddressInfo = async () => {
      try {
        setLoading(true);
        const data = await getUserProfile();
        if (data.addresses && data.addresses.length > 0) {
          setAddressData(data.addresses[0]);
        } else {
          setAddressData(prev => ({
            ...prev,
            receiverName: data.fullName || '',
            phone: data.phone || ''
          }));
        }
      } catch (error: any) {
        console.error("Lỗi tải địa chỉ:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAddressInfo();
    document.title = "Địa Chỉ Của Tôi | AiNetsoft";
  }, []);

  /**
   * NEW: Vietnamese Phone Format Validation
   * Ensures the number belongs to Viettel, Mobifone, Vina, etc.
   */
  const validateVNPhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    // Pattern: Starts with 84 or 0, followed by 3, 5, 7, 8, 9 and 8 digits
    const regex = /^(84|0)(3|5|7|8|9)\d{8}$/;
    return regex.test(cleanPhone);
  };

  const handleSave = async () => {
    if (!addressData.receiverName || !addressData.province || !addressData.ward || !addressData.detail) {
      setToastMessage("Vui lòng điền đầy đủ thông tin.");
      setShowToast(true);
      return;
    }

    // UPDATED: Strict Vietnamese Format Validation
    if (!addressData.phone || !validateVNPhone(addressData.phone)) {
      setToastMessage("Số điện thoại không hợp lệ hoặc không thuộc nhà mạng Việt Nam.");
      setShowToast(true);
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        fullName: addressData.receiverName,
        phone: addressData.phone,
        addresses: [{ ...addressData, isDefault: true }]
      };
      
      const result = await updateProfile(payload);
      setToastMessage(result || "Cập nhật địa chỉ thành công!");
      setShowToast(true);
    } catch (error: any) {
      /**
       * FIXED: Friendly Error Notification
       * This now displays the real backend message if the phone is a duplicate.
       */
      setToastMessage(error.message || "Cập nhật địa chỉ thất bại.");
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div className="profile-wrapper">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
      <div className="container profile-container">
        <AccountSidebar />
        <main className="profile-main-content">
          <div className="content-header">
            <h1>Địa Chỉ Của Tôi</h1>
            <p>Vietnam là mặc định, đồng bộ với hồ sơ cá nhân</p>
          </div>
          <hr className="divider" />
          <form className="profile-info-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-row">
              <label>Tên người nhận <span className="required-star">*</span></label>
              <input 
                type="text" 
                value={addressData.receiverName} 
                onChange={(e) => setAddressData({...addressData, receiverName: e.target.value})} 
              />
            </div>

            <div className="form-row">
              <label>Số điện thoại nhận hàng <span className="required-star">*</span></label>
              <div className="phone-input-wrapper">
                <PhoneInput
                  country={'vn'} 
                  value={addressData.phone}
                  onChange={(phone) => setAddressData({ ...addressData, phone })}
                  inputStyle={{ width: '100%', height: '40px' }}
                />
              </div>
            </div>

            <div className="form-row">
              <label>Tỉnh / Thành phố <span className="required-star">*</span></label>
              <input 
                type="text" 
                value={addressData.province} 
                onChange={(e) => setAddressData({...addressData, province: e.target.value})} 
              />
            </div>
            <div className="form-row">
              <label>Phường / Xã <span className="required-star">*</span></label>
              <input 
                type="text" 
                value={addressData.ward} 
                onChange={(e) => setAddressData({...addressData, ward: e.target.value})} 
              />
            </div>
            <div className="form-row">
              <label>Địa chỉ cụ thể <span className="required-star">*</span></label>
              <input 
                type="text" 
                value={addressData.detail} 
                onChange={(e) => setAddressData({...addressData, detail: e.target.value})} 
              />
            </div>

            <div className="form-row">
              <label></label>
              <button className="save-btn" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Lưu địa chỉ"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default Address;