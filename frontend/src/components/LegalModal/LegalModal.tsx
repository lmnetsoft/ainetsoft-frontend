import React, { useState, useEffect } from 'react';
import { FaTimes, FaSpinner, FaShieldAlt, FaFileContract } from 'react-icons/fa';
import api from '../../services/api';
import './LegalModal.css';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string; // "privacy" or "terms"
}

interface ContentData {
  title: string;
  htmlContent: string;
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, slug }) => {
  const [data, setData] = useState<ContentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && slug) {
      fetchContent();
    }
  }, [isOpen, slug]);

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Calling the public endpoint we created in Step 2
      const response = await api.get(`/system-content/${slug}`);
      setData(response.data);
    } catch (err: any) {
      console.error("Legal Content Fetch Error:", err);
      setError("Không thể tải nội dung. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="legal-modal-overlay" onClick={onClose}>
      <div className="legal-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="legal-modal-header">
          <div className="header-title-wrap">
            {slug === 'privacy' ? <FaShieldAlt className="icon-privacy" /> : <FaFileContract className="icon-terms" />}
            <h3>{data?.title || (slug === 'privacy' ? 'Chính Sách Bảo Mật' : 'Điều Khoản Sử Dụng')}</h3>
          </div>
          <button className="legal-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="legal-modal-body">
          {isLoading ? (
            <div className="legal-loading">
              <FaSpinner className="spinner-icon" />
              <p>Đang tải nội dung...</p>
            </div>
          ) : error ? (
            <div className="legal-error">
              <p>{error}</p>
              <button onClick={fetchContent} className="btn-retry">Thử lại</button>
            </div>
          ) : (
            <div 
              className="legal-html-content"
              dangerouslySetInnerHTML={{ __html: data?.htmlContent || '' }} 
            />
          )}
        </div>

        <div className="legal-modal-footer">
          <button className="btn-legal-close" onClick={onClose}>Đã hiểu và Đóng</button>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;