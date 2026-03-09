import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaExclamationTriangle, FaStore, FaHourglassHalf } from 'react-icons/fa';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import { getUserProfile, upgradeToSeller } from '../../services/authService';
import { toast } from 'react-hot-toast'; // Using toast is cleaner than alert
import './Profile.css';
import './SellerRegister.css';

const SellerRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [userStatus, setUserStatus] = useState<string>('NONE'); // NONE, PENDING, VERIFIED
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
        
        // Track the moderation status from backend
        setUserStatus(data.sellerVerification || 'NONE');

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

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      // Calls our Shopee-style backend upgrade logic
      const message = await upgradeToSeller(); 
      
      toast.success(message || "Yêu cầu đã được gửi! Admin sẽ sớm phê duyệt.");
      setUserStatus('PENDING'); // Update UI to show "Waiting" state immediately
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const isEligible = requirements.hasPhone && requirements.hasAddress && requirements.hasBank;

  // --- NEW: RENDER PENDING STATE ---
  if (userStatus === 'PENDING') {
    return (
      <div className="profile-wrapper">
        <div className="container profile-container">
          <AccountSidebar />
          <main className="profile-main-content">
            <div className="seller-pending-box">
              <FaHourglassHalf className="pending-icon-large" />
              <h1>Đang chờ phê duyệt</h1>
              <p>Hồ sơ của bạn đã được gửi đến Admin. Quá trình này thường mất 24h làm việc.</p>
              <button onClick={() => navigate('/')} className="btn-back-home">Quay lại trang chủ</button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // --- RENDER ELIGIBILITY LIST ---
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
             {/* ... Your existing requirement-items for Phone, Address, Bank (Keep them!) ... */}
             <div className={`requirement-item ${requirements.hasPhone ? 'done' : 'pending'}`}>
                <div className="req-status">{requirements.hasPhone ? <FaCheckCircle /> : <FaExclamationTriangle />}</div>
                <div className="req-text">
                  <h3>Xác thực Số điện thoại</h3>
                  <p>Cần thiết để liên lạc với khách hàng và đơn vị vận chuyển.</p>
                </div>
                {!requirements.hasPhone && <button onClick={() => navigate('/user/profile')} className="req-fix-btn">Cập nhật</button>}
             </div>
             {/* ... repeat for Address and Bank ... */}
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
                  {isUpgrading ? "Đang xử lý..." : "Gửi yêu cầu phê duyệt Shop"}
                </button>
              </div>
            ) : (
              <div className="not-eligible-box">
                <p>Vui lòng hoàn tất các yêu cầu còn thiếu để tiếp tục.</p>
                <button className="final-upgrade-btn disabled" disabled>Gửi yêu cầu phê duyệt Shop</button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SellerRegister;