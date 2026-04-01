import React, { useState, useEffect } from 'react';
import { FaFacebook, FaYoutube } from 'react-icons/fa';
import api from '../../services/api';
import LegalModal from '../LegalModal/LegalModal'; 
import './Footer.css';

const Footer = () => {
  const [legalSlug, setLegalSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [data, setData] = useState<any>({
    footer_company_name: 'CÔNG TY TNHH AINETSOFT',
    footer_address: 'Đang cập nhật...',
    footer_hotline: '...',
    footer_representative: '...',
    footer_tax_code: '...',
    footer_registration_date: '...',
    footer_issuing_agency: '...',
    footer_badge_1: '',
    footer_badge_2: '',
    footer_badge_3: '', 
    social_youtube: '#',
    social_facebook: '#'
  });

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/system-content/footer'); 
        if (res.data) {
          setData(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch dynamic footer data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFooterData();
  }, []);

  const getBadgeInfo = (rawData: string) => {
    if (!rawData || rawData.startsWith('DISABLED_')) return null;
    try {
      const parsed = JSON.parse(rawData);
      return { img: parsed.img, link: parsed.link };
    } catch (e) {
      return { img: rawData, link: '#' }; 
    }
  };

  const openLegal = (slug: string) => setLegalSlug(slug);

  if (loading) return null; 

  const b1 = getBadgeInfo(data.footer_badge_1);
  const b2 = getBadgeInfo(data.footer_badge_2);
  const b3 = getBadgeInfo(data.footer_badge_3);

  return (
    <footer className="app-footer-global">
      <div className="footer-container">
        
        {/* ROW 1: POLICY LINKS */}
        <div className="footer-policy-links">
          <span onClick={() => openLegal('privacy')}>CHÍNH SÁCH BẢO MẬT</span>
          <span className="footer-divider"> | </span>
          <span onClick={() => openLegal('terms')}>QUY CHẾ HOẠT ĐỘNG</span>
          <span className="footer-divider"> | </span>
          <span onClick={() => openLegal('shipping-policy')}>CHÍNH SÁCH VẬN CHUYỂN</span>
          <span className="footer-divider"> | </span>
          <span onClick={() => openLegal('return-policy')}>CHÍSON CHÁCH TRẢ HÀNG VÀ HOÀN TIỀN</span>
        </div>

        {/* ROW 2: UNIFIED BADGES & SOCIAL ICONS */}
        <div className="footer-badges-row">
          {b1 && (
            <a href={b1.link} target="_blank" rel="noreferrer" className="badge-link">
              <img src={b1.img} alt="BCT Badge 1" className="bct-badge" />
            </a>
          )}
          {b2 && (
            <a href={b2.link} target="_blank" rel="noreferrer" className="badge-link">
              <img src={b2.img} alt="BCT Badge 2" className="bct-badge" />
            </a>
          )}
          
          {/* 🚀 UPDATED: Zalo now uses 'social-badge' class for consistency */}
          {b3 && (
            <a href={b3.link} target="_blank" rel="noreferrer" className="social-badge zalo">
              <img src={b3.img} alt="Zalo" className="social-badge-img" />
            </a>
          )}

          <a href={data.social_youtube} target="_blank" rel="noreferrer" className="social-badge yt">
            <FaYoutube />
          </a>
          <a href={data.social_facebook} target="_blank" rel="noreferrer" className="social-badge fb">
            <FaFacebook />
          </a>
        </div>

        {/* ROW 3: COMPANY INFO */}
        <div className="footer-company-info">
          <p className="footer-company-name">{data.footer_company_name}</p>
          <p>Địa chỉ: {data.footer_address}</p>
          <p>
            Chăm sóc khách hàng: {data.footer_hotline} 
            <span className="footer-divider"> | </span> 
            Chịu Trách Nhiệm Quản Lý Nội Dung: {data.footer_representative}
          </p>
          <p>Mã số doanh nghiệp: {data.footer_tax_code} do {data.footer_issuing_agency} cấp lần đầu ngày {data.footer_registration_date}</p>
          
          <p className="footer-copyright">© {new Date().getFullYear()} - Bản quyền thuộc về {data.footer_company_name}</p>
        </div>
      </div>

      <LegalModal 
        isOpen={!!legalSlug} 
        onClose={() => setLegalSlug(null)} 
        slug={legalSlug || ''} 
      />
    </footer>
  );
};

export default Footer;