import React, { useState, useEffect } from 'react';
import adminService from '../../services/admin.service';
import { toast } from 'react-hot-toast';
import { 
  FaEye, FaCheck, FaTimes, FaIdCard, FaUniversity, 
  FaStore, FaFileInvoice, FaUserClock, FaHistory, FaSearchPlus,
  FaMapMarkedAlt, FaQrcode, FaCopy, FaDownload, FaPrint, FaEnvelope,
  FaFileInvoiceDollar, FaPassport 
} from 'react-icons/fa';
import './AdminDashboard.css'; 

// Import logo for fallback and PDF header
import ainetsoftLogo from '../../assets/images/logo.png'; 

/** * NUMBER FORMATTING UTILITIES */
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
  const groups = s.match(/.{1,3}/g);
  return groups ? groups.join(' ') : s;
};

// --- NEW: PASSPORT FORMATTER (J-1111-1111) ---
const formatPassport = (val: string) => {
  if (!val) return 'N/A';
  const s = val.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (s.length === 0) return '';
  let res = s.charAt(0); // The leading letter
  if (s.length > 1) res += '-' + s.slice(1, 5); // Dash then 4 digits
  if (s.length > 5) res += '-' + s.slice(5, 9); // Dash then remaining digits
  return res;
};

const formatMST = (val: string) => {
  if (!val) return 'N/A';
  const s = val.replace(/\D/g, '');
  if (s.length <= 10) {
    const groups = s.match(/.{1,3}/g);
    return groups ? groups.join(' ') : s;
  }
  const main = s.slice(0, 10);
  const branch = s.slice(10, 13);
  const mainGroups = main.match(/.{1,3}/g);
  return `${mainGroups ? mainGroups.join(' ') : main}-${branch}`;
};

const SellerModeration = () => {
  const [pendingSellers, setPendingSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const API_BASE_URL = "http://localhost:8080";

  const getFullImageUrl = (path: string | null | undefined) => {
    if (!path || path === "DEFAULT_LOGO" || path.trim() === "") return ainetsoftLogo; 
    if (path.startsWith('data:image') || path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${cleanPath}`;
  };

  /**
   * PDF SUMMARY GENERATOR
   * FIXED: Correct Labeling for Passport in PDF and working QR URL
   */
  const printApprovalSummary = (seller: any, note: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateStr = new Date().toLocaleString('vi-VN');
    const isPassport = seller.identityInfo?.identityType === 'PASSPORT';
    const idLabel = isPassport ? "Hộ chiếu" : "CCCD";
    
    // RESTORED: PASSPORT MASKING IN PDF
    const idValue = isPassport 
      ? formatPassport(seller.identityInfo?.cccdNumber) 
      : formatCCCD(seller.identityInfo?.cccdNumber);

    const addressesHtml = (seller.addresses || []).map((addr: any, i: number) => {
      const hasGPS = addr.latitude && String(addr.latitude).trim() !== '' && 
                     addr.longitude && String(addr.longitude).trim() !== '';
      
      // FIXED: Official Google Maps Search URL to prevent 404
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${addr.latitude},${addr.longitude}`;

      const gpsContent = hasGPS ? `
        <span style="color: #1d39c4;">GPS: ${addr.latitude}, ${addr.longitude}</span><br/>
        <div style="margin-top: 10px;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(mapsUrl)}" 
               style="width: 70px; height: 70px; border: 1px solid #ddd; padding: 2px;" />
        </div>
      ` : '';

      return `
        <div style="border: 1px solid #eee; padding: 10px; margin-top: 10px;">
          <strong>Kho ${i + 1}:</strong> ${addr.receiverName} | ${formatPhone(addr.phone)}<br/>
          ${addr.detail}, ${addr.ward}, ${addr.province}<br/>
          ${gpsContent}
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Biên Bản Phê Duyệt - ${seller.fullName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ee4d2d; padding-bottom: 20px; }
            .status-stamp { color: #52c41a; border: 3px solid #52c41a; padding: 10px 20px; font-weight: bold; text-transform: uppercase; border-radius: 8px; transform: rotate(-5deg); }
            section { margin-top: 30px; }
            h2 { color: #ee4d2d; font-size: 18px; border-left: 4px solid #ee4d2d; padding-left: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .footer { margin-top: 50px; text-align: right; font-style: italic; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div><h1 style="margin:0; color:#ee4d2d;">AiNetsoft</h1><p style="margin:0;">Hệ thống Thương mại Điện tử</p></div>
            <div class="status-stamp">Đã Phê Duyệt</div>
          </div>
          <section>
            <p><strong>Ngày thực hiện:</strong> ${dateStr}</p>
            <p><strong>Mã định danh hệ thống:</strong> ${seller.id}</p>
          </section>
          <div class="grid">
            <section>
              <h2>Thông tin Người bán</h2>
              <p><strong>Họ tên:</strong> ${seller.fullName}</p>
              <p><strong>Email đăng ký:</strong> ${seller.email}</p>
              <p><strong>SĐT:</strong> ${formatPhone(seller.phone)}</p>
              <p><strong>Số ${idLabel}:</strong> ${idValue}</p>
            </section>
            <section>
              <h2>Thông tin Kinh doanh</h2>
              <p><strong>Tên Shop:</strong> ${seller.shopProfile?.shopName}</p>
              <p><strong>Email nhận hóa đơn:</strong> ${seller.shopProfile?.invoiceEmails?.join(', ') || 'Chưa cung cấp'}</p>
              <p><strong>Mã số thuế:</strong> ${formatMST(seller.shopProfile?.taxCode)}</p>
              <p><strong>Loại hình:</strong> ${getBusinessLabel(seller.shopProfile?.businessType)}</p>
            </section>
          </div>
          <section>
            <h2>Vị trí Kho hàng & GPS</h2>
            ${addressesHtml}
          </section>
          <section style="background: #f9f9f9; padding: 20px; border-radius: 4px; border-left: 4px solid #8c8c8c;">
            <h2>Ghi chú của Admin</h2>
            <p>${note}</p>
          </section>
          <div class="footer">Tài liệu được tạo tự động bởi Hệ thống AiNetsoft.<br/>Người phê duyệt: Quản trị viên Toàn cầu</div>
          <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const fetchPending = async () => {
    try {
      setLoading(true);
      const data = await adminService.getPendingSellers();
      setPendingSellers(Array.isArray(data) ? data : data?.users || []);
    } catch (err) { toast.error("Lỗi tải danh sách."); } finally { setLoading(false); }
  };

  const openReview = async (userId: string) => {
    try {
      const details = await adminService.getSellerDetails(userId);
      setSelectedSeller(details);
      setShowModal(true);
    } catch (err) { toast.error("Lỗi tải chi tiết."); }
  };

  const triggerSuccessAnimation = (msg: string) => {
    setSuccessMsg(msg);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleAction = async (approved: boolean) => {
    if (!adminNote.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi.");
      return;
    }
    try {
      setIsProcessing(true);
      await adminService.approveSeller(selectedSeller.id, approved, adminNote);
      if (approved) printApprovalSummary(selectedSeller, adminNote);
      setShowModal(false);
      triggerSuccessAnimation(approved ? "Đã phê duyệt người bán!" : "Đã từ chối hồ sơ");
      setAdminNote('');
      fetchPending(); 
    } catch (err) {
      toast.error("Thao tác thất bại.");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  return (
    <div className="admin-moderation-page">
      {zoomedImage && (
        <div className="image-zoom-overlay" onClick={() => setZoomedImage(null)}>
          <div className="zoom-content-wrapper">
             <button className="close-zoom-btn" onClick={() => setZoomedImage(null)}><FaTimes /></button>
             <img src={zoomedImage} alt="Zoom" />
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="success-animation-overlay">
          <div className="success-checkmark-card">
            <div className="check-icon-wrapper"><FaCheck /></div>
            <h3>Hoàn tất!</h3>
            <p>{successMsg}</p>
          </div>
        </div>
      )}

      <div className="admin-page-header">
        <div className="header-icon-wrap"><FaUserClock className="main-icon" /></div>
        <div className="header-text">
          <h2>Phê duyệt Người bán</h2>
          <p>Đối soát định danh, mã số thuế và vị trí kho hàng GPS</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner-wrap"><div className="spinner"></div><p>Đang tải...</p></div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Thông tin liên hệ</th>
                <th>Ngày yêu cầu</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pendingSellers.length > 0 ? pendingSellers.map(seller => (
                <tr key={seller.id}>
                  <td>
                    <div className="user-profile-cell">
                      <div className="moderation-avatar-wrapper"><img src={getFullImageUrl(seller.avatarUrl)} alt="avatar" /></div>
                      <div className="user-meta-info">
                        <strong>{seller.fullName || 'Người dùng'}</strong>
                        <span>ID: {seller.id?.substring(0, 8)}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-details-box">
                      <p className="contact-email">{seller.email}</p>
                      <p className="contact-phone">{formatPhone(seller.phone)}</p>
                    </div>
                  </td>
                  <td>
                    <div className="moderation-date-cell"><FaHistory className="date-icon" /> {new Date(seller.updatedAt || seller.createdAt || Date.now()).toLocaleDateString('vi-VN')}</div>
                  </td>
                  <td><span className="status-badge-pending">Chờ duyệt</span></td>
                  <td>
                    <button onClick={() => openReview(seller.id)} className="btn-action-view">
                      <FaEye /> <span>Xem hồ sơ</span>
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="empty-table-msg">Hiện không có yêu cầu nâng cấp nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && selectedSeller && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content seller-review-modal">
            <div className="modal-header">
              <div className="header-title">
                <FaStore className="title-icon" />
                <h3>Thẩm định hồ sơ: {selectedSeller.fullName}</h3>
              </div>
              <div style={{display:'flex', gap: '10px'}}>
                <button className="btn-print-summary" title="Tải biên bản" onClick={() => printApprovalSummary(selectedSeller, adminNote)}>
                  <FaDownload />
                </button>
                <button className="close-btn" onClick={() => setShowModal(false)}><FaTimes /></button>
              </div>
            </div>

            <div className="modal-body review-grid">
              {/* Identity Section */}
              <div className="review-section">
                <h4 className="section-title">
                   {selectedSeller.identityInfo?.identityType === 'PASSPORT' ? <FaPassport /> : <FaIdCard />}
                   {selectedSeller.identityInfo?.identityType === 'PASSPORT' ? ' Hồ sơ Hộ chiếu' : ' Hồ sơ CCCD'}
                </h4>
                <div className="review-data-card">
                  <div className="data-row">
                    <span className="label">Số {selectedSeller.identityInfo?.identityType === 'PASSPORT' ? 'Hộ chiếu' : 'CCCD'}:</span>
                    <span className="value highlight">
                       {/* FIXED: DYNAMIC PASSPORT FORMATTING */}
                       {selectedSeller.identityInfo?.identityType === 'PASSPORT' 
                         ? formatPassport(selectedSeller.identityInfo?.cccdNumber) 
                         : formatCCCD(selectedSeller.identityInfo?.cccdNumber)}
                    </span>
                  </div>
                  <div className="id-images-container">
                    {['front', 'back'].map(side => (
                      <div key={side} className="id-image-item">
                        <span className="img-label">{side === 'front' ? 'Mặt trước' : 'Mặt sau'}</span>
                        <div className="img-wrapper zoomable" onClick={() => setZoomedImage(getFullImageUrl(selectedSeller.identityInfo?.[`${side}ImageUrl`]))}>
                          <div className="zoom-hint"><FaSearchPlus /></div>
                          <img src={getFullImageUrl(selectedSeller.identityInfo?.[`${side}ImageUrl`])} alt="Identity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <h4 className="section-title" style={{marginTop: '25px'}}><FaMapMarkedAlt /> KHO LẤY HÀNG & TỌA ĐỘ GPS</h4>
                <div className="address-review-list">
                  {(selectedSeller.addresses || []).map((addr: any, idx: number) => {
                    const hasCoords = addr.latitude && String(addr.latitude).trim() !== '' && 
                                      addr.longitude && String(addr.longitude).trim() !== '';

                    return (
                      <div key={idx} className="review-data-card mb-10" style={{borderLeft: '4px solid #1d39c4'}}>
                        <strong>Kho {idx + 1}: {addr.receiverName} | {formatPhone(addr.phone)}</strong>
                        <p style={{fontSize: '12px', margin: '5px 0'}}>{[addr.detail, addr.ward, addr.province].filter(Boolean).join(', ')}</p>
                        
                        {hasCoords ? (
                          <div className="qr-box-summary" style={{background: '#f0f5ff', border: '1px solid #adc6ff', display: 'flex', alignItems: 'center', padding: '10px', gap: '15px', borderRadius: '4px'}}>
                            {/* FIXED: Official Google Maps Search URL for mobile scanning */}
                            <img className="qr-code-img" 
                                 style={{width: '70px', height: '70px', background: 'white', padding: '2px'}}
                                 src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://www.google.com/maps/search/?api=1&query=${addr.latitude},${addr.longitude}`)}`} 
                                 alt="QR" />
                            <div className="qr-info-text">
                               <strong style={{color: '#1d39c4', fontSize: '12px'}}>Tọa độ: {addr.latitude}, {addr.longitude}</strong>
                               <p style={{fontSize: '10px', color: '#666', margin: '4px 0'}}>Quét QR để đối soát vị trí thực tế trên Google Maps.</p>
                               <span className="btn-copy-action" style={{fontSize: '11px', cursor: 'pointer', color: '#2f54eb', textDecoration: 'underline'}} onClick={() => { navigator.clipboard.writeText(`${addr.latitude}, ${addr.longitude}`); toast.success("Đã chép tọa độ!"); }}>[Chép tọa độ]</span>
                            </div>
                          </div>
                        ) : (
                          <p style={{fontSize: '11px', color: '#999', fontStyle: 'italic', marginTop: '5px'}}>(Chưa cập nhật tọa độ GPS)</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Business Section */}
              <div className="review-section">
                <h4 className="section-title"><FaStore /> THÔNG TIN KINH DOANH</h4>
                <div className="review-data-card mb-20">
                  <div className="data-row"><span className="label">Tên Shop:</span><span className="value">{selectedSeller.shopProfile?.shopName}</span></div>
                  <div className="data-row"><span className="label">Loại hình:</span><span className="value">{getBusinessLabel(selectedSeller.shopProfile?.businessType)}</span></div>
                  
                  <div className="data-row"><span className="label"><FaEnvelope /> Email liên hệ:</span><span className="value">{selectedSeller.shopProfile?.businessEmail || selectedSeller.email}</span></div>
                  
                  <div className="data-row">
                    <span className="label"><FaFileInvoiceDollar /> Email nhận hóa đơn:</span>
                    <span className="value" style={{fontSize: '12px', color: '#ee4d2d'}}>
                      {selectedSeller.shopProfile?.invoiceEmails?.length > 0 ? selectedSeller.shopProfile.invoiceEmails.join(', ') : 'Chưa cung cấp'}
                    </span>
                  </div>

                  <div className="data-row"><span className="label"><FaFileInvoice /> Mã số thuế:</span><span className="value highlight-green">{formatMST(selectedSeller.shopProfile?.taxCode)}</span></div>
                  
                  <div className="license-inspect-box" style={{marginTop: '15px'}}>
                     <span className="img-label">Giấy phép kinh doanh:</span>
                     <div className="img-wrapper zoomable" style={{height: '140px', border: '1px dashed #ddd', borderRadius: '4px', overflow: 'hidden'}} onClick={() => setZoomedImage(getFullImageUrl(selectedSeller.shopProfile?.businessLicenseUrl))}>
                        <div className="zoom-hint"><FaSearchPlus /></div>
                        <img 
                          src={selectedSeller.shopProfile?.businessType === 'INDIVIDUAL' ? ainetsoftLogo : (selectedSeller.shopProfile?.businessLicenseUrl ? getFullImageUrl(selectedSeller.shopProfile.businessLicenseUrl) : ainetsoftLogo)} 
                          alt="License" 
                          style={{width: '100%', height: '100%', objectFit: 'contain'}} 
                          onError={(e) => { e.currentTarget.src = ainetsoftLogo; }}
                        />
                     </div>
                  </div>
                </div>

                <h4 className="section-title"><FaUniversity /> TÀI KHOẢN THỤ HƯỞNG</h4>
                <div className="review-data-card bank-card">
                  {selectedSeller.bankAccounts?.length > 0 ? (
                    <>
                      <div className="data-row"><span className="label">Ngân hàng:</span><span className="value">{selectedSeller.bankAccounts[0].bankName}</span></div>
                      <div className="data-row"><span className="label">Số tài khoản:</span><span className="value mono">{selectedSeller.bankAccounts[0].accountNumber}</span></div>
                      <div className="data-row"><span className="label">Chủ tài khoản:</span><span className="value uppercase">{selectedSeller.bankAccounts[0].accountHolder}</span></div>
                    </>
                  ) : <p className="empty-text">Chưa cung cấp</p>}
                </div>
              </div>
            </div>

            <div className="modal-footer-actions">
              <div className="note-area">
                <label>Phản hồi cho người dùng <span style={{color: 'red'}}>*</span>:</label>
                <textarea placeholder="Ghi chú phản hồi (Bắt buộc)..." value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
              </div>
              <div className="button-group">
                <button className="btn-reject-modal" onClick={() => handleAction(false)} disabled={isProcessing}>Từ chối</button>
                <button className="btn-approve-modal" onClick={() => handleAction(true)} disabled={isProcessing}>{isProcessing ? 'Đang xử lý...' : 'Phê duyệt & Tải biên bản'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getBusinessLabel = (type: string) => {
  if (type === 'INDIVIDUAL') return 'Cá nhân';
  if (type === 'HOUSEHOLD') return 'Hộ kinh doanh';
  if (type === 'ENTERPRISE') return 'Công ty';
  return type;
};

export default SellerModeration;