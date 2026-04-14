import React from 'react';
import { 
  FaTimes, FaUserCircle, FaIdCard, FaStore, 
  FaEnvelope, FaCheckCircle, FaTag, FaFileInvoice
} from 'react-icons/fa';
import './AdminDashboard.css';

interface UserProfileModalProps {
  user: any;
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="seller-review-modal profile-inspection-modal animate-fade-in" onClick={(e) => e.stopPropagation()}>
        
        {/* 🚀 HEADER: Synchronized with Dashboard Font & Action Styles */}
        <div className="modal-header">
          <div className="header-title">
            <FaUserCircle className="title-icon" />
            <div>
              <h3 className="modal-main-title">Hồ sơ Chi tiết Người dùng</h3>
              <p className="user-uid-text">Mã định danh: {user.id}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="review-grid">
          
          {/* --- LEFT COLUMN: PERSONAL & IDENTITY --- */}
          <div className="inspection-column">
            <section className="inspection-section">
              <h4 className="section-title"><FaUserCircle /> THÔNG TIN CƠ BẢN</h4>
              <div className="review-data-card">
                <div className="data-row">
                  <span className="label">Họ và tên:</span>
                  <span className="value">{user.fullName}</span>
                </div>
                <div className="data-row">
                  <span className="label">Email:</span>
                  <span className="value highlight">{user.email}</span>
                </div>
                <div className="data-row">
                  <span className="label">Số điện thoại:</span>
                  <span className="value">{user.phone || 'N/A'}</span>
                </div>
                <div className="data-row">
                  <span className="label">Giới tính:</span>
                  <span className="value">{user.gender || 'N/A'}</span>
                </div>
                <div className="data-row">
                  <span className="label">Ngày sinh:</span>
                  <span className="value">
                    {user.birthDate ? new Date(user.birthDate).toLocaleDateString('vi-VN') : 'N/A'}
                  </span>
                </div>
              </div>
            </section>

            {/* IDENTITY SECTION: Only shows if user has submitted OCR data */}
            {user.identityInfo && (
              <section className="inspection-section" style={{ marginTop: '25px' }}>
                <h4 className="section-title"><FaIdCard /> XÁC MINH DANH TÍNH</h4>
                <div className="review-data-card">
                  <div className="data-row">
                    <span className="label">Số CCCD:</span>
                    <span className="value highlight">{user.identityInfo.cccdNumber}</span>
                  </div>
                  <div className="id-images-container">
                    <div className="img-wrapper">
                      <img 
                        src={user.identityInfo.frontImageUrl} 
                        alt="CCCD Front" 
                        onClick={() => window.open(user.identityInfo.frontImageUrl)} 
                      />
                    </div>
                    <div className="img-wrapper">
                      <img 
                        src={user.identityInfo.backImageUrl} 
                        alt="CCCD Back" 
                        onClick={() => window.open(user.identityInfo.backImageUrl)} 
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* --- RIGHT COLUMN: SHOP & ADMINISTRATION --- */}
          <div className="inspection-column">
            <section className="inspection-section">
              <h4 className="section-title"><FaStore /> HỒ SƠ KINH DOANH</h4>
              {user.shopProfile ? (
                <div className="review-data-card">
                  <div className="data-row">
                    <span className="label">Tên Shop:</span>
                    <span className="value shop-highlight">{user.shopProfile.shopName}</span>
                  </div>
                  <div className="data-row">
                    <span className="label">Mã số thuế:</span>
                    <span className="value">{user.shopProfile.taxCode || 'N/A'}</span>
                  </div>
                  <div className="data-row">
                    <span className="label">Địa chỉ Shop:</span>
                    <span className="value">{user.shopProfile.shopAddress || 'Chưa cập nhật'}</span>
                  </div>
                  {user.shopProfile.businessLicenseUrl && (
                    <div className="data-row" style={{ marginTop: '10px' }}>
                      <span className="label">Giấy phép KD:</span>
                      <a href={user.shopProfile.businessLicenseUrl} target="_blank" rel="noreferrer" className="admin-shop-nav-link">
                        Xem tài liệu <FaFileInvoice style={{marginLeft: '5px'}}/>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="review-data-card empty-state-card">
                  <FaStore className="empty-icon" />
                  <p>Người dùng này chưa đăng ký tài khoản bán hàng.</p>
                </div>
              )}
            </section>

            <section className="inspection-section" style={{ marginTop: '25px' }}>
              <h4 className="section-title"><FaTag /> QUẢN TRỊ HỆ THỐNG</h4>
              <div className="review-data-card">
                 <div className="data-row">
                    <span className="label">Trạng thái:</span>
                    <span className={`status-pill-colorful ${user.accountStatus?.toLowerCase()}`}>
                      {user.accountStatus}
                    </span>
                 </div>
                 <div className="data-row">
                    <span className="label">Ngày gia nhập:</span>
                    <span className="value">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</span>
                 </div>
                 {user.chatNote && (
                   <div className="admin-note-box" style={{marginTop: '15px', padding: '12px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '8px', fontSize: '12.5px'}}>
                      <strong style={{ display: 'block', marginBottom: '4px' }}>Ghi chú nội bộ:</strong> 
                      {user.chatNote}
                   </div>
                 )}
              </div>
            </section>
          </div>
        </div>

        <div className="modal-footer-actions">
          {/* 🚀 FIXED: Now using btn-inspect-close to match the safe CSS append */}
          <button className="btn-inspect-close" onClick={onClose}>
            <FaCheckCircle /> Đóng hồ sơ
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;