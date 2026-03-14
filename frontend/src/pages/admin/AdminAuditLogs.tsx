import React, { useEffect, useState } from 'react';
import { FaHistory, FaCheckCircle, FaTimesCircle, FaUserShield, FaUserSlash, FaBoxOpen } from 'react-icons/fa';
import { adminService } from '../../services/admin.service';
import './AdminDashboard.css';

const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await adminService.getAuditLogs();
        setLogs(res.data);
      } catch (err) {
        console.error("Không thể tải nhật ký hệ thống.");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Helper to render icons based on action types
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

  if (loading) return <div className="admin-loading">Đang tải nhật ký...</div>;

  return (
    <div className="audit-logs-container">
      <div className="audit-header">
        <h3><FaHistory /> Nhật ký hoạt động hệ thống</h3>
        <p className="subtitle">Theo dõi mọi thay đổi từ các quản trị viên.</p>
      </div>

      <div className="logs-feed">
        {logs.length === 0 ? (
          <div className="empty-logs">Chưa có hoạt động nào được ghi lại.</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="log-item">
              <div className="log-icon">{getActionIcon(log.action)}</div>
              <div className="log-details">
                <p className="log-text">
                  <span className="log-actor">{log.adminEmail}</span> 
                  {" đã "} 
                  <span className={`log-action-tag ${log.action.toLowerCase()}`}>
                    {log.actionDescription}
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