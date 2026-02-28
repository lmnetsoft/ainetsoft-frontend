import React, { useState, useEffect } from 'react';
import { FaFacebook, FaYoutube } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  // 1. Initialize state with your current links as the default/fallback
  const [socialLinks, setSocialLinks] = useState({
    youtube: "https://www.youtube.com/@MOMENTSTVvn",
    facebook: "https://www.facebook.com/profile.php?id=61581226680311"
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 2. Simulation of an API call to get dynamic settings from Admin
    const fetchLinks = async () => {
      try {
        setLoading(true);
        // This is where your API call will go later:
        // const response = await getSystemSettings();
        
        // Simulating a successful API response
        const data = {
          youtube: "https://www.youtube.com/@MOMENTSTVvn",
          facebook: "https://www.facebook.com/profile.php?id=61581226680311"
        };

        setSocialLinks(data);
      } catch (error) {
        console.error("Failed to fetch social links:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, []);

  return (
    <footer className="main-footer">
      <div className="container">
        <div className="footer-rectangle">
          <ul className="footer-links-inline">
            <li><a href="/regulations">Quy Định</a></li>
            <li><a href="/contact">Liên Hệ</a></li>
            
            {/* Dynamic YouTube Link */}
            <li>
              <a 
                href={socialLinks.youtube} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`social-link ${loading ? 'link-loading' : ''}`}
              >
                <FaYoutube className="footer-icon youtube-color" /> 
                {loading ? '...' : 'Youtube'}
              </a>
            </li>

            {/* Dynamic Facebook Link */}
            <li>
              <a 
                href={socialLinks.facebook} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`social-link ${loading ? 'link-loading' : ''}`}
              >
                <FaFacebook className="footer-icon facebook-color" /> 
                {loading ? '...' : 'Facebook'}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;