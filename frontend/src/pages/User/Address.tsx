import React, { useState, useEffect } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css'; 
import ToastNotification from '../../components/Toast/ToastNotification';
import { getUserProfile, updateProfile } from '../../services/authService';
import './Profile.css'; 

const Address = () => {
  const [addressData, setAddressData] = useState({
    receiverName: '', 
    phone: '84', // 🚀 Default to 84 for consistent +84 display
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
        
        /**
         * 🚀 NORMALIZATION LOGIC: 
         * Synchronized with Profile page to ensure consistent phone format
         */
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

    try {
      setIsSaving(true);
      // Ensure phone has + prefix for storage
      const finalPhone = addressData.phone.startsWith('+') ? addressData.phone : `+${addressData.phone}`;

      const payload = {
        fullName: addressData.receiverName,
        phone: finalPhone,
        addresses: [{ ...addressData, phone: finalPhone, isDefault: true }]
      };
      
      const result = await updateProfile(payload);
      setToastMessage(result || "Cập nhật địa chỉ thành công!");
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error.message || "Cập nhật địa chỉ thất bại.");
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="profile-loading-box">Đang tải địa chỉ...</div>;

  return (
    <div className="user-profile-supreme-layout">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
      
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
              {/* 🚀 FIXED: Added forceDialCode and countryCodeEditable to match Profile page */}
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
    </div>
  );
};

export default Address;