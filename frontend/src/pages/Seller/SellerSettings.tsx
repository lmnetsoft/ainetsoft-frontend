import React, { useState, useEffect } from 'react';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ToastNotification from '../../components/Toast/ToastNotification';
import { getUserProfile, updateProfile } from '../../services/authService';
import './SellerSettings.css';

const SellerSettings = () => {
  const [shopData, setShopData] = useState({
    shopName: '',
    shopDescription: '',
    shopAddress: '',
    lowStockThreshold: 5,
    holidayMode: false
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchShopInfo = async () => {
      try {
        setLoading(true);
        const data = await getUserProfile();
        if (data.shopProfile) {
          setShopData(data.shopProfile);
        }
      } catch (error) {
        console.error("Lỗi tải thông tin shop:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchShopInfo();
    document.title = "Thiết lập Shop | AiNetsoft";
  }, []);

  const handleSave = async () => {
    if (!shopData.shopName.trim()) {
      setToastMessage("Tên shop không được để trống.");
      setShowToast(true);
      return;
    }

    try {
      setIsSaving(true);
      // We send the shopProfile nested object as defined in our Backend DTO
      await updateProfile({ shopProfile: shopData });
      setToastMessage("Cập nhật thiết lập shop thành công!");
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error.message || "Cập nhật thất bại.");
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
            <h1>Thiết lập Shop</h1>
            <p>Quản lý nhận diện thương hiệu và cấu hình kho hàng của bạn</p>
          </div>
          
          <hr className="divider" />
          
          <form className="profile-info-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-row">
              <label>Tên Shop <span className="required-star">*</span></label>
              <input 
                type="text" 
                value={shopData.shopName} 
                onChange={(e) => setShopData({...shopData, shopName: e.target.value})} 
                placeholder="Nhập tên shop của bạn"
              />
            </div>

            <div className="form-row">
              <label>Mô tả Shop</label>
              <textarea 
                className="shop-textarea"
                value={shopData.shopDescription} 
                onChange={(e) => setShopData({...shopData, shopDescription: e.target.value})} 
                placeholder="Giới thiệu ngắn về shop..."
              />
            </div>

            <div className="form-row">
              <label>Địa chỉ lấy hàng</label>
              <input 
                type="text" 
                value={shopData.shopAddress} 
                onChange={(e) => setShopData({...shopData, shopAddress: e.target.value})} 
              />
            </div>

            <div className="form-row">
              <label>Ngưỡng báo sắp hết hàng</label>
              <div className="threshold-input-group">
                <input 
                  type="number" 
                  value={shopData.lowStockThreshold} 
                  onChange={(e) => setShopData({...shopData, lowStockThreshold: parseInt(e.target.value) || 0})} 
                  min="0"
                />
                <span className="unit-label">sản phẩm</span>
              </div>
            </div>

            <div className="form-row">
              <label>Chế độ tạm nghỉ</label>
              <div className="toggle-wrapper">
                <input 
                  type="checkbox" 
                  checked={shopData.holidayMode} 
                  onChange={(e) => setShopData({...shopData, holidayMode: e.target.checked})} 
                />
                <span className="toggle-desc">Ẩn tất cả sản phẩm khỏi gian hàng khi bạn vắng mặt.</span>
              </div>
            </div>

            <div className="form-row">
              <label></label>
              <button className="save-btn" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Lưu thiết lập"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default SellerSettings;