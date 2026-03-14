import React, { useState, useEffect } from 'react';
import { 
  FaStore, FaMapMarkerAlt, FaUniversity, FaIdCard, FaCheckCircle, 
  FaExclamationCircle, FaUserEdit, FaSave, FaFileInvoice, FaCog, FaBell, FaPlaneDeparture 
} from 'react-icons/fa';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import { getUserProfile, updateProfile } from '../../services/authService';
import { toast } from 'react-hot-toast';
import './Profile.css';
import './SellerRegister.css';
import './SellerProfile.css';

const SellerProfile = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Expanded Shop State
  const [shopData, setShopData] = useState({
    shopName: '',
    shopDescription: '',
    shopAddress: '',
    taxCode: '',
    businessEmail: '',
    businessPhone: '',
    // Operational Settings
    holidayMode: false,
    lowStockThreshold: 5
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getUserProfile();
      setProfile(data);
      if (data.shopProfile) {
        setShopData({
          shopName: data.shopProfile.shopName || '',
          shopDescription: data.shopProfile.shopDescription || '',
          shopAddress: data.shopProfile.shopAddress || '',
          taxCode: data.shopProfile.taxCode || '',
          businessEmail: data.shopProfile.businessEmail || data.email || '',
          businessPhone: data.shopProfile.businessPhone || data.phone || '',
          holidayMode: data.shopProfile.holidayMode || false,
          lowStockThreshold: data.shopProfile.lowStockThreshold || 5
        });
      }
    } catch (error) {
      toast.error("Không thể tải thông tin Shop");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShopData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setShopData(prev => ({ ...prev, [name]: checked }));
  };

  const handleUpdateShop = async () => {
    try {
      setIsSaving(true);
      // Backend expects the shopProfile object
      await updateProfile({ shopProfile: shopData });
      toast.success("Cập nhật thông tin Shop thành công!");
    } catch (error: any) {
      toast.error(error.message || "Cập nhật thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="loading-screen">Đang tải hồ sơ Người bán...</div>;

  return (
    <div className="profile-wrapper">
      <div className="container profile-container">
        <AccountSidebar />
        <main className="profile-main-content">
          <div className="seller-profile-card">
            
            {/* Header: Shop Info & Status */}
            <div className={`seller-header-banner ${shopData.holidayMode ? 'on-holiday' : ''}`}>
              <div className="shop-avatar-large">
                {shopData.holidayMode ? <FaPlaneDeparture /> : <FaStore />}
              </div>
              <div className="shop-title-meta">
                <h1>{shopData.shopName || "Tên Shop của bạn"}</h1>
                <div className="verification-badge">
                  {profile.sellerVerification === 'VERIFIED' ? (
                    <span className="badge verified"><FaCheckCircle /> Đã xác thực</span>
                  ) : (
                    <span className="badge pending"><FaExclamationCircle /> Chờ xác thực</span>
                  )}
                  {shopData.holidayMode && <span className="badge holiday">Tạm nghỉ</span>}
                </div>
              </div>
            </div>

            <div className="seller-profile-grid">
              
              {/* Left Column: Editable Settings */}
              <div className="profile-section">
                <h3><FaStore /> Thông tin Shop</h3>
                <div className="input-group">
                  <label>Tên Shop</label>
                  <input type="text" name="shopName" value={shopData.shopName} onChange={handleInputChange} />
                </div>
                <div className="input-group">
                  <label>Mô tả Shop</label>
                  <textarea name="shopDescription" value={shopData.shopDescription} onChange={handleInputChange} />
                </div>
                <div className="input-group">
                  <label>Địa chỉ lấy hàng</label>
                  <input type="text" name="shopAddress" value={shopData.shopAddress} onChange={handleInputChange} />
                </div>

                <h3 className="section-divider"><FaCog /> Cài đặt vận hành</h3>
                
                <div className="setting-toggle-item">
                  <div className="setting-info">
                    <label>Chế độ Tạm nghỉ</label>
                    <p>Ngừng nhận đơn hàng mới khi bạn đi vắng.</p>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      name="holidayMode" 
                      checked={shopData.holidayMode} 
                      onChange={handleToggleChange} 
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="input-group">
                  <label><FaBell /> Ngưỡng báo tồn kho thấp</label>
                  <input 
                    type="number" 
                    name="lowStockThreshold" 
                    value={shopData.lowStockThreshold} 
                    onChange={handleInputChange} 
                    min="1"
                  />
                  <p className="hint">Hệ thống sẽ thông báo khi tồn kho sản phẩm dưới mức này.</p>
                </div>

                <button className="btn-save-shop" onClick={handleUpdateShop} disabled={isSaving}>
                  <FaSave /> {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>

              {/* Right Column: Read-Only Data */}
              <div className="profile-section legal-info">
                <h3><FaIdCard /> Hồ sơ Pháp lý</h3>
                <div className="readonly-item">
                  <label>Số CCCD (Đã xác minh)</label>
                  <p>{profile.identityInfo?.cccdNumber || "N/A"}</p>
                </div>
                <div className="readonly-item">
                  <label><FaFileInvoice /> Mã số thuế</label>
                  <p>{shopData.taxCode || "Chưa cập nhật"}</p>
                </div>

                <h3 className="section-divider"><FaUniversity /> Tài khoản Ngân hàng</h3>
                {profile.bankAccounts && profile.bankAccounts.length > 0 ? (
                  <div className="bank-card-preview">
                    <p className="bank-name">{profile.bankAccounts[0].bankName}</p>
                    <p className="acc-number">{profile.bankAccounts[0].accountNumber}</p>
                    <p className="acc-holder">{profile.bankAccounts[0].accountHolder}</p>
                    <span className="default-label">Mặc định</span>
                  </div>
                ) : (
                  <p className="no-data">Chưa có thông tin ngân hàng.</p>
                )}
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SellerProfile;