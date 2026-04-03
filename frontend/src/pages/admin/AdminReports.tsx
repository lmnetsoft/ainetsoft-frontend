import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaCheck, FaTimes, FaTrash, FaSync } from 'react-icons/fa';
import adminService from '../../services/admin.service';
import { toast } from 'react-hot-toast';
import './AdminDashboard.css';

const AdminReports = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllReports();
      setReports(Array.isArray(res) ? res : (res?.content || []));
    } catch (err) { toast.error("Lỗi tải báo cáo."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleAction = async (id: string, action: 'RESOLVED' | 'DISMISSED') => {
    try {
      await adminService.resolveReport(id, action);
      toast.success("Đã xử lý báo cáo");
      fetchReports();
    } catch (err) { toast.error("Thao tác thất bại"); }
  };

  return (
    <div className="admin-dashboard-wrapper">
      <header className="admin-page-header">
        <div className="header-left">
          <h1><FaExclamationTriangle /> Báo cáo vi phạm</h1>
        </div>
        <button className="btn-refresh" onClick={fetchReports}><FaSync /> Làm mới</button>
      </header>
      <div className="admin-table-container">
        <table className="admin-data-table">
          <thead>
            <tr><th>Sản phẩm</th><th>Lý do</th><th>Người báo cáo</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            {reports.length === 0 ? <tr><td colSpan={4} className="empty-row">Không có báo cáo nào.</td></tr> : 
              reports.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.productName}</strong></td>
                  <td><span className="reason-tag">{r.reason}</span></td>
                  <td>{r.reporterName}</td>
                  <td className="action-btns">
                    <button className="mod-btn approve" onClick={() => handleAction(r.id, 'RESOLVED')}><FaCheck /></button>
                    <button className="mod-btn reject" onClick={() => handleAction(r.id, 'DISMISSED')}><FaTimes /></button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminReports;