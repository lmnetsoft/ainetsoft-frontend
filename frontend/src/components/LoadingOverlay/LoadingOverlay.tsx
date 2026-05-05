import React from 'react';
import './LoadingOverlay.css';

type LoadingOverlayProps = {
  message?: string;
};

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Đang tải dữ liệu...'
}) => {
  return (
    <div className="global-loading-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-card">
        <div className="spinner-ring">
          <div className="spinner-core" />
        </div>

        <div className="loading-text">
          <h3>Vui lòng chờ</h3>
          <p>{message}</p>
        </div>

        <div className="loading-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;