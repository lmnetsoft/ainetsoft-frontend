import React, { useState } from 'react'; 
import { 
  FaTimes, FaUserCircle, FaIdCard, FaStore, 
  FaEnvelope, FaCheckCircle, FaTag, FaFileInvoice,
  FaMapMarkedAlt, FaPhoneAlt, FaPassport, FaSearchPlus 
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import './AdminDashboard.css';
import ainetsoftLogo from '../../assets/images/logo.png';

interface UserProfileModalProps {
  user: any;
  onClose: () => void;
}

/** 🚀 CÁC HÀM TIỆN ÍCH ĐỊNH DẠNG */
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

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose }) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const API_BASE_URL = "http://localhost:8080";

  /** 🚀 GIẢI QUYẾT ĐƯỜNG DẪN ẢNH */
  const getFullImageUrl = (path: string | null | undefined) => {
    if (!path || path === "DEFAULT_LOGO" || path.trim() === "") return ainetsoftLogo; 
    if (path.startsWith('data:image') || path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${cleanPath}`;
  };

  if (!user) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      
      {/* 🚀 POPUP PHÓNG TO ẢNH (Dùng chung cho CCCD và GPKD) */}
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

            {/* XÁC MINH DANH TÍNH (PREVIEW CCCD) */}
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

            {/* KHO HÀNG & GPS */}
            {user.addresses && user.addresses.length > 0 && (
              <section className="inspection-section" style={{ marginTop: '25px' }}>
                <h4 className="section-title"><FaMapMarkedAlt /> KHO HÀNG & TỌA ĐỘ GPS</h4>
                <div className="address-review-list">
                  {user.addresses.map((addr: any, idx: number) => {
                    const mapsUrl = `http://googleusercontent.com/maps.google.com/${addr.latitude},${addr.longitude}`;
                    return (
                      <div key={idx} className="review-data-card mb-10" style={{ borderLeft: '4px solid #1d39c4' }}>
                        <strong>Kho {idx + 1}: {addr.receiverName}</strong>
                        <p style={{ fontSize: '11px', color: '#666' }}><FaPhoneAlt size={10} /> {formatPhone(addr.phone)}</p>
                        <p style={{ fontSize: '12px' }}>{[addr.detail, addr.ward, addr.province].filter(Boolean).join(', ')}</p>
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
            {/* HỒ SƠ KINH DOANH (PREVIEW GPKD MỚI) */}
            <section className="inspection-section">
              <h4 className="section-title"><FaStore /> HỒ SƠ KINH DOANH</h4>
              {user.shopProfile ? (
                <div className="review-data-card">
                  <div className="data-row"><span className="label">Tên Shop:</span><span className="value shop-highlight">{user.shopProfile.shopName}</span></div>
                  <div className="data-row"><span className="label">Mã số thuế:</span><span className="value highlight-green">{formatMST(user.shopProfile.taxCode)}</span></div>
                  <div className="data-row"><span className="label">Địa chỉ Shop:</span><span className="value">{user.shopProfile.shopAddress || 'Chưa cập nhật'}</span></div>
                  
                  {/* 🚀 THAY ĐỔI: Thêm Preview ảnh cho Giấy phép KD thay vì link text */}
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

            <section className="inspection-section" style={{ marginTop: '25px' }}>
              <h4 className="section-title"><FaTag /> QUẢN TRỊ HỆ THỐNG</h4>
              <div className="review-data-card">
                 <div className="data-row"><span className="label">Trạng thái:</span><span className={`status-pill-colorful ${user.accountStatus?.toLowerCase()}`}>{user.accountStatus}</span></div>
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