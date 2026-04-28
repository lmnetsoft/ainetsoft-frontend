import React from 'react';
import { 
  FaSearch, FaFilter, FaCircle, FaEnvelope, FaPhoneAlt, 
  FaCalendarAlt, FaTimesCircle, FaEye,
  FaUserShield, FaBan, FaUnlock, FaStoreSlash,
  FaChevronLeft, FaChevronRight, FaStore 
} from 'react-icons/fa';

interface UserTableProps {
  users: any[]; 
  userSearchTerm: string;
  setUserSearchTerm: (val: string) => void;
  roleFilter: string;
  setRoleFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  onSearchTrigger: () => void;
  onView: (userId: string) => void;
  onPromote: (userId: string, permissions: string[]) => void;
  onDemote: (userId: string) => void; 
  onToggleStatus: (userId: string) => void;
  onRevokeSeller: (userId: string) => void;
  onRestoreSeller: (userId: string) => void;
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const UserTable: React.FC<UserTableProps> = ({ 
  users, userSearchTerm, setUserSearchTerm, roleFilter, setRoleFilter,
  statusFilter, setStatusFilter, onSearchTrigger, onView, onPromote,
  onDemote, onToggleStatus, onRevokeSeller, onRestoreSeller, 
  currentPage = 0, pageSize = 10, totalElements = 0, totalPages = 0,
  onPageChange, onPageSizeChange
}) => {

  const handleClearSearch = () => {
    setUserSearchTerm("");
    setTimeout(() => onSearchTrigger(), 0);
  };

  return (
    <div className="admin-table-container-supreme" style={{ display: 'flex', flexDirection: 'column' }}>
      
      <div className="table-controls-row-elite">
        <div className="admin-search-box-supreme">
          <FaSearch className="search-icon-inside" />
          <input 
            type="text" 
            placeholder="Nhấn Enter để tìm kiếm người dùng..." 
            value={userSearchTerm}
            onChange={(e) => setUserSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearchTrigger()}
          />
          {userSearchTerm && (
            <button className="clear-search-btn" onClick={handleClearSearch} title="Xóa tìm kiếm">
              <FaTimesCircle />
            </button>
          )}
        </div>

        <div className="filter-group-colorful">
          <div className={`select-wrapper-colorful role-${roleFilter.toLowerCase()}`}>
            <FaFilter className="icon-filter" />
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setTimeout(onSearchTrigger, 0); }}>
              <option value="ALL">Tất cả Vai trò</option>
              <option value="USER">USER</option>
              <option value="SELLER">SELLER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div className={`select-wrapper-colorful status-${statusFilter.toLowerCase()}`}>
            <FaCircle className="icon-dot" />
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setTimeout(onSearchTrigger, 0); }}>
              <option value="ALL">Tất cả Trạng thái</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="BANNED">BANNED</option>
              <option value="PENDING_SELLER">PENDING</option>
            </select>
          </div>
        </div>
      </div>

      {/* 🚀 CHỐNG SẬP LAYOUT: Bảng luôn có chiều cao cố định */}
      <div style={{ minHeight: '650px', overflowX: 'auto', flex: 1 }}>
        <table className="admin-data-table-supreme">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>HỌ TÊN</th>
              <th style={{ textAlign: 'left' }}>EMAIL / SĐT</th>
              <th style={{ textAlign: 'center' }}>VAI TRÒ</th>
              <th style={{ textAlign: 'center' }}>TRẠNG THÁI</th>
              <th style={{ textAlign: 'center' }}>NGÀY THAM GIA</th>
              <th style={{ textAlign: 'center' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {!users || users.length === 0 ? (
              <tr><td colSpan={6} className="empty-row-visual">Không tìm thấy kết quả phù hợp.</td></tr>
            ) : (
              users.map((u: any) => (
                <tr key={u.id} className={u.accountStatus === 'BANNED' ? 'row-status-banned' : ''}>
                  <td style={{ textAlign: 'left' }}>
                      <strong className="user-primary-name">{u.fullName || u.username || 'N/A'}</strong>
                  </td>
                  <td style={{ textAlign: 'left' }}>
                    <div className="contact-info-stack" style={{ alignItems: 'flex-start' }}>
                      <span className="contact-badge email-pill"><FaEnvelope className="contact-icon" /> {u.email || 'N/A'}</span>
                      <span className="contact-badge phone-pill"><FaPhoneAlt className="contact-icon" /> {u.phone || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="role-badge-stack" style={{ justifyContent: 'center' }}>
                      {u.roles?.map((r: string) => (
                        <span key={r} className={`badge-role-tag-colorful ${r.toLowerCase()}`}>{r}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <span className={`status-pill-colorful ${u.accountStatus?.toLowerCase() || 'active'}`}>
                          <FaCircle className="dot" /> {u.accountStatus || 'ACTIVE'}
                        </span>
                    </div>
                  </td>
                  <td className="date-cell">
                     <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', color: '#636e72', fontSize: '13px', fontWeight: 600 }}>
                        <FaCalendarAlt className="tiny-icon" /> {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '14/4/2026'}
                     </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="action-button-group-supreme" style={{ justifyContent: 'center' }}>
                      <button className="btn-action-inspect" onClick={() => onView(u.id)} title="Xem hồ sơ"><FaEye /></button>
                      
                      {!u.roles?.includes('ADMIN') && (
                        <button 
                          className="btn-action-inspect promote-btn" 
                          onClick={() => {
                            const perms = ["MANAGE_USERS", "MANAGE_PRODUCTS", "MANAGE_REPORTS"];
                            if(window.confirm(`Xác nhận cấp quyền Quản trị cho ${u.fullName}?`)) onPromote(u.id, perms);
                          }}
                          title="Nâng cấp lên Admin"
                        ><FaUserShield /></button>
                      )}

                      {u.roles?.includes('ADMIN') && u.email !== 'admin@ainetsoft.com' && (
                        <button 
                          className="btn-action-inspect demote-btn" 
                          onClick={() => {
                            if(window.confirm(`Xác nhận thu hồi quyền Quản trị của ${u.fullName}?`)) onDemote(u.id);
                          }}
                          title="Hạ cấp xuống Người dùng"
                        ><FaUserShield style={{ color: '#ff4d4f' }} /></button>
                      )}

                      {u.roles?.includes('SELLER') ? (
                        <button className="btn-action-inspect revoke-btn" onClick={() => onRevokeSeller(u.id)} title="Thu hồi quyền Seller"><FaStoreSlash /></button>
                      ) : (
                        (u.shopProfile || u.sellerVerification === 'REVOKED' || u.sellerVerification === 'REJECTED') && (
                          <button 
                            className="btn-action-inspect restore-btn" 
                            onClick={() => {
                               if(window.confirm(`Khôi phục quyền Người bán cho ${u.fullName}? Dữ liệu Shop cũ sẽ được giữ nguyên.`)) onRestoreSeller(u.id);
                            }}
                            style={{ color: '#38a169' }} 
                            title="Cấp lại quyền Seller"
                          ><FaStore /></button>
                        )
                      )}

                      <button 
                        className={`btn-action-inspect ${u.accountStatus === 'BANNED' ? 'unban-btn' : 'ban-btn'}`} 
                        onClick={() => onToggleStatus(u.id)}
                        title={u.accountStatus === 'BANNED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                      >
                        {u.accountStatus === 'BANNED' ? <FaUnlock /> : <FaBan />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-table-pagination-footer-wrapper">
        <div className="pagination-left-info">
          Hiển thị <strong>{users.length}</strong> / <strong>{totalElements}</strong> thành viên
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
            <span className="page-num">Trang <strong>{currentPage + 1}</strong> / {totalPages || 1}</span>
            <button disabled={currentPage >= totalPages - 1} onClick={() => onPageChange(currentPage + 1)} className="btn-pg">
              Sau <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTable;
