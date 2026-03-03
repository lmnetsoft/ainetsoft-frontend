import React from 'react';
import './LoadingOverlay.css';

const LoadingOverlay = () => {
  return (
    <div className="global-loading-overlay">
      <div className="spinner-container">
        <div className="loading-spinner"></div>
        <p>Đang tải AiNetsoft...</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;