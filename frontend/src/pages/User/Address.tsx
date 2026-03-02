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
        // Retrieve address from database
        if (data.addresses && data.addresses.length > 0) {
          setAddressData(data.addresses[0]);
        } else {
          // If no address exists, seed it with Profile data for consistency
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

  const handleSave = async () => {
    // Check mandatory fields
    if (!addressData.receiverName || !addressData.province || !addressData.ward || !addressData.detail) {
      setToastMessage("Vui lòng điền đầy đủ thông tin.");
      setShowToast(true);
      return;
    }

    if (!addressData.phone || addressData.phone.length <= 3) {
      setToastMessage("Vui lòng nhập số điện thoại.");
      setShowToast(true);
      return;
    }

    try {
      setIsSaving(true);
      // SYNC LOGIC: Send phone number to both root and address list
      const payload = {
        fullName: addressData.receiverName,
        phone: addressData.phone, // Updates Profile page
        addresses: [{ ...addressData, isDefault: true }] // Updates Address page
      };
      
      await updateProfile(payload);
      setToastMessage("Cập nhật địa chỉ và hồ sơ thành công!");
      setShowToast(true);
    } catch (error: any) {
      // FIX: Standardized error extraction
      const errorData = error.response?.data;
      setToastMessage(typeof errorData === 'string' ? errorData : (errorData?.message || "Lỗi cập nhật."));
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
              <label>Tên người nhận</label>
              <input type="text" value={addressData.receiverName} onChange={(e) => setAddressData({...addressData, receiverName: e.target.value})} />
            </div>

            <div className="form-row">
              <label>Số điện thoại nhận hàng</label>
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
              <label>Tỉnh / Thành phố</label>
              <input type="text" value={addressData.province} onChange={(e) => setAddressData({...addressData, province: e.target.value})} />
            </div>
            <div className="form-row">
              <label>Phường / Xã</label>
              <input type="text" value={addressData.ward} onChange={(e) => setAddressData({...addressData, ward: e.target.value})} />
            </div>
            <div className="form-row">
              <label>Địa chỉ cụ thể</label>
              <input type="text" value={addressData.detail} onChange={(e) => setAddressData({...addressData, detail: e.target.value})} />
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