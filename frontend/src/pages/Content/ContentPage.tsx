import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaShieldAlt, FaFileContract, FaInfoCircle, FaArrowRight } from 'react-icons/fa';
import './ContentPage.css';

interface PageContent {
  title: string;
  lastUpdated: string;
  htmlContent: string;
}

const ContentPage = ({ type }: { type: 'regulations' | 'contact' }) => {
  const [data, setData] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Simulation of API Call
    const fetchContent = async () => {
      setLoading(true);
      try {
        // Mock Data based on the "type" prop
        const mockData: Record<string, PageContent> = {
          regulations: {
            title: "Quy Định & Chính Sách",
            lastUpdated: "27/03/2026",
            htmlContent: `
              <h3>1. Nguyên tắc chung</h3>
              <p>Chào mừng bạn đến với AiNetsoft. Bằng cách sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các quy tắc cộng đồng và đảm bảo tính minh bạch trong giao dịch.</p>
              <h3>2. Quy định đăng tin</h3>
              <p>Tin đăng phải đảm bảo tính trung thực, không vi phạm pháp luật và thuần phong mỹ tục. Mọi hành vi gian lận sẽ bị xử lý nghiêm.</p>
            `
          },
          contact: {
            title: "Liên Hệ Với Chúng Tôi",
            lastUpdated: "27/03/2026",
            htmlContent: `
              <p>Nếu bạn có bất kỳ thắc mắc nào về kỹ thuật, khiếu nại hoặc cần hỗ trợ xác minh Shop, vui lòng liên hệ với chúng tôi:</p>
              <div class="contact-methods">
                <p><strong>📍 Địa chỉ:</strong> Ho Chi Minh City, Vietnam</p>
                <p><strong>📞 Hotline:</strong> 0123 456 789</p>
                <p><strong>✉️ Email:</strong> support@ainetsoft.com</p>
                <p><strong>⏰ Giờ làm việc:</strong> 8:00 - 18:00 (Thứ 2 - Thứ 7)</p>
              </div>
            `
          }
        };

        setData(mockData[type]);
      } catch (err) {
        console.error("Error fetching page content", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [type]);

  if (loading) return <div className="content-loading">Đang tải nội dung...</div>;
  if (!data) return <div className="content-error">Không tìm thấy nội dung yêu cầu.</div>;

  return (
    <div className="content-page-container">
      <div className="content-card">
        <h1>{data.title}</h1>
        <p className="last-updated">Cập nhật lần cuối: {data.lastUpdated}</p>
        <hr />
        
        <div 
          className="dynamic-html-content" 
          dangerouslySetInnerHTML={{ __html: data.htmlContent }} 
        />

        {/* 🛠️ ADDED: Legal Shortcuts Section */}
        <div className="legal-shortcuts-section">
          <div className="shortcut-header">
            <FaInfoCircle className="info-icon" />
            <h3>Văn bản Pháp lý Chi tiết</h3>
          </div>
          <p className="shortcut-desc">Vui lòng đọc kỹ các văn bản dưới đây để hiểu rõ quyền lợi và nghĩa vụ của bạn trên hệ thống.</p>
          
          <div className="shortcut-links-grid">
            <Link to="/privacy" className="legal-shortcut-card">
              <div className="card-icon-wrap privacy">
                <FaShieldAlt />
              </div>
              <div className="card-info">
                <strong>Chính Sách Bảo Mật</strong>
                <span>Cách chúng tôi bảo vệ dữ liệu CCCD và Email của bạn.</span>
              </div>
              <FaArrowRight className="arrow-link" />
            </Link>

            <Link to="/terms" className="legal-shortcut-card">
              <div className="card-icon-wrap terms">
                <FaFileContract />
              </div>
              <div className="card-info">
                <strong>Điều Khoản Sử Dụng</strong>
                <span>Quy định về việc nâng cấp Shop và vận hành kinh doanh.</span>
              </div>
              <FaArrowRight className="arrow-link" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentPage;