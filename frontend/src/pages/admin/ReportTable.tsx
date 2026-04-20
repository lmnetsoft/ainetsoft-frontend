import React, { useState, useMemo } from 'react';
import { 
  FaCheck, FaTimes, FaTrash, FaCheckDouble, FaSearch, 
  FaTimesCircle, FaChevronLeft, FaChevronRight 
} from 'react-icons/fa';

interface ReportTableProps {
  reports: any[];
  handleResolveReport: (id: string, action: 'RESOLVED' | 'DISMISSED') => void;
  handleDeleteReport: (id: string) => void;
  onBatchResolve: (ids: string[], action: 'RESOLVED' | 'DISMISSED') => void;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const ReportTable: React.FC<ReportTableProps> = ({ 
  reports, handleResolveReport, handleDeleteReport, onBatchResolve,
  currentPage, pageSize, onPageChange, onPageSizeChange 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 1. Filter logic
  const filteredReports = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return reports;
    return reports.filter(r => 
      (r.productName || "").toLowerCase().includes(term) ||
      (r.reason || "").toLowerCase().includes(term) ||
      (r.reporterName || "").toLowerCase().includes(term)
    );
  }, [reports, searchTerm]);

  // 2. Pagination Slicing (The Fix)
  const paginatedReports = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredReports.length / pageSize) || 1;

  return (
    <div className="admin-table-container-supreme">
      {/* ELITE SEARCH BAR */}
      <div className="table-controls-row-elite">
        <div className="admin-search-box-supreme">
          <FaSearch className="search-icon-inside" />
          <input 
            type="text" 
            placeholder="Tìm theo sản phẩm, lý do hoặc người báo cáo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm("")}><FaTimesCircle /></button>
          )}
        </div>
      </div>

      {/* BATCH ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className="batch-action-bar-supreme">
          <div className="batch-info">
            <FaCheckDouble className="batch-icon" />
            <span>Đã chọn <strong>{selectedIds.length}</strong> báo cáo</span>
          </div>
          <div className="batch-btns">
            <button className="batch-btn confirm" onClick={() => { onBatchResolve(selectedIds, 'RESOLVED'); setSelectedIds([]); }}>
              <FaCheck /> Xác nhận hàng loạt
            </button>
            <button className="batch-btn dismiss" onClick={() => { onBatchResolve(selectedIds, 'DISMISSED'); setSelectedIds([]); }}>
              <FaTimes /> Bác bỏ hàng loạt
            </button>
            <button className="batch-btn cancel" onClick={() => setSelectedIds([])}>Hủy</button>
          </div>
        </div>
      )}

      <table className="admin-data-table-supreme">
        <thead>
          <tr>
            <th style={{ width: '40px' }}>
              <input 
                type="checkbox" 
                onChange={(e) => setSelectedIds(e.target.checked ? paginatedReports.map(r => r.id) : [])} 
              />
            </th>
            <th>SẢN PHẨM</th>
            <th>LÝ DO & CHI TIẾT</th>
            <th>NGƯỜI BÁO CÁO</th>
            <th>NGÀY GỬI</th>
            <th style={{ textAlign: 'right' }}>THAO TÁC</th>
          </tr>
        </thead>
        <tbody>
          {paginatedReports.length === 0 ? (
            <tr><td colSpan={6} className="empty-row-visual">Không có báo cáo vi phạm nào.</td></tr>
          ) : (
            paginatedReports.map(r => {
              const isProcessed = r.status === 'RESOLVED' || r.status === 'DISMISSED';
              return (
                <tr key={r.id} className={selectedIds.includes(r.id) ? 'selected-row' : ''}>
                  <td>
                    {!isProcessed && (
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(r.id)} 
                        onChange={() => setSelectedIds(prev => prev.includes(r.id) ? prev.filter(id => id !== r.id) : [...prev, r.id])} 
                      />
                    )}
                  </td>
                  <td><strong className="user-primary-name">{r.productName || "Sản phẩm ẩn"}</strong></td>
                  <td>
                    <div className="reason-container-supreme">
                      <span className={`status-pill-colorful ${isProcessed ? 'neutral' : 'pending'}`}>{r.reason}</span>
                      {r.details && <div className="report-detail-text"><small>Ghi chú: </small>{r.details}</div>}
                    </div>
                  </td>
                  <td>{r.reporterName || 'Người dùng ẩn'}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-button-group-supreme">
                      {!isProcessed ? (
                        <>
                          <button className="btn-action-inspect approve-btn-mini" onClick={() => handleResolveReport(r.id, 'RESOLVED')}><FaCheck /></button>
                          <button className="btn-action-inspect reject-btn-mini" onClick={() => handleResolveReport(r.id, 'DISMISSED')}><FaTimes /></button>
                        </>
                      ) : (
                        <span className={`status-pill-colorful ${r.status.toLowerCase()}`}>
                          {r.status === 'RESOLVED' ? 'Đã xử lý' : 'Đã bác bỏ'}
                        </span>
                      )}
                      <button className="btn-action-inspect delete-btn-mini" onClick={() => handleDeleteReport(r.id)}><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* SUPREME FOOTER */}
      <div className="admin-table-pagination-footer-wrapper">
        <div className="pagination-left-info">
          Hiển thị <strong>{paginatedReports.length}</strong> / <strong>{filteredReports.length}</strong> báo cáo
        </div>
        <div className="pagination-right-controls">
          <div className="size-selector">
            <span>Hiển thị:</span>
            <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
              <option value={10}>10 dòng</option>
              <option value={30}>30 dòng</option>
            </select>
          </div>
          <div className="nav-buttons">
            <button disabled={currentPage === 0} onClick={() => onPageChange(currentPage - 1)} className="btn-pg"><FaChevronLeft /> Trước</button>
            <span className="page-num">Trang <strong>{currentPage + 1}</strong> / {totalPages}</span>
            <button disabled={currentPage >= totalPages - 1} onClick={() => onPageChange(currentPage + 1)} className="btn-pg">Sau <FaChevronRight /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportTable;