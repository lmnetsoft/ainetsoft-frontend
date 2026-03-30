import React from 'react';
import './Legal.css';

const LegalPage = ({ title, content }: { title: string; content: React.ReactNode }) => {
  return (
    <div className="legal-container">
      <div className="legal-card">
        <h1 className="legal-title">{title}</h1>
        <div className="legal-divider"></div>
        <div className="legal-content">
          {content}
        </div>
        <div className="legal-footer">
          <p>Cập nhật lần cuối: 27 tháng 03, 2026</p>
          <button className="btn-back" onClick={() => window.history.back()}>Quay lại</button>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;