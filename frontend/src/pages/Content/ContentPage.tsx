import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
        // Later, this will be: const res = await axios.get(`/api/content/${type}`);
        
        // Mock Data based on the "type" prop
        const mockData: Record<string, PageContent> = {
          regulations: {
            title: "Quy Định & Chính Sách",
            lastUpdated: "28/02/2026",
            htmlContent: `
              <h3>1. Điều khoản sử dụng</h3>
              <p>Chào mừng bạn đến với AiNetsoft. Bằng cách sử dụng dịch vụ của chúng tôi, bạn đồng ý với các điều khoản...</p>
              <h3>2. Chính sách bảo mật</h3>
              <p>Chúng tôi cam kết bảo vệ thông tin cá nhân của người dùng một cách tuyệt đối...</p>
              <h3>3. Quy định đăng tin</h3>
              <p>Tin đăng phải đảm bảo tính trung thực, không vi phạm pháp luật và thuần phong mỹ tục...</p>
            `
          },
          contact: {
            title: "Liên Hệ Với Chúng Tôi",
            lastUpdated: "28/02/2026",
            htmlContent: `
              <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với đội ngũ hỗ trợ của AiNetsoft qua các kênh sau:</p>
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
      </div>
    </div>
  );
};

export default ContentPage;