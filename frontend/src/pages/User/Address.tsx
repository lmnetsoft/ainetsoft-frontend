import React, { useState, useEffect } from 'react';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ToastNotification from '../../components/Toast/ToastNotification';
import { getUserProfile, updateProfile } from '../../services/authService';
import './Profile.css';

const Address = () => {
  const [addressData, setAddressData] = useState({
    province: '',
    district: '',
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
        // Dynamic: Check if user already has an address saved
        if (data.addresses && data.addresses.length > 0) {
          setAddressData(data.addresses[0]);
        }
      } catch (error: any) {
        console.error("Address load error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAddressInfo();
    document.title = "Địa chỉ của tôi | AiNetsoft";
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Dynamic: Send as a list with isDefault flag
      await updateProfile({
        addresses: [{ ...addressData, isDefault: true }]
      });
      setToastMessage("Cập nhật địa chỉ thành công!");
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error.message || "Lỗi cập nhật địa chỉ.");
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="profile-wrapper"><div className="container" style={{padding: '100px', textAlign: 'center'}}><h3>Đang tải...</h3></div></div>;

  return (
    <div className="profile-wrapper">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
      <div className="container profile-container">
        <AccountSidebar />
        <main className="profile-main-content">
          <div className="content-header">
            <h1>Địa chỉ của tôi</h1>
            <p>Địa chỉ này sẽ được dùng làm địa chỉ lấy hàng và nhận hàng</p>
          </div>
          <hr className="divider" />
          <div className="profile-form-container">
            <form className="profile-info-form">
              <div className="form-row">
                <label>Tỉnh / Thành phố</label>
                <input 
                  type="text" 
                  value={addressData.province} 
                  onChange={(e) => setAddressData({...addressData, province: e.target.value})}
                  placeholder="Ví dụ: Hà Nội"
                />
              </div>
              <div className="form-row">
                <label>Quận / Huyện</label>
                <input 
                  type="text" 
                  value={addressData.district} 
                  onChange={(e) => setAddressData({...addressData, district: e.target.value})}
                  placeholder="Ví dụ: Cầu Giấy"
                />
              </div>
              <div className="form-row">
                <label>Phường / Xã</label>
                <input 
                  type="text" 
                  value={addressData.ward} 
                  onChange={(e) => setAddressData({...addressData, ward: e.target.value})}
                  placeholder="Ví dụ: Dịch Vọng Hậu"
                />
              </div>
              <div className="form-row">
                <label>Địa chỉ cụ thể</label>
                <input 
                  type="text" 
                  value={addressData.detail} 
                  onChange={(e) => setAddressData({...addressData, detail: e.target.value})}
                  placeholder="Số nhà, tên đường..."
                />
              </div>
              <div className="form-row">
                <label></label>
                <button type="button" className="save-btn" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Đang lưu..." : "Lưu địa chỉ"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Address;