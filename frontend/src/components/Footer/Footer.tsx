import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaYoutube } from 'react-icons/fa';
import api from '../../services/api';
import LegalModal from '../LegalModal/LegalModal'; 
import './Footer.css';

const Footer: React.FC = () => {
  const [legalSlug, setLegalSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
const [data, setData] = useState<any>({
  footer_company_name: '',
  footer_address: '',
  footer_hotline: '',
  footer_representative: '',
  footer_tax_code: '',
  footer_registration_date: '',
  footer_issuing_agency: '', // Dynamic field from DB slug
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

  /**
   * 🚀 CLEANER & FALLBACK LOGIC
   * Removes HTML tags and uses 'title' if 'content' is empty in Admin.
   */
  const cleanHTML = (input: any) => {
    if (!input) return '';
    let raw = '';
    if (typeof input === 'object') {
       // Fallback: Use content first, if empty use title
       raw = input.content || input.title || '';
    } else {
       raw = String(input);
    }
    // This browser-native parser decodes &amp; and removes tags perfectly
    const doc = new DOMParser().parseFromString(raw, 'text/html');
    return doc.body.textContent || "";
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:8080${path.startsWith('/') ? '' : '/'}${path}`;
  };

  useEffect(() => {
    const fetchAllFooterData = async () => {
      try {
        setLoading(true);
        const [resFooter, resMenus, resPay, resShip, resApp] = await Promise.all([
          api.get('/system-content/footer'),
          api.get('/footer-menus'),
          api.get('/footer-icons/PAYMENT'),
          api.get('/footer-icons/SHIPPING'),
          api.get(`/system-content/list?slugs=app_qr_code,app_ios_link,app_android_link`)
        ]);

        if (resFooter.data) setData(resFooter.data);
        setMenus(resMenus.data || []);
        setPayIcons(resPay.data || []);
        setShipIcons(resShip.data || []);
        setAppData(resApp.data || {});
      } catch (error) {
        console.error("Footer Sync Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllFooterData();
  }, []);

  const getBadgeInfo = (rawData: any) => {
    if (!rawData || (typeof rawData === 'string' && rawData.startsWith('DISABLED_'))) return null;
    try {
      const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      return { img: getImageUrl(parsed.img), link: parsed.link || '#' }; 
    } catch (e) {
      return { img: getImageUrl(rawData), link: '#' }; 
    }
  };

  if (loading) return null;

  const b1 = getBadgeInfo(data.footer_badge_1);
  const b2 = getBadgeInfo(data.footer_badge_2);
  const b3 = getBadgeInfo(data.footer_badge_3);
  const qr = getBadgeInfo(appData.app_qr_code);
  const ios = getBadgeInfo(appData.app_ios_link);
  const android = getBadgeInfo(appData.app_android_link);

  return (
    <footer className="app-footer-global">
      <div className="container">
        
        {/* ROW 1: SPREAD NAVIGATION (PRESERVED) */}
        <div className="footer-top-nav">
          {menus.slice(0, 2).map((col, idx) => (
            <div key={idx} className="footer-nav-col">
              <h4 className="footer-nav-title">{col.columnTitle || col.categoryTitle}</h4>
              <ul className="footer-nav-list">
                {(col.links || col.items || []).map((item: any, i: number) => (
                  <li key={i}>
                    <a href={item.isInternal ? `/tro-giup/${item.url}` : item.url} target="_blank" rel="noreferrer">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="footer-nav-col">
            <h4 className="footer-nav-title">THANH TOÁN</h4>
            <div className="footer-partners-row">
              {payIcons.map(icon => (
                <img key={icon.id} src={getImageUrl(icon.imgUrl)} alt={icon.name} className="partner-logo" />
              ))}
            </div>
            <h4 className="footer-nav-title mt-20">VẬN CHUYỂN</h4>
            <div className="footer-partners-row">
              {shipIcons.map(icon => (
                <img key={icon.id} src={getImageUrl(icon.imgUrl)} alt={icon.name} className="partner-logo" />
              ))}
            </div>
          </div>

          <div className="footer-nav-col">
            <h4 className="footer-nav-title">TẢI ỨNG DỤNG</h4>
            <div className="footer-app-flex">
              {qr && <img src={qr.img} alt="QR" className="qr-code-img" />}
              <div className="app-store-btns">
                {ios && <a href={ios.link} target="_blank" rel="noreferrer"><img src={ios.img} alt="iOS" /></a>}
                {android && <a href={android.link} target="_blank" rel="noreferrer"><img src={android.img} alt="Android" /></a>}
              </div>
            </div>
          </div>
        </div>

        <hr className="footer-hr" />

        {/* ROW 2: POLICIES (PRESERVED) */}
        <div className="footer-policy-links">
          <span onClick={() => setLegalSlug('privacy')}>CHÍNH SÁCH BẢO MẬT</span>
          <span className="sep-divider">|</span>
          <span onClick={() => setLegalSlug('terms')}>QUY CHẾ HOẠT ĐỘNG</span>
          <span className="sep-divider">|</span>
          <span onClick={() => setLegalSlug('shipping-policy')}>CHÍNH SÁCH VẬN CHUYỂN</span>
          <span className="sep-divider">|</span>
          <span onClick={() => setLegalSlug('return-policy')}>CHÍNH SÁCH TRẢ HÀNG</span>
        </div>

        <div className="footer-badges-row">
          {b1 && <a href={b1.link} target="_blank" rel="noreferrer"><img src={b1.img} className="bct-badge-img" alt="BCT" /></a>}
          {b2 && <a href={b2.link} target="_blank" rel="noreferrer"><img src={b2.img} className="bct-badge-img" alt="BCT" /></a>}
          <div className="social-icons-group">
            {b3 && <a href={b3.link} target="_blank" rel="noreferrer"><img src={b3.img} className="zalo-icon-img" alt="Zalo" /></a>}
            {/* 🚀 FIXED: Cleaned URL and forced New Tab */}
            <a href={cleanHTML(data.social_youtube)} className="svg-icon yt" target="_blank" rel="noreferrer"><FaYoutube /></a>
            <a href={cleanHTML(data.social_facebook)} className="svg-icon fb" target="_blank" rel="noreferrer"><FaFacebook /></a>
          </div>
        </div>

        {/* ROW 3: COMPANY INFO (PRESERVED) */}
        <div className="footer-company-bottom">
          <p className="company-name-navy">{cleanHTML(data.footer_company_name)}</p>
          <p>Địa chỉ: {cleanHTML(data.footer_address)}</p>
          <p>Hotline CSKH: {cleanHTML(data.footer_hotline)} | Người đại diện: {cleanHTML(data.footer_representative)}</p>
          <p>MSDN: {cleanHTML(data.footer_tax_code)} - Cấp bởi: {cleanHTML(data.footer_issuing_agency)} ({cleanHTML(data.footer_registration_date)})</p>
          <p className="copyright-text">© 2026 AiNetsoft TECHNOLOGY HUB. All rights reserved.</p>
        </div>
      </div>

      <LegalModal isOpen={!!legalSlug} onClose={() => setLegalSlug(null)} slug={legalSlug || ''} />
    </footer>
  );
};

export default Footer;