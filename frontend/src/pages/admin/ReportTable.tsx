import React from 'react';
import { FaCheck, FaTimes, FaTrash } from 'react-icons/fa';

interface ReportTableProps {
  reports: any[];
  handleResolveReport: (id: string, action: 'RESOLVED' | 'DISMISSED') => void;
  handleDeleteReport: (id: string) => void;
}

const ReportTable: React.FC<ReportTableProps> = ({ reports, handleResolveReport, handleDeleteReport }) => (
  <div className="admin-table-container">
    <table className="admin-data-table">
      <thead>
        <tr>
          <th>Sản phẩm</th>
          <th>Lý do & Chi tiết</th>
          <th>Người báo cáo</th>
          <th>Ngày gửi</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {reports.length === 0 ? (
          <tr><td colSpan={5} className="empty-row">Không có báo cáo vi phạm nào.</td></tr>
        ) : (
          reports.map(r => {
            const isProcessed = r.status === 'RESOLVED' || r.status === 'DISMISSED';
            return (
              <tr key={r.id} className={isProcessed ? 'resolved-row' : ''}>
                <td><strong>{r.productName || "Sản phẩm ẩn"}</strong></td>
                <td>
                  <div className="reason-container">
                    <span className="reason-tag">{r.reason}</span>
                    {r.details && <div className="report-detail-text"><small>Ghi chú: </small>{r.details}</div>}
                  </div>
                </td>
                <td>{r.reporterName || 'Người dùng ẩn'}</td>
                <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '---'}</td>
                <td className="action-btns">
                  {!isProcessed ? (
                    <>
                      <button className="mod-btn approve" onClick={() => handleResolveReport(r.id, 'RESOLVED')} title="Xác nhận vi phạm"><FaCheck /></button>
                      <button className="mod-btn reject" onClick={() => handleResolveReport(r.id, 'DISMISSED')} title="Bác bỏ"><FaTimes /></button>
                    </>
                  ) : (
                    <span className={`status-badge-mini ${r.status.toLowerCase()}`}>{r.status === 'RESOLVED' ? 'Đã xử lý' : 'Đã bác bỏ'}</span>
                  )}
                  <button className="mod-btn delete-grey" onClick={() => handleDeleteReport(r.id)} title="Xóa vĩnh viễn"><FaTrash /></button>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);

export default ReportTable;