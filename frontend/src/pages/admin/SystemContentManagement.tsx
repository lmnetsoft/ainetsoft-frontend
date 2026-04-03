import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom'; 
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  FaSave, FaShieldAlt, FaFileContract, FaHistory, FaCheckCircle, 
  FaBuilding, FaYoutube, FaFacebook, FaToggleOn, FaToggleOff, 
  FaCertificate, FaGavel, FaBullhorn, FaExternalLinkAlt, FaImage,
  FaPlus, FaEdit, FaMobileAlt, FaLink, FaTrash, FaFileAlt 
} from 'react-icons/fa';

// React 19 Compatible Editor
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

import './SystemContentManagement.css';

const FIXED_SLUGS = [
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
  { slug: 'footer_badge_3', label: 'Badge BCT 3 / Icon Phụ', cat: 'social', isToggleable: true, icon: <FaCertificate style={{color: '#ff4d4f'}}/> },

  { slug: 'app_qr_code', label: 'App: QR Code', cat: 'social', isToggleable: true, icon: <FaMobileAlt style={{color: '#52c41a'}}/> },
  { slug: 'app_ios_link', label: 'App: iOS Store', cat: 'social', isToggleable: true, icon: <FaMobileAlt style={{color: '#1890ff'}}/> },
  { slug: 'app_android_link', label: 'App: Android Store', cat: 'social', isToggleable: true, icon: <FaMobileAlt style={{color: '#52c41a'}}/> }
];

const SystemContentManagement = () => {
  const { category } = useParams(); 
  const location = useLocation(); 
  
  const [selectedSlug, setSelectedSlug] = useState('');
  const [content, setContent] = useState({ slug: '', title: '', htmlContent: '', lastUpdated: '' });
  const [customArticles, setCustomArticles] = useState<any[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isArticleMode = location.pathname.includes('/admin/articles');
  const isCustomArticle = !FIXED_SLUGS.some(s => s.slug === selectedSlug);

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'color': []}, {'background': []}],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const getBadgeData = (raw: string) => {
    const clean = raw.replace('DISABLED_', '');
    try {
      const parsed = JSON.parse(clean);
      return { img: parsed.img || '', link: parsed.link || '' };
    } catch (e) {
      return { img: clean, link: '' }; 
    }
  };

  const filteredFixedSlugs = FIXED_SLUGS.filter(item => {
    if (category === 'legal') return item.cat === 'legal';
    return item.cat === 'company' || item.cat === 'social';
  });

  useEffect(() => { fetchCustomArticles(); }, []);

  const fetchCustomArticles = async () => {
    try {
      const res = await api.get('/admin/system-contents');
      const all = res.data;
      const fixedKeys = FIXED_SLUGS.map(s => s.slug);
      setCustomArticles(all.filter((item: any) => !fixedKeys.includes(item.slug)));
    } catch (e) { console.error("Error fetching custom articles", e); }
  };

  useEffect(() => {
    if (!isCreatingNew) {
      if (isArticleMode) {
        if (customArticles.length > 0) setSelectedSlug(customArticles[0].slug);
      } else {
        if (filteredFixedSlugs.length > 0) setSelectedSlug(filteredFixedSlugs[0].slug);
      }
    }
  }, [category, isArticleMode, customArticles.length]);

  useEffect(() => {
    if (!isCreatingNew && selectedSlug) {
      fetchContent(selectedSlug);
    }
  }, [selectedSlug]);

  const fetchContent = async (slug: string) => {
    if (!slug) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/admin/system-contents/${slug}`);
      setContent(res.data || { slug: slug, title: '', htmlContent: '', lastUpdated: '' });
    } catch (e) {
      toast.error("Không thể tải nội dung: " + slug);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setSelectedSlug('');
    // 🚀 FIXED: Ensuring everything is strictly empty on start
    setContent({ slug: '', title: '', htmlContent: '', lastUpdated: '' });
  };

  const handleDeleteArticle = async (slug: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài viết "${slug}"?`)) return;
    try {
      await api.delete(`/admin/system-contents/${slug}`);
      toast.success("Đã xóa bài viết!");
      if (selectedSlug === slug) {
        setSelectedSlug('');
        setContent({ slug: '', title: '', htmlContent: '', lastUpdated: '' });
      }
      fetchCustomArticles();
    } catch (e) {
      toast.error("Lỗi khi xóa bài viết.");
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
    const finalSlug = (isCreatingNew || isCustomArticle) ? content.slug : selectedSlug;

    if (!content.title.trim() || !content.htmlContent.trim() || !finalSlug.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin (Tiêu đề, Slug, Nội dung).");
      return;
    }

    try {
      setIsSaving(true);
      await api.post('/admin/system-contents', {
        ...content,
        slug: finalSlug,
        lastUpdated: new Date()
      });
      toast.success("Đã lưu thành công!");
      setIsCreatingNew(false);
      setSelectedSlug(finalSlug);
      fetchCustomArticles();
      fetchContent(finalSlug);
    } catch (e) {
      toast.error("Lỗi khi lưu nội dung.");
    } finally {
      setIsSaving(false);
    }
  };

  const currentMetadata = FIXED_SLUGS.find(s => s.slug === selectedSlug);
  const isBadge = currentMetadata?.isToggleable;
  const badgeData = getBadgeData(content.htmlContent);

  return (
    <div className="admin-content-mgmt">
      <div className="mgmt-header">
        <h2>
          {isArticleMode ? (
            <><FaFileAlt style={{color: '#1890ff', marginRight: '12px'}} /> Quản lý Bài viết</>
          ) : isCreatingNew ? (
            <><FaPlus style={{color: '#52c41a', marginRight: '12px'}} /> Tạo bài viết mới</>
          ) : category === 'legal' ? (
            <><FaShieldAlt style={{color: '#2f54eb', marginRight: '12px'}} /> Quản lý Chính sách Pháp lý</>
          ) : (
            <><FaBuilding style={{color: '#52c41a', marginRight: '12px'}} /> Thông tin Công ty</>
          )}
        </h2>
        <p>
          {isArticleMode 
            ? "Tạo và quản lý các nội dung hướng dẫn, blog hoặc bài viết giới thiệu." 
            : "Cấu hình các thông tin cố định và giao diện chân trang hệ thống."}
        </p>
      </div>

      <div className="mgmt-main-layout">
        <div className="slug-sidebar">
          {!isArticleMode && (
            <>
              <div className="sidebar-section-title" style={{fontSize: '12px', color: '#8c8c8c', marginBottom: '10px', fontWeight: 600}}>MỤC CỐ ĐỊNH</div>
              {filteredFixedSlugs.map(item => (
                <button 
                  key={item.slug} 
                  className={`slug-btn ${selectedSlug === item.slug && !isCreatingNew ? 'active' : ''}`} 
                  onClick={() => { setIsCreatingNew(false); setSelectedSlug(item.slug); }}
                >
                  {item.icon || <FaFileContract />}
                  {item.label}
                </button>
              ))}
            </>
          )}

          {isArticleMode && (
            <>
              <div className="sidebar-section-title" style={{fontSize: '12px', color: '#8c8c8c', marginBottom: '10px', fontWeight: 600}}>BÀI VIẾT TỰ DO</div>
              {customArticles.map(art => (
                <div key={art.slug} className="custom-article-item-wrapper">
                  <button 
                    className={`slug-btn ${selectedSlug === art.slug && !isCreatingNew ? 'active' : ''}`} 
                    onClick={() => { setIsCreatingNew(false); setSelectedSlug(art.slug); }}
                  >
                    <FaEdit style={{color: '#faad14'}} />
                    <span className="btn-text">{art.title}</span>
                  </button>
                  <button 
                    className="delete-article-btn" 
                    onClick={(e) => { e.stopPropagation(); handleDeleteArticle(art.slug); }}
                    title="Xóa bài viết"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              
              <button className="slug-btn add-new-article-btn" onClick={handleCreateNew}>
                <FaPlus /> Thêm bài viết mới
              </button>
            </>
          )}
        </div>

        <div className="editor-card">
          {isLoading ? ( <div className="loading-state">Đang truy xuất dữ liệu...</div> ) : (
            <>
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
                <label>Tiêu đề bài viết hiển thị</label>
                {/* 🚀 FIXED: Added autoFocus and Placeholder */}
                <input 
                  type="text" 
                  autoFocus={isCreatingNew}
                  placeholder="Nhập tiêu đề (vd: Hướng dẫn mua hàng)..."
                  value={content.title} 
                  onChange={(e) => setContent({...content, title: e.target.value})} 
                />
              </div>

              {(isCreatingNew || isCustomArticle) && !isBadge && (
                <div className="input-group slug-input-group">
                  <label><FaLink /> Mã định danh (Slug) - *Dùng để liên kết với Phân cấp Trợ giúp*</label>
                  {/* 🚀 FIXED: Placeholder updated to match guide */}
                  <input 
                    type="text" 
                    value={content.slug} 
                    placeholder="vd: huong-dan-thanh-toan"
                    onChange={(e) => setContent({...content, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} 
                  />
                  <small style={{color: '#8c8c8c', marginTop: '4px', display: 'block'}}>
                    Lưu ý: Slug này phải khớp 100% với slug bạn đã đặt trong trang "Phân cấp Trợ giúp".
                  </small>
                </div>
              )}

              {isBadge ? (
                <div className="badge-fields-container">
                  <div className="input-group">
                    <label><FaImage /> Đường dẫn ảnh / QR Code (URL)</label>
                    <input 
                      type="text" 
                      value={badgeData.img} 
                      placeholder="https://..."
                      onChange={(e) => {
                        const newJson = JSON.stringify({ img: e.target.value, link: badgeData.link });
                        setContent({ ...content, htmlContent: content.htmlContent.startsWith('DISABLED_') ? `DISABLED_${newJson}` : newJson });
                      }}
                    />
                  </div>
                  <div className="input-group">
                    <label><FaExternalLinkAlt /> Link điều hướng (Dành cho App Store/Play Store)</label>
                    <input 
                      type="text" 
                      value={badgeData.link} 
                      placeholder="https://..."
                      onChange={(e) => {
                        const newJson = JSON.stringify({ img: badgeData.img, link: e.target.value });
                        setContent({ ...content, htmlContent: content.htmlContent.startsWith('DISABLED_') ? `DISABLED_${newJson}` : newJson });
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="input-group">
                  <label>Nội dung hiển thị (Trình soạn thảo chuyên nghiệp)</label>
                  <div className="quill-wrapper">
                    <ReactQuill 
                      theme="snow"
                      value={content.htmlContent.replace('DISABLED_', '')}
                      onChange={(val) => {
                        setContent({ 
                          ...content, 
                          htmlContent: content.htmlContent.startsWith('DISABLED_') ? `DISABLED_${val}` : val 
                        });
                      }}
                      modules={quillModules}
                    />
                  </div>
                </div>
              )}

              <div className="editor-footer">
                <div className="last-sync" style={{fontSize: '13px', color: '#8c8c8c'}}>
                  <FaHistory /> Cập nhật cuối: {content.lastUpdated ? new Date(content.lastUpdated).toLocaleString('vi-VN') : 'Vừa xong'}
                </div>
                <button className="btn-save-content" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Đang lưu..." : <><FaSave /> Lưu thay đổi</>}
                </button>
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
                  <img src={badgeData.img} alt="Badge Preview" onError={(e) => e.currentTarget.src = "https://via.placeholder.com/150x50?text=Lỗi+Ảnh"} />
                </a>
                {badgeData.link && <p className="preview-link-hint">Liên kết: {badgeData.link}</p>}
              </div>
          ) : (
            <div 
              className="preview-box ql-editor" 
              style={{padding: '0', border: 'none'}} 
              dangerouslySetInnerHTML={{ __html: content.htmlContent.replace('DISABLED_', '') || '<i>Chưa có nội dung soạn thảo...</i>' }} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemContentManagement;