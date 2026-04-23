import React, { useState } from 'react'; 
import { 
  FaTimes, FaUserCircle, FaIdCard, FaStore, 
  FaEnvelope, FaCheckCircle, FaTag, FaFileInvoice,
  FaMapMarkedAlt, FaPhoneAlt, FaPassport, FaSearchPlus,
  FaUniversity 
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import './AdminDashboard.css';
import ainetsoftLogo from '../../assets/images/logo.png';

interface UserProfileModalProps {
  user: any;
  onClose: () => void;
}

/** 🚀 CÁC HÀM TIỆN ÍCH ĐỊNH DẠNG (PRESERVED) */
const formatPhone = (val: string) => {
  if (!val) return 'N/A';
  const s = val.replace(/\D/g, '');
  if (s.length <= 3) return s;
  if (s.length <= 6) return `${s.slice(0, 3)} ${s.slice(3)}`;
  return `${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6, 10)}`;
};

const formatCCCD = (val: string) => {
  if (!val) return 'N/A';
  const s = val.replace(/\D/g, '');
  return s.match(/.{1,3}/g)?.join(' ') || s;
};

const formatMST = (val: string) => {
  if (!val) return 'N/A';
  const s = val.replace(/\D/g, '');
  if (s.length <= 10) return s.match(/.{1,3}/g)?.join(' ') || s;
  return `${s.slice(0, 10).match(/.{1,3}/g)?.join(' ')}-${s.slice(10, 13)}`;
};

const getBusinessLabel = (type: string) => {
  if (type === 'INDIVIDUAL') return 'Cá nhân';
  if (type === 'HOUSEHOLD') return 'Hộ kinh doanh';
  if (type === 'ENTERPRISE') return 'Công ty';
  return type || 'Chưa cung cấp';
};

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose }) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const API_BASE_URL = "http://localhost:8080";

  const getFullImageUrl = (path: string | null | undefined) => {
    if (!path || path === "DEFAULT_LOGO" || path.trim() === "") return ainetsoftLogo;
    if (path.startsWith('data:image') || path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${cleanPath}`;
  };

  const getBankData = (userData: any) => {
    if (!userData) return null;
    return (
      userData.bankAccount || 
      userData.bankInfo ||
      (userData.bankAccounts && userData.bankAccounts.length > 0 ? userData.bankAccounts[0] : null) ||
      userData.shopProfile?.bankAccount
    );
  };

  if (!user) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      
      {zoomedImage && (
        <div className="image-zoom-overlay" onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }} style={{ zIndex: 2000 }}>
          <div className="zoom-content-wrapper">
             <button className="close-zoom-btn" onClick={() => setZoomedImage(null)}><FaTimes /></button>
             <img src={zoomedImage} alt="Zoomed" />
          </div>
        </div>
      )}

      <div className="seller-review-modal profile-inspection-modal animate-fade-in" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <div className="header-title">
            <FaUserCircle className="title-icon" />
            <div>
              <h3 className="modal-main-title">Hồ Sơ Chi Tiết Người Dùng</h3>
              <p className="user-uid-text">Mã định danh: {user.id}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="review-grid">
          <div className="inspection-column">
            {/* THÔNG TIN CƠ BẢN */}
            <section className="inspection-section">
              <h4 className="section-title"><FaUserCircle /> THÔNG TIN CƠ BẢN</h4>
              <div className="review-data-card">
                <div className="data-row"><span className="label">Họ và tên:</span><span className="value">{user.fullName}</span></div>
                <div className="data-row"><span className="label">Email:</span><span className="value highlight">{user.email}</span></div>
                <div className="data-row"><span className="label">Số điện thoại:</span><span className="value">{formatPhone(user.phone)}</span></div>
                <div className="data-row"><span className="label">Giới tính:</span><span className="value">{user.gender || 'N/A'}</span></div>
                <div className="data-row"><span className="label">Ngày sinh:</span><span className="value">{user.birthDate ? new Date(user.birthDate).toLocaleDateString('vi-VN') : 'N/A'}</span></div>
              </div>
            </section>

            {/* XÁC MINH DANH TÍNH */}
            {user.identityInfo && (
              <section className="inspection-section" style={{ marginTop: '25px' }}>
                <h4 className="section-title">
                  {user.identityInfo.identityType === 'PASSPORT' ? <FaPassport /> : <FaIdCard />} XÁC MINH DANH TÍNH
                </h4>
                <div className="review-data-card">
                  <div className="data-row">
                    <span className="label">Số {user.identityInfo.identityType === 'PASSPORT' ? 'Hộ chiếu' : 'CCCD'}:</span>
                    <span className="value highlight">{formatCCCD(user.identityInfo.cccdNumber)}</span>
                  </div>
                  <div className="id-images-container">
                    <div className="img-wrapper zoomable" onClick={() => setZoomedImage(getFullImageUrl(user.identityInfo.frontImageUrl))}>
                      <div className="zoom-hint"><FaSearchPlus /></div>
                      <img src={getFullImageUrl(user.identityInfo.frontImageUrl)} alt="ID Front" />
                      <span className="img-label-overlay">Mặt trước</span>
                    </div>
                    <div className="img-wrapper zoomable" onClick={() => setZoomedImage(getFullImageUrl(user.identityInfo.backImageUrl))}>
                      <div className="zoom-hint"><FaSearchPlus /></div>
                      <img src={getFullImageUrl(user.identityInfo.backImageUrl)} alt="ID Back" />
                      <span className="img-label-overlay">Mặt sau</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* KHO HÀNG & TỌA ĐỘ GPS */}
            {user.addresses && user.addresses.length > 0 && (
              <section className="inspection-section" style={{ marginTop: '25px' }}>
                <h4 className="section-title"><FaMapMarkedAlt /> KHO HÀNG & TỌA ĐỘ GPS</h4>
                <div className="address-review-list">
                  {user.addresses.map((addr: any, idx: number) => {
                    {/* 🚀 FIXED: Dùng URL chuẩn và sửa lỗi Syntax Error */}
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${addr.latitude},${addr.longitude}`;
                    
                    return (
                      <div key={idx} className="review-data-card mb-10" style={{ borderLeft: '4px solid #1d39c4' }}>
                        <strong>Kho {idx + 1}: {addr.receiverName}</strong>
                        <p style={{ fontSize: '11px', color: '#666' }}><FaPhoneAlt size={10} /> {formatPhone(addr.phone)}</p>
                        <p style={{ fontSize: '12px' }}>{addr.detail || addr.detailAddress || 'Chưa cung cấp'}</p>
                        {addr.latitude && (
                          <div className="qr-box-summary" style={{ background: '#f0f5ff', border: '1px solid #adc6ff', display: 'flex', alignItems: 'center', padding: '10px', gap: '15px', borderRadius: '4px', marginTop: '10px' }}>
                            <img style={{ width: '60px', height: '60px', background: 'white', padding: '2px' }} src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(mapsUrl)}`} alt="GPS QR" />
                            <div className="qr-info-text">
                               <strong style={{ color: '#1d39c4', fontSize: '11px' }}>GPS: {addr.latitude}, {addr.longitude}</strong>
                               <span className="btn-copy-action" style={{ fontSize: '10px', cursor: 'pointer', color: '#2f54eb', textDecoration: 'underline', display: 'block', marginTop: '4px' }} onClick={() => { navigator.clipboard.writeText(`${addr.latitude}, ${addr.longitude}`); toast.success("Đã chép tọa độ!"); }}>[Chép tọa độ]</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          <div className="inspection-column">
            {/* HỒ SƠ KINH DOANH */}
            <section className="inspection-section">
              <h4 className="section-title"><FaStore /> HỒ SƠ KINH DOANH</h4>
              {user.shopProfile ? (
                <div className="review-data-card">
                  <div className="data-row"><span className="label">Tên Shop:</span><span className="value shop-highlight">{user.shopProfile.shopName}</span></div>
                  <div className="data-row"><span className="label">Loại hình:</span><span className="value">{getBusinessLabel(user.shopProfile.businessType)}</span></div>
                  <div className="data-row"><span className="label">Mã số thuế:</span><span className="value highlight-green">{formatMST(user.shopProfile.taxCode)}</span></div>
                  <div className="data-row"><span className="label">Địa chỉ Shop:</span><span className="value">{user.shopProfile.shopAddress || 'Chưa cập nhật'}</span></div>
                  
                  <div className="license-preview-box" style={{ marginTop: '15px' }}>
                    <span className="label" style={{ display: 'block', marginBottom: '8px' }}>Giấy phép KD:</span>
                    
                    {user.shopProfile.businessLicenseUrl ? (
                      <div className="img-wrapper zoomable" 
                           style={{ height: '160px', width: '100%', border: '1px dashed #ddd', borderRadius: '4px', overflow: 'hidden', background: '#f9f9f9' }}
                           onClick={() => setZoomedImage(getFullImageUrl(user.shopProfile.businessLicenseUrl))}>
                        <div className="zoom-hint"><FaSearchPlus /></div>
                        <img src={getFullImageUrl(user.shopProfile.businessLicenseUrl)} 
                             alt="Business License" 
                             style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        <span className="img-label-overlay">Nhấn để phóng to</span>
                      </div>
                    ) : user.shopProfile.businessType === 'INDIVIDUAL' ? (
                      <div className="individual-license-fallback" style={{ height: '160px', width: '100%', border: '1px solid #eee', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                         <img 
                            src={ainetsoftLogo} 
                            alt="AiNetSoft Logo" 
                            style={{ width: '180px', opacity: 0.8, marginBottom: '12px', objectFit: 'contain' }} 
                         />
                         <p style={{ fontSize: '13px', color: '#999', fontWeight: 500, margin: 0 }}>
                            Đối tượng Cá nhân không bắt buộc Giấy phép
                         </p>
                      </div>
                    ) : (
                      <div className="empty-license-placeholder" style={{ padding: '20px', textAlign: 'center', background: '#fafafa', border: '1px solid #eee', borderRadius: '4px' }}>
                        <FaFileInvoice style={{ fontSize: '24px', color: '#bfbfbf', marginBottom: '8px' }} />
                        <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>Chưa tải lên giấy phép</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="review-data-card empty-state-card">
                  <FaStore className="empty-icon" />
                  <p>Người dùng này chưa có hồ sơ bán hàng.</p>
                </div>
              )}
            </section>

            {/* TÀI KHOẢN THỤ HƯỞNG */}
            <section className="inspection-section" style={{ marginTop: '25px' }}>
              <h4 className="section-title"><FaUniversity /> TÀI KHOẢN THỤ HƯỞNG</h4>
              <div className="review-data-card bank-card">
                {getBankData(user) ? (
                  <>
                    <div className="data-row"><span className="label">Ngân hàng:</span><span className="value">{getBankData(user).bankName}</span></div>
                    <div className="data-row"><span className="label">Số tài khoản:</span><span className="value mono">{getBankData(user).accountNumber}</span></div>
                    <div className="data-row"><span className="label">Chủ tài khoản:</span><span className="value uppercase">{getBankData(user).accountHolder}</span></div>
                  </>
                ) : (
                  <p className="empty-text" style={{ fontSize: '12px', color: '#999', fontStyle: 'italic', textAlign: 'center', padding: '10px' }}>Chưa cung cấp thông tin ngân hàng</p>
                )}
              </div>
            </section>

            {/* QUẢN TRỊ HỆ THỐNG */}
            <section className="inspection-section" style={{ marginTop: '25px' }}>
              <h4 className="section-title"><FaTag /> QUẢN TRỊ HỆ THỐNG</h4>
              <div className="review-data-card">
                 <div className="data-row">
                   <span className="label">Trạng thái tài khoản:</span>
                   <span className={`status-pill-colorful ${user.accountStatus?.toLowerCase()}`}>{user.accountStatus}</span>
                 </div>
                 {/* 🚀 NEW: Hiển thị trạng thái xác minh Người bán cụ thể (ví dụ: REVOKED) */}
                 <div className="data-row">
                   <span className="label">Xác minh Người bán:</span>
                   <span className={`status-pill-colorful ${user.sellerVerification?.toLowerCase() || 'none'}`}>
                     {user.sellerVerification || 'CHƯA ĐĂNG KÝ'}
                   </span>
                 </div>
                 <div className="data-row"><span className="label">Ngày gia nhập:</span><span className="value">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</span></div>
              </div>
            </section>
          </div>
        </div>

        <div className="modal-footer-actions">
          <button className="btn-inspect-close" onClick={onClose}>
            <FaCheckCircle /> Đóng hồ sơ
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;