import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  FaSave, FaShieldAlt, FaFileContract, FaHistory, FaCheckCircle, 
  FaBuilding, FaYoutube, FaFacebook, FaToggleOn, FaToggleOff, 
  FaGlobe, FaCertificate, FaGavel, FaBullhorn, FaExternalLinkAlt, FaImage
} from 'react-icons/fa';
import './SystemContentManagement.css';

const SLUGS_MAP = [
  { slug: 'privacy', label: 'Chính Sách Bảo Mật', cat: 'legal', icon: <FaShieldAlt style={{color: '#2f54eb'}}/> },
  { slug: 'terms', label: 'Điều Khoản Sử Dụng', cat: 'legal', icon: <FaGavel style={{color: '#13c2c2'}}/> },
  { slug: 'shipping-policy', label: 'Chính Sách Vận Chuyển', cat: 'legal', icon: <FaFileContract style={{color: '#722ed1'}}/> },
  { slug: 'return-policy', label: 'Chính Sách Trả Hàng', cat: 'legal', icon: <FaBullhorn style={{color: '#eb2f96'}}/> },
  
  { slug: 'footer_company_name', label: 'Tên Công Ty', cat: 'company' },
  { slug: 'footer_address', label: 'Địa chỉ trụ sở', cat: 'company' },
  { slug: 'footer_hotline', label: 'Hotline / CSKH', cat: 'company' },
  { slug: 'footer_representative', label: 'Người đại diện', cat: 'company' },
  { slug: 'footer_tax_code', label: 'Mã số thuế', cat: 'company' },
  { slug: 'footer_registration_date', label: 'Ngày cấp đăng ký', cat: 'company' },
  { slug: 'footer_issuing_agency', label: 'Nơi cấp đăng ký', cat: 'company' },

  { slug: 'social_youtube', label: 'Link YouTube', cat: 'social', icon: <FaYoutube style={{color: '#ff4d4f'}}/> },
  { slug: 'social_facebook', label: 'Link Facebook', cat: 'social', icon: <FaFacebook style={{color: '#1890ff'}}/> },
  { slug: 'footer_badge_1', label: 'Badge BCT 1 (Link)', cat: 'social', isToggleable: true, icon: <FaCertificate style={{color: '#faad14'}}/> },
  { slug: 'footer_badge_2', label: 'Badge BCT 2 (Link)', cat: 'social', isToggleable: true, icon: <FaCertificate style={{color: '#faad14'}}/> },
  { slug: 'footer_badge_3', label: 'Badge BCT 3 / Icon Phụ', cat: 'social', isToggleable: true, icon: <FaCertificate style={{color: '#ff4d4f'}}/> }
];

const SystemContentManagement = () => {
  const { category } = useParams(); 
  const [selectedSlug, setSelectedSlug] = useState('privacy');
  const [content, setContent] = useState({ title: '', htmlContent: '', lastUpdated: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Helper to parse Badge JSON data safely
  const getBadgeData = (raw: string) => {
    const clean = raw.replace('DISABLED_', '');
    try {
      const parsed = JSON.parse(clean);
      return { img: parsed.img || '', link: parsed.link || '' };
    } catch (e) {
      return { img: clean, link: '' }; 
    }
  };

  const filteredSlugs = SLUGS_MAP.filter(item => {
    if (category === 'legal') return item.cat === 'legal';
    return item.cat === 'company' || item.cat === 'social';
  });

  useEffect(() => {
    if (filteredSlugs.length > 0) {
      setSelectedSlug(filteredSlugs[0].slug);
    }
  }, [category]);

  useEffect(() => {
    fetchContent(selectedSlug);
  }, [selectedSlug]);

  const fetchContent = async (slug: string) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/admin/system-contents/${slug}`);
      setContent(res.data || { title: '', htmlContent: '', lastUpdated: '' });
    } catch (e) {
      toast.error("Không thể tải nội dung: " + slug);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBadge = () => {
    const isCurrentlyDisabled = content.htmlContent.startsWith('DISABLED_');
    const newVal = isCurrentlyDisabled 
      ? content.htmlContent.replace('DISABLED_', '') 
      : `DISABLED_${content.htmlContent}`;
    setContent({ ...content, htmlContent: newVal });
  };

  const handleSave = async () => {
    if (!content.title.trim() || !content.htmlContent.trim()) {
      toast.error("Vui lòng không để trống dữ liệu.");
      return;
    }

    try {
      setIsSaving(true);
      await api.post('/admin/system-contents', {
        ...content,
        slug: selectedSlug,
        lastUpdated: new Date()
      });
      toast.success("Đã cập nhật dữ liệu thành công!");
      fetchContent(selectedSlug);
    } catch (e) {
      toast.error("Lỗi khi lưu nội dung.");
    } finally {
      setIsSaving(false);
    }
  };

  const currentMetadata = SLUGS_MAP.find(s => s.slug === selectedSlug);
  const isBadge = currentMetadata?.isToggleable;
  const badgeData = getBadgeData(content.htmlContent);

  return (
    <div className="admin-content-mgmt">
      <div className="mgmt-header">
        <h2>
          {category === 'legal' ? (
            <><FaShieldAlt style={{color: '#2f54eb', marginRight: '12px'}} /> Quản lý Chính sách Pháp lý</>
          ) : (
            <><FaBuilding style={{color: '#52c41a', marginRight: '12px'}} /> Cấu hình Hệ thống</>
          )}
        </h2>
        <p>{category === 'legal' ? 'Cập nhật các quy định bảo mật và điều khoản.' : 'Thiết lập thông tin công ty và các chứng nhận.'}</p>
      </div>

      <div className="mgmt-main-layout">
        <div className="slug-sidebar">
          {filteredSlugs.map(item => (
            <button key={item.slug} className={`slug-btn ${selectedSlug === item.slug ? 'active' : ''}`} onClick={() => setSelectedSlug(item.slug)}>
              {item.icon || <FaFileContract style={{color: '#8c8c8c'}} />}
              {item.label}
            </button>
          ))}
        </div>

        <div className="editor-card">
          {isLoading ? ( <div className="loading-state">Đang truy xuất...</div> ) : (
            <>
              {/* 🚀 NEW CLEANER PILL TOGGLE */}
              {isBadge && (
                <div className="toggle-wrapper">
                  <label className="toggle-label">Trạng thái hiển thị công khai:</label>
                  <div className="toggle-control" onClick={handleToggleBadge}>
                    {content.htmlContent.startsWith('DISABLED_') ? (
                      <div className="badge-status-pill off">
                        <FaToggleOff className="toggle-icon" /> <span>ĐANG ẨN</span>
                      </div>
                    ) : (
                      <div className="badge-status-pill on">
                        <FaToggleOn className="toggle-icon" /> <span>ĐANG HIỆN</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="input-group">
                <label>Tiêu đề quản lý</label>
                <input type="text" value={content.title} onChange={(e) => setContent({...content, title: e.target.value})} />
              </div>

              {isBadge ? (
                /* DUAL FIELDS WITH INTERNAL SPACING */
                <div className="badge-fields-container">
                  <div className="input-group">
                    <label><FaImage /> Đường dẫn ảnh Logo (CDN/Upload URL)</label>
                    <input 
                      type="text" 
                      value={badgeData.img} 
                      placeholder="URL logo ví dụ: http://localhost:8080/uploads/system/logo.png"
                      onChange={(e) => {
                        const newJson = JSON.stringify({ img: e.target.value, link: badgeData.link });
                        setContent({ ...content, htmlContent: content.htmlContent.startsWith('DISABLED_') ? `DISABLED_${newJson}` : newJson });
                      }}
                    />
                  </div>
                  <div className="input-group">
                    <label><FaExternalLinkAlt /> Link điều hướng khi nhấn vào Logo (BCT Link)</label>
                    <input 
                      type="text" 
                      value={badgeData.link} 
                      placeholder="Link đích ví dụ: http://online.gov.vn/..."
                      onChange={(e) => {
                        const newJson = JSON.stringify({ img: badgeData.img, link: e.target.value });
                        setContent({ ...content, htmlContent: content.htmlContent.startsWith('DISABLED_') ? `DISABLED_${newJson}` : newJson });
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="input-group">
                  <label>Nội dung hiển thị {category === 'legal' ? '(Mã HTML)' : ''}</label>
                  <textarea 
                    className={category === 'legal' ? "html-textarea" : "simple-textarea"}
                    value={content.htmlContent.replace('DISABLED_', '')}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setContent({ ...content, htmlContent: content.htmlContent.startsWith('DISABLED_') ? `DISABLED_${raw}` : raw });
                    }}
                  />
                </div>
              )}

              <div className="editor-footer">
                <div className="last-sync"><FaHistory /> Cập nhật: {content.lastUpdated ? new Date(content.lastUpdated).toLocaleString('vi-VN') : 'Mới'}</div>
                <button className="btn-save-content" onClick={handleSave} disabled={isSaving}>{isSaving ? "Đang xử lý..." : <><FaSave /> Lưu thay đổi</>}</button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="preview-section">
        <h3><FaCheckCircle style={{color: '#52c41a'}} /> Xem trước thực tế</h3>
        <div className="preview-container">
          {isBadge ? (
             <div className={`badge-preview ${content.htmlContent.startsWith('DISABLED_') ? 'preview-hidden' : ''}`}>
               {content.htmlContent.startsWith('DISABLED_') && <div className="hidden-overlay">LOGO ĐANG TẮT</div>}
               <a href={badgeData.link} target="_blank" rel="noreferrer">
                 <img src={badgeData.img} alt="Badge Preview" onError={(e) => e.currentTarget.src = "https://via.placeholder.com/150x50?text=Image+Error"} />
               </a>
               {badgeData.link && <p className="preview-link-hint">Sẽ mở: {badgeData.link}</p>}
             </div>
          ) : (
            <div className="preview-box" dangerouslySetInnerHTML={{ __html: content.htmlContent.replace('DISABLED_', '') || 'Chưa có nội dung...' }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemContentManagement;