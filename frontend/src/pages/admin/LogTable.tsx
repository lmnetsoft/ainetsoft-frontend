import React, { useState, useMemo } from 'react';
import { 
  FaSearch, FaTimesCircle, FaChevronLeft, FaChevronRight, 
  FaUserShield, FaInfoCircle, FaHistory 
} from 'react-icons/fa';

interface LogTableProps {
  logs: any[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalElements: number;
  onPageSizeChange: (size: number) => void;
}

const LogTable: React.FC<LogTableProps> = ({ 
  logs, 
  currentPage, 
  totalPages, 
  onPageChange,
  pageSize,
  totalElements,
  onPageSizeChange
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const formatDescription = (desc: string) => {
    if (!desc) return "";

    const translationMap: { [key: string]: string } = {
      'MANAGE_REPORTS': 'Quản lý báo cáo',
      'MANAGE_PRODUCTS': 'Quản lý sản phẩm',
      'MANAGE_USERS': 'Quản lý người dùng',
      'MANAGE_SYSTEM': 'Quản lý hệ thống',
      'MANAGE_CATEGORIES': 'Quản lý danh mục',
      'MANAGE_REVIEWS': 'Quản lý đánh giá',
      'PROMOTE_USER': 'Nâng cấp quyền',
      'DEMOTE_USER': 'Hạ cấp quyền',
      'REVOKE_SELLER': 'Thu hồi quyền người bán',
      'Cấp quyền Admin with:': 'Cấp quyền Quản trị:',
      'Thu hồi quyền Quản trị': 'Thu hồi quyền Quản trị',
      'Thu hồi quyền Seller:': 'Thu hồi quyền Người bán:'
    };

    let formatted = desc;

    Object.keys(translationMap).forEach(key => {
      const regex = new RegExp(key, 'g');
      formatted = formatted.replace(regex, translationMap[key]);
    });

    return formatted
      .replace('[', '(')
      .replace(']', ')')
      .replace(/,/g, ', ');
  };

  const filteredLogs = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return logs;
    return logs.filter(log => {
      const adminMatch = (log.adminEmail || "").toLowerCase().includes(term);
      const actionMatch = (log.actionType || "").toLowerCase().includes(term);
      const targetMatch = (log.targetName || "").toLowerCase().includes(term);
      const descMatch = (log.description || "").toLowerCase().includes(term);
      return adminMatch || actionMatch || targetMatch || descMatch;
    });
  }, [logs, searchTerm]);

  const paginatedLogs = useMemo(() => {
    const startIndex = currentPage * pageSize;
    return filteredLogs.slice(startIndex, startIndex + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const getActionClass = (action: string) => {
    const act = action?.toUpperCase() || "";
    if (act.includes('DELETE') || act.includes('REJECT') || act.includes('REVOKE')) return 'pending';
    if (act.includes('APPROVE') || act.includes('CREATE')) return 'active';
    return 'neutral';
  };

  return (
    <div className="admin-table-container-supreme">
      <div className="table-controls-row-elite">
        <div className="admin-search-box-supreme">
          <FaSearch className="search-icon-inside" />
          <input 
            type="text" 
            placeholder="Tìm theo email admin, hành động hoặc nội dung..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm("")}>
              <FaTimesCircle />
            </button>
          )}
        </div>
      </div>

      <table className="admin-data-table-supreme">
        <thead>
          <tr>
            {/* Tiêu đề vẫn giữ nguyên căn giữa như bạn yêu cầu */}
            <th style={{ textAlign: 'center' }}>THỜI GIAN</th>
            <th style={{ textAlign: 'center' }}>QUẢN TRỊ VIÊN</th>
            <th style={{ textAlign: 'center' }}>HÀNH ĐỘNG</th>
            <th style={{ textAlign: 'center' }}>ĐỐI TƯỢNG</th>
            <th style={{ textAlign: 'center' }}>CHI TIẾT</th>
          </tr>
        </thead>
        <tbody>
          {paginatedLogs.length === 0 ? (
            <tr><td colSpan={5} className="empty-row-visual">Không tìm thấy nhật ký nào.</td></tr>
          ) : (
            paginatedLogs.map(log => (
              <tr key={log.id}>
                {/* 🚀 ĐÃ SỬA: Nội dung các cột được căn lề trái (flex-start, text-align: left) */}
                <td>
                  <div className="log-time-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '10px' }}>
                    <FaHistory color="#999" />
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                        <span style={{ fontWeight: 600 }}>{new Date(log.timestamp).toLocaleTimeString('vi-VN')}</span>
                        <small style={{ color: '#888' }}>{new Date(log.timestamp).toLocaleDateString('vi-VN')}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="user-meta-info" style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <span className="user-full-name" style={{ display: 'flex', alignItems: 'center' }}>
                        <FaUserShield style={{ marginRight: '6px', opacity: 0.7 }} /> 
                        {log.adminEmail}
                    </span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <span className={`status-pill-colorful ${getActionClass(log.actionType)}`}>
                      {log.actionType}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="user-meta-info" style={{ textAlign: 'left' }}>
                    <span className="user-full-name" style={{ fontWeight: 600 }}>{log.targetName}</span>
                  </div>
                </td>
                <td>
                  <div className="comment-cell" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '8px' }}>
                     <small style={{ color: '#555', fontWeight: 500 }}>
                        {formatDescription(log.description)}
                     </small>
                     <FaInfoCircle color="#ccc" />
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="admin-table-pagination-footer-wrapper">
        <div className="pagination-left-info">
          Hiển thị <strong>{paginatedLogs.length}</strong> / <strong>{filteredLogs.length}</strong> nhật ký
        </div>

        <div className="pagination-right-controls">
          <div className="size-selector">
            <span>Hiển thị:</span>
            <select value={pageSize} onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(0); 
            }}>
              <option value={10}>10 dòng</option>
              <option value={30}>30 dòng</option>
              <option value={50}>50 dòng</option>
            </select>
          </div>

          <div className="nav-buttons">
            <button disabled={currentPage === 0} onClick={() => onPageChange(currentPage - 1)} className="btn-pg">
              <FaChevronLeft /> Trước
            </button>
            <span className="page-num">Trang <strong>{currentPage + 1}</strong> / {Math.ceil(filteredLogs.length / pageSize) || 1}</span>
            <button disabled={currentPage >= Math.ceil(filteredLogs.length / pageSize) - 1} onClick={() => onPageChange(currentPage + 1)} className="btn-pg">
              Sau <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogTable;
