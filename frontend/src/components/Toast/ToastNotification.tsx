import React, { useEffect } from 'react';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';
import './ToastNotification.css';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

const ToastNotification: React.FC<ToastProps> = ({ message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-hide after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="toast-container">
      <div className="toast-content">
        <FaCheckCircle className="toast-icon" />
        <span className="toast-message">{message}</span>
        <button className="toast-close-btn" onClick={onClose}>
          <FaTimes />
        </button>
      </div>
      <div className="toast-progress-bar"></div>
    </div>
  );
};

export default ToastNotification;