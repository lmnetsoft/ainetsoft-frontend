import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="container">
        <div className="footer-rectangle">
          <ul className="footer-links-inline">
            <li><a href="#">Quy Định</a></li>
            <li><a href="#">Liên Hệ</a></li>
            <li><a href="#">Youtube</a></li>
            <li><a href="#">Facebook</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;