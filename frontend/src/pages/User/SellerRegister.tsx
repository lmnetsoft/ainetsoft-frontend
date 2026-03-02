import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaExclamationTriangle, FaStore } from 'react-icons/fa';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import { getUserProfile, upgradeToSeller } from '../../services/authService'; // UPDATED: Added upgradeToSeller
import './Profile.css';
import './SellerRegister.css';

const SellerRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false); // NEW: Track the upgrade request
  const [requirements, setRequirements] = useState({
    hasPhone: false,
    hasAddress: false,
    hasBank: false
  });

  useEffect(() => {
    const checkEligibility = async () => {
      try {
        setLoading(true);
        const data = await getUserProfile();
        
        setRequirements({
          hasPhone: !!(data.phone && data.phone.length >= 10),
          hasAddress: !!(data.addresses && data.addresses.length > 0),
          hasBank: !!(data.bankAccounts && data.bankAccounts.length > 0)
        });
      } catch (error) {
        console.error("Eligibility check failed:", error);
      } finally {
        setLoading(false);
      }
    };

    checkEligibility();
    document.title = "Đăng ký Người bán | AiNetsoft";
  }, []);

  /**
   * NEW: Logic to trigger the role upgrade in the database
   */
  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      const message = await upgradeToSeller();
      
      // Success: Show confirmation and redirect to profile
      alert(message || "Chúc mừng! Bạn đã chính thức trở thành Người bán.");
      navigate('/user/profile');
    } catch (error: any) {
      alert(error.message || "Có lỗi xảy ra trong quá trình nâng cấp.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const isEligible = requirements.hasPhone && requirements.hasAddress && requirements.hasBank;

  return (
    <div className="profile-wrapper">
      <div className="container profile-container">
        <AccountSidebar />
        
        <main className="profile-main-content">
          <div className="seller-reg-header">
            <FaStore className="seller-icon" />
            <h1>Trở thành Người bán trên AiNetsoft</h1>
            <p>Hoàn tất các bước dưới đây để bắt đầu kinh doanh ngay hôm nay</p>
          </div>

          <div className="requirements-list">
            {/* Requirement: Phone */}
            <div className={`requirement-item ${requirements.hasPhone ? 'done' : 'pending'}`}>
              <div className="req-status">
                {requirements.hasPhone ? <FaCheckCircle /> : <FaExclamationTriangle />}
              </div>
              <div className="req-text">
                <h3>Xác thực Số điện thoại</h3>
                <p>Cần thiết để liên lạc với khách hàng và đơn vị vận chuyển.</p>
              </div>
              {!requirements.hasPhone && (
                <button onClick={() => navigate('/user/profile')} className="req-fix-btn">Cập nhật</button>
              )}
            </div>

            {/* Requirement: Address */}
            <div className={`requirement-item ${requirements.hasAddress ? 'done' : 'pending'}`}>
              <div className="req-status">
                {requirements.hasAddress ? <FaCheckCircle /> : <FaExclamationTriangle />}
              </div>
              <div className="req-text">
                <h3>Thiết lập Địa chỉ lấy hàng</h3>
                <p>Địa chỉ này sẽ được dùng để đơn vị vận chuyển đến lấy hàng.</p>
              </div>
              {!requirements.hasAddress && (
                <button onClick={() => navigate('/user/address')} className="req-fix-btn">Cập nhật</button>
              )}
            </div>

            {/* Requirement: Bank */}
            <div className={`requirement-item ${requirements.hasBank ? 'done' : 'pending'}`}>
              <div className="req-status">
                {requirements.hasBank ? <FaCheckCircle /> : <FaExclamationTriangle />}
              </div>
              <div className="req-text">
                <h3>Liên kết Tài khoản Ngân hàng</h3>
                <p>Dùng để nhận doanh thu từ các đơn hàng thành công.</p>
              </div>
              {!requirements.hasBank && (
                <button onClick={() => navigate('/user/bank')} className="req-fix-btn">Cập nhật</button>
              )}
            </div>
          </div>

          <div className="seller-action-zone">
            {loading ? (
              <p>Đang kiểm tra thông tin...</p>
            ) : isEligible ? (
              <div className="eligible-box">
                <p>Chúc mừng! Bạn đã đủ điều kiện để trở thành người bán.</p>
                <button 
                  className="final-upgrade-btn" 
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                >
                  {isUpgrading ? "Đang xử lý..." : "Kích hoạt tài khoản Người bán"}
                </button>
              </div>
            ) : (
              <div className="not-eligible-box">
                <p>Vui lòng hoàn tất các yêu cầu còn thiếu để tiếp tục.</p>
                <button className="final-upgrade-btn disabled" disabled>Kích hoạt tài khoản Người bán</button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SellerRegister;