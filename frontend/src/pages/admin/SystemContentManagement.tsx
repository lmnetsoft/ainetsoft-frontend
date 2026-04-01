import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  FaSave, FaShieldAlt, FaFileContract, FaHistory, FaCheckCircle, 
  FaBuilding, FaYoutube, FaFacebook, FaToggleOn, FaToggleOff, 
  FaCertificate, FaGavel, FaBullhorn, FaExternalLinkAlt, FaImage,
  FaPlus, FaListUl, FaEdit, FaMobileAlt // 🚀 Added FaMobileAlt for App Icons
} from 'react-icons/fa';

// 🚀 React 19 Compatible Editor
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

  // 🚀 NEW: Added App Download slugs to use "Badge UI" (Image + Link)
  { slug: 'app_qr_code', label: 'App: QR Code', cat: 'social', isToggleable: true, icon: <FaMobileAlt style={{color: '#52c41a'}}/> },
  { slug: 'app_ios_link', label: 'App: iOS Store', cat: 'social', isToggleable: true, icon: <FaMobileAlt style={{color: '#1890ff'}}/> },
  { slug: 'app_android_link', label: 'App: Android Store', cat: 'social', isToggleable: true, icon: <FaMobileAlt style={{color: '#52c41a'}}/> }
];

const SystemContentManagement = () => {
  const { category } = useParams(); 
  const [selectedSlug, setSelectedSlug] = useState('');
  const [content, setContent] = useState({ slug: '', title: '', htmlContent: '', lastUpdated: '' });
  const [customArticles, setCustomArticles] = useState<any[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    if (!isCreatingNew && filteredFixedSlugs.length > 0) {
      setSelectedSlug(filteredFixedSlugs[0].slug);
    }
  }, [category]);

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
    setContent({ slug: '', title: '', htmlContent: '', lastUpdated: '' });
  };

  const handleToggleBadge = () => {
    const isCurrentlyDisabled = content.htmlContent.startsWith('DISABLED_');
    const newVal = isCurrentlyDisabled 
      ? content.htmlContent.replace('DISABLED_', '') 
      : `DISABLED_${content.htmlContent}`;
    setContent({ ...content, htmlContent: newVal });
  };

  const handleSave = async () => {
    if (!content.title.trim() || !content.htmlContent.trim() || (isCreatingNew && !content.slug.trim())) {
      toast.error("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    try {
      setIsSaving(true);
      await api.post('/admin/system-contents', {
        ...content,
        slug: isCreatingNew ? content.slug : selectedSlug,
        lastUpdated: new Date()
      });
      toast.success("Đã lưu thành công!");
      setIsCreatingNew(false);
      if (isCreatingNew) {
        setSelectedSlug(content.slug);
        fetchCustomArticles();
      } else {
        fetchContent(selectedSlug);
      }
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
          {isCreatingNew ? (
            <><FaPlus style={{color: '#52c41a', marginRight: '12px'}} /> Tạo bài viết mới</>
          ) : category === 'legal' ? (
            <><FaShieldAlt style={{color: '#2f54eb', marginRight: '12px'}} /> Quản lý Chính sách Pháp lý</>
          ) : (
            <><FaBuilding style={{color: '#52c41a', marginRight: '12px'}} /> Cấu hình Hệ thống</>
          )}
        </h2>
        <p>Soạn thảo nội dung chuyên nghiệp và quản lý thông tin hệ thống.</p>
      </div>

      <div className="mgmt-main-layout">
        <div className="slug-sidebar">
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

          <div className="sidebar-section-title" style={{fontSize: '12px', color: '#8c8c8c', margin: '25px 0 10px 0', fontWeight: 600}}>BÀI VIẾT TỰ DO</div>
          {customArticles.map(art => (
            <button 
              key={art.slug} 
              className={`slug-btn ${selectedSlug === art.slug && !isCreatingNew ? 'active' : ''}`} 
              onClick={() => { setIsCreatingNew(false); setSelectedSlug(art.slug); }}
            >
              <FaEdit style={{color: '#faad14'}} />
              {art.title}
            </button>
          ))}
          
          <button className="slug-btn" style={{marginTop: 'auto', border: '1px dashed #d9d9d9', color: '#1890ff'}} onClick={handleCreateNew}>
            <FaPlus /> Thêm bài viết mới
          </button>
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

              {isCreatingNew && (
                <div className="input-group">
                  <label>Mã định danh (Slug) - *Dùng để liên kết URL*</label>
                  <input 
                    type="text" 
                    value={content.slug} 
                    placeholder="ví dụ: huong-dan-thanh-toan"
                    onChange={(e) => setContent({...content, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} 
                  />
                </div>
              )}

              <div className="input-group">
                <label>Tiêu đề bài viết hiển thị</label>
                <input type="text" value={content.title} onChange={(e) => setContent({...content, title: e.target.value})} />
              </div>

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