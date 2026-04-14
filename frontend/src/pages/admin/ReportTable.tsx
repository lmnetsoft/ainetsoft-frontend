import React, { useState } from 'react';
import { FaCheck, FaTimes, FaTrash, FaCheckDouble, FaBan } from 'react-icons/fa';

interface ReportTableProps {
  reports: any[];
  handleResolveReport: (id: string, action: 'RESOLVED' | 'DISMISSED') => void;
  handleDeleteReport: (id: string) => void;
  // 🚀 PHASE 5: Batch Action Hook
  onBatchResolve: (ids: string[], action: 'RESOLVED' | 'DISMISSED') => void;
}

const ReportTable: React.FC<ReportTableProps> = ({ 
  reports, 
  handleResolveReport, 
  handleDeleteReport,
  onBatchResolve 
}) => {
  // 🚀 PHASE 5: Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelectAll = () => {
    if (selectedIds.length === reports.filter(r => r.status === 'PENDING').length) {
      setSelectedIds([]);
    } else {
      const pendingIds = reports
        .filter(r => r.status !== 'RESOLVED' && r.status !== 'DISMISSED')
        .map(r => r.id);
      setSelectedIds(pendingIds);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBatchAction = async (action: 'RESOLVED' | 'DISMISSED') => {
    const label = action === 'RESOLVED' ? "XÁC NHẬN VI PHẠM" : "BÁC BỎ";
    if (window.confirm(`Bạn có chắc muốn ${label} cho ${selectedIds.length} báo cáo đã chọn?`)) {
      await onBatchResolve(selectedIds, action);
      setSelectedIds([]); // Reset selection after success
    }
  };

  return (
    <div className="admin-table-container-supreme" style={{ position: 'relative' }}>
      
      {/* 🚀 PHASE 5: BATCH ACTION BAR (Floating/Sticky) */}
      {selectedIds.length > 0 && (
        <div className="batch-action-bar-supreme">
          <div className="batch-info">
            <FaCheckDouble className="batch-icon" />
            <span>Đã chọn <strong>{selectedIds.length}</strong> báo cáo</span>
          </div>
          <div className="batch-btns">
            <button className="batch-btn confirm" onClick={() => handleBatchAction('RESOLVED')}>
              <FaCheck /> Xác nhận hàng loạt
            </button>
            <button className="batch-btn dismiss" onClick={() => handleBatchAction('DISMISSED')}>
              <FaTimes /> Bác bỏ hàng loạt
            </button>
            <button className="batch-btn cancel" onClick={() => setSelectedIds([])}>
              Hủy
            </button>
          </div>
        </div>
      )}

      <table className="admin-data-table-supreme">
        <thead>
          <tr>
            <th style={{ width: '40px' }}>
              <input 
                type="checkbox" 
                className="admin-checkbox"
                checked={selectedIds.length > 0 && selectedIds.length === reports.filter(r => r.status !== 'RESOLVED' && r.status !== 'DISMISSED').length}
                onChange={toggleSelectAll}
              />
            </th>
            <th>Sản phẩm</th>
            <th>Lý do & Chi tiết</th>
            <th>Người báo cáo</th>
            <th>Ngày gửi</th>
            <th style={{ textAlign: 'right' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {reports.length === 0 ? (
            <tr><td colSpan={6} className="empty-row-visual">Không có báo cáo vi phạm nào.</td></tr>
          ) : (
            reports.map(r => {
              const isProcessed = r.status === 'RESOLVED' || r.status === 'DISMISSED';
              return (
                <tr key={r.id} className={`${isProcessed ? 'resolved-row' : ''} ${selectedIds.includes(r.id) ? 'selected-row' : ''}`}>
                  <td>
                    {!isProcessed && (
                      <input 
                        type="checkbox" 
                        className="admin-checkbox"
                        checked={selectedIds.includes(r.id)}
                        onChange={() => toggleSelectOne(r.id)}
                      />
                    )}
                  </td>
                  <td><strong className="user-primary-name">{r.productName || "Sản phẩm ẩn"}</strong></td>
                  <td>
                    <div className="reason-container-supreme">
                      <span className="reason-tag-colorful">{r.reason}</span>
                      {r.details && <div className="report-detail-text"><small>Ghi chú: </small>{r.details}</div>}
                    </div>
                  </td>
                  <td>{r.reporterName || 'Người dùng ẩn'}</td>
                  <td className="date-cell">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '---'}</td>
                  
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-button-group-supreme">
                      {!isProcessed ? (
                        <>
                          <button 
                            className="btn-action-inspect approve-btn-mini" 
                            onClick={() => handleResolveReport(r.id, 'RESOLVED')} 
                            title="Xác nhận vi phạm"
                          >
                            <FaCheck />
                          </button>
                          <button 
                            className="btn-action-inspect reject-btn-mini" 
                            onClick={() => handleResolveReport(r.id, 'DISMISSED')} 
                            title="Bác bỏ"
                          >
                            <FaTimes />
                          </button>
                        </>
                      ) : (
                        <span className={`status-pill-colorful ${r.status.toLowerCase()}`}>
                          {r.status === 'RESOLVED' ? 'Đã xử lý' : 'Đã bác bỏ'}
                        </span>
                      )}
                      <button 
                        className="btn-action-inspect delete-btn-mini" 
                        onClick={() => handleDeleteReport(r.id)} 
                        title="Xóa vĩnh viễn"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ReportTable;