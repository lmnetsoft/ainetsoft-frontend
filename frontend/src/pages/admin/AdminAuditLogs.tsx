import React, { useEffect, useState } from 'react';
import { FaHistory } from 'react-icons/fa'; 
import { adminService } from '../../services/admin.service';
import LogTable from './LogTable'; 
import './AdminDashboard.css';

const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAuditLogs({ page: currentPage, size: pageSize });
      
      const content = res.content || (Array.isArray(res) ? res : []);
      const total = res.totalElements || content.length;
      
      setLogs(content);
      setTotalElements(total);
    } catch (err) {
      console.error("Lỗi tải nhật ký hệ thống:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, pageSize]);

  if (loading) return <div className="admin-loading">Đang tải nhật ký...</div>;

  return (
    <div className="audit-logs-container">
      
      {/* Sử dụng cấu trúc class chuẩn từ AdminDashboard.css để Tiêu đề tự động căn giữa */}
      <div className="admin-page-header">
        <div className="header-left">
          <h1><FaHistory style={{ marginRight: '10px' }} /> Nhật ký hoạt động hệ thống</h1>
          <p style={{ color: '#64748b', marginTop: '10px', fontWeight: 500, fontSize: '14.5px' }}>
            Tổng quan theo dõi mọi thay đổi từ các quản trị viên.
          </p>
        </div>
      </div>
      
      <LogTable 
        logs={logs}
        currentPage={currentPage}
        totalPages={Math.ceil(totalElements / pageSize) || 1}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        totalElements={totalElements}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
};

export default AdminAuditLogs;