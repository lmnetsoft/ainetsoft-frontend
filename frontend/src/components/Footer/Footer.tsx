import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaYoutube } from 'react-icons/fa';
import api from '../../services/api';
import LegalModal from '../LegalModal/LegalModal'; 
import './Footer.css';

const Footer = () => {
  const [legalSlug, setLegalSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Initial state for company branding and contact info
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

  const [menus, setMenus] = useState<any[]>([]);
  const [payIcons, setPayIcons] = useState<any[]>([]);
  const [shipIcons, setShipIcons] = useState<any[]>([]);
  const [appData, setAppData] = useState<any>({});

  // Helper to handle relative image paths from the Spring Boot backend
  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:8080${path.startsWith('/') ? '' : '/'}${path}`;
  };

  useEffect(() => {
    const fetchAllFooterData = async () => {
      try {
        setLoading(true);
        const appSlugs = ['app_qr_code', 'app_ios_link', 'app_android_link'];

        // Parallel execution to minimize loading time
        const [resFooter, resMenus, resPay, resShip, resApp] = await Promise.all([
          api.get('/system-content/footer'),
          api.get('/footer-menus'),
          api.get('/footer-icons/PAYMENT'),
          api.get('/footer-icons/SHIPPING'),
          api.get(`/system-content/list?slugs=${appSlugs.join(',')}`)
        ]);

        if (resFooter.data) setData(resFooter.data);
        setMenus(resMenus.data || []);
        setPayIcons(resPay.data || []);
        setShipIcons(resShip.data || []);
        setAppData(resApp.data || {});

      } catch (error) {
        console.error("Footer CMS Data Sync failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllFooterData();
  }, []);

  // Parses badge JSON and handles the "DISABLED_" prefix for visibility toggling
  const getBadgeInfo = (rawData: string) => {
    if (!rawData || rawData.startsWith('DISABLED_')) return null;
    try {
      const parsed = JSON.parse(rawData);
      return { img: getImageUrl(parsed.img), link: parsed.link || '#' }; 
    } catch (e) {
      return { img: getImageUrl(rawData), link: '#' }; 
    }
  };

  const openLegal = (slug: string) => setLegalSlug(slug);

  if (loading) return null; 

  const b1 = getBadgeInfo(data.footer_badge_1);
  const b2 = getBadgeInfo(data.footer_badge_2);
  const b3 = getBadgeInfo(data.footer_badge_3);

  const qr = getBadgeInfo(appData.app_qr_code);
  const ios = getBadgeInfo(appData.app_ios_link);
  const android = getBadgeInfo(appData.app_android_link);

  return (
    <footer className="app-footer-global">
      <div className="footer-container">
        
        {/* ROW 1: DYNAMIC NAVIGATION (Shopee Style) */}
        <div className="footer-main-nav">
          
          {menus.map((col) => (
            <div key={col.id || Math.random()} className="footer-nav-col">
              <h4 className="nav-title">{col.columnTitle || col.categoryTitle}</h4>
              
              <ul className="nav-list">
                {(col.links || col.items || []).map((item: any, idx: number) => (
                  <li key={idx}>
                    {/* 🚀 UPDATED: Uses <a> with target="_blank" for the New Tab requirement */}
                    {item.type === 'INTERNAL' || item.isInternal === true ? (
                      <a 
                        href={`/tro-giup/${item.url}`} 
                        target="_blank" 
                        rel="noreferrer"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <a href={item.url} target="_blank" rel="noreferrer">{item.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Payment & Shipping Icons Grid */}
          <div className="footer-nav-col">
            <h4 className="nav-title">THANH TOÁN</h4>
            <div className="icon-grid">
              {payIcons.map(icon => (
                <div key={icon.id} className="mini-icon-card">
                  <img src={getImageUrl(icon.imgUrl)} alt={icon.name} title={icon.name} />
                </div>
              ))}
            </div>
            <h4 className="nav-title mt-20">ĐƠN VỊ VẬN CHUYỂN</h4>
            <div className="icon-grid">
              {shipIcons.map(icon => (
                <div key={icon.id} className="mini-icon-card">
                  <img src={getImageUrl(icon.imgUrl)} alt={icon.name} title={icon.name} />
                </div>
              ))}
            </div>
          </div>

          {/* App Store Section */}
          <div className="footer-nav-col">
            <h4 className="nav-title">TẢI ỨNG DỤNG AINETSOFT</h4>
            <div className="app-download-area">
              {qr && <img src={qr.img} alt="QR Code" className="app-qr" />}
              <div className="app-buttons">
                {ios && <a href={ios.link} target="_blank" rel="noreferrer"><img src={ios.img} alt="App Store" /></a>}
                {android && <a href={android.link} target="_blank" rel="noreferrer"><img src={android.img} alt="Google Play" /></a>}
              </div>
            </div>
          </div>
        </div>

        <hr className="footer-nav-divider" />

        {/* ROW 2: LEGAL LINKS (Opens in Modal) */}
        <div className="footer-policy-links">
          <span onClick={() => openLegal('privacy')}>CHÍNH SÁCH BẢO MẬT</span>
          <span className="footer-divider"> | </span>
          <span onClick={() => openLegal('terms')}>QUY CHẾ HOẠT ĐỘNG</span>
          <span className="footer-divider"> | </span>
          <span onClick={() => openLegal('shipping-policy')}>CHÍNH SÁCH VẬN CHUYỂN</span>
          <span className="footer-divider"> | </span>
          <span onClick={() => openLegal('return-policy')}>CHÍNH SÁCH TRẢ HÀNG VÀ HOÀN TIỀN</span>
        </div>

        {/* ROW 3: GOVERNMENT BADGES & SOCIAL MEDIA */}
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

        {/* ROW 4: CORPORATE LEGAL INFO */}
        <div className="footer-company-info">
          <p className="footer-company-name">{data.footer_company_name}</p>
          <p>Địa chỉ: {data.footer_address}</p>
          <p>
            Chăm sóc khách hàng: {data.footer_hotline} 
            <span className="footer-divider"> | </span> 
            Nội dung: {data.footer_representative}
          </p>
          <p>MSDN: {data.footer_tax_code} - Cấp bởi: {data.footer_issuing_agency} ({data.footer_registration_date})</p>
          <p className="footer-copyright">© {new Date().getFullYear()} - {data.footer_company_name}. Tất cả quyền được bảo lưu.</p>
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