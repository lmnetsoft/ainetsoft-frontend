import React, { useEffect, useState } from 'react';
import { FaHistory, FaCheckCircle, FaTimesCircle, FaUserShield, FaUserSlash, FaBoxOpen, FaSync } from 'react-icons/fa';
import adminService from '../../services/admin.service'; // Fix import to match your structure
import './AdminDashboard.css';

const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAuditLogs();
      // FIX: Use res directly because your service returns the array directly
      setLogs(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Không thể tải nhật ký hệ thống.");
      setLogs([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'APPROVE_PRODUCT': return <FaCheckCircle className="icon-success" />;
      case 'REJECT_PRODUCT': return <FaTimesCircle className="icon-danger" />;
      case 'PROMOTE_ADMIN': return <FaUserShield className="icon-info" />;
      case 'BAN_USER': return <FaUserSlash className="icon-danger" />;
      case 'APPROVE_SELLER': return <FaBoxOpen className="icon-success" />;
      default: return <FaHistory />;
    }
  };

  if (loading) return <div className="admin-loading-state">Đang tải nhật ký...</div>;

  return (
    <div className="admin-dashboard-wrapper"> {/* Changed to match your main CSS wrapper */}
      <div className="audit-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0 }}><FaHistory /> Nhật ký hệ thống</h1>
            <p className="subtitle">Theo dõi mọi thay đổi từ các quản trị viên.</p>
          </div>
          <button className="btn-refresh" onClick={fetchLogs}><FaSync /> Làm mới</button>
        </div>
      </div>

      <div className="logs-feed">
        {(!logs || logs.length === 0) ? (
          <div className="empty-logs">Chưa có hoạt động nào được ghi lại.</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="log-item">
              <div className="log-icon">{getActionIcon(log.action)}</div>
              <div className="log-details">
                <p className="log-text">
                  <span className="log-actor">{log.adminEmail}</span> 
                  {" đã "} 
                  <span className={`log-action-tag ${(log.actionType || log.action || '').toLowerCase()}`}>
                    {log.actionDescription || log.description}
                  </span>
                  {" đối với "}
                  <strong className="log-target">{log.targetName}</strong>
                </p>
                <span className="log-time">
                  {new Date(log.timestamp).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminAuditLogs;