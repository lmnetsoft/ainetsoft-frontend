import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { FaSave, FaShieldAlt, FaFileContract, FaHistory, FaCheckCircle } from 'react-icons/fa';
import './SystemContentManagement.css';

const SystemContentManagement = () => {
  const [selectedSlug, setSelectedSlug] = useState('privacy');
  const [content, setContent] = useState({ title: '', htmlContent: '', lastUpdated: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchContent(selectedSlug);
  }, [selectedSlug]);

  const fetchContent = async (slug: string) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/admin/system-contents/${slug}`);
      setContent(res.data);
    } catch (e) {
      toast.error("Không thể tải nội dung.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content.title.trim() || !content.htmlContent.trim()) {
      toast.error("Vui lòng không để trống tiêu đề hoặc nội dung.");
      return;
    }

    try {
      setIsSaving(true);
      await api.post('/admin/system-contents', {
        ...content,
        slug: selectedSlug
      });
      toast.success("Cập nhật nội dung thành công!");
      fetchContent(selectedSlug); // Refresh to get latest timestamp
    } catch (e) {
      toast.error("Lỗi khi lưu nội dung.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-content-mgmt">
      <div className="mgmt-header">
        <h2>Quản lý Chính sách & Điều khoản</h2>
        <p>Admin có thể cập nhật nội dung pháp lý hiển thị trên toàn hệ thống tại đây.</p>
      </div>

      <div className="slug-selector">
        <button 
          className={selectedSlug === 'privacy' ? 'active' : ''} 
          onClick={() => setSelectedSlug('privacy')}
        >
          <FaShieldAlt /> Chính Sách Bảo Mật
        </button>
        <button 
          className={selectedSlug === 'terms' ? 'active' : ''} 
          onClick={() => setSelectedSlug('terms')}
        >
          <FaFileContract /> Điều Khoản Sử Dụng
        </button>
      </div>

      <div className="editor-card">
        {isLoading ? (
          <div className="loading-state">Đang tải...</div>
        ) : (
          <>
            <div className="input-group">
              <label>Tiêu đề hiển thị</label>
              <input 
                type="text" 
                value={content.title} 
                onChange={(e) => setContent({...content, title: e.target.value})}
                placeholder="Nhập tiêu đề trang..."
              />
            </div>

            <div className="input-group">
              <label>Nội dung (Sử dụng mã HTML)</label>
              <textarea 
                className="html-textarea"
                value={content.htmlContent}
                onChange={(e) => setContent({...content, htmlContent: e.target.value})}
                placeholder="<h1>Ví dụ tiêu đề</h1><p>Nội dung chi tiết...</p>"
              />
              <div className="helper-text">
                <small>Hệ thống hỗ trợ các thẻ HTML cơ bản như &lt;h1&gt;, &lt;p&gt;, &lt;b&gt;, &lt;ul&gt;, &lt;li&gt;.</small>
              </div>
            </div>

            <div className="editor-footer">
              <div className="last-sync">
                <FaHistory /> Cập nhật lần cuối: {content.lastUpdated ? new Date(content.lastUpdated).toLocaleString('vi-VN') : 'Chưa rõ'}
              </div>
              <button className="btn-save-content" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Đang lưu..." : <><FaSave /> Lưu thay đổi</>}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="preview-section">
        <h3><FaCheckCircle /> Xem trước hiển thị</h3>
        <div 
          className="preview-box" 
          dangerouslySetInnerHTML={{ __html: content.htmlContent || '<p style="color:#8c8c8c">Chưa có nội dung xem trước...</p>' }} 
        />
      </div>
    </div>
  );
};

export default SystemContentManagement;