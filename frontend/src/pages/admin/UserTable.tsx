import React from 'react';
import { 
  FaSearch, FaFilter, FaCircle, FaEnvelope, FaPhoneAlt, 
  FaCalendarAlt, FaTimesCircle, FaEye,
  FaUserShield, FaBan, FaUnlock, FaStoreSlash 
} from 'react-icons/fa';

interface UserTableProps {
  users: any; 
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
}

const UserTable: React.FC<UserTableProps> = ({ 
  users, 
  userSearchTerm, 
  setUserSearchTerm, 
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  onSearchTrigger,
  onView,
  onPromote,
  onDemote, 
  onToggleStatus,
  onRevokeSeller
}) => {

  const userList = Array.isArray(users) ? users : (users?.content || []);

  const handleClearSearch = () => {
    setUserSearchTerm("");
    setTimeout(() => onSearchTrigger(), 0);
  };

  return (
    <div className="admin-table-container-supreme">
      
      {/* Search and Filters Header */}
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
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="ALL">Tất cả Vai trò</option>
              <option value="USER">USER</option>
              <option value="SELLER">SELLER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div className={`select-wrapper-colorful status-${statusFilter.toLowerCase()}`}>
            <FaCircle className="icon-dot" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">Tất cả Trạng thái</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="BANNED">BANNED</option>
              <option value="PENDING_SELLER">PENDING</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <table className="admin-data-table-supreme">
        <thead>
          <tr>
            <th>HỌ TÊN</th>
            <th>EMAIL / SĐT</th>
            <th>VAI TRÒ</th>
            <th>TRẠNG THÁI</th>
            <th>NGÀY THAM GIA</th>
            <th style={{ textAlign: 'right' }}>THAO TÁC</th>
          </tr>
        </thead>
        <tbody>
          {userList.length === 0 ? (
            <tr><td colSpan={6} className="empty-row-visual">Không tìm thấy kết quả phù hợp.</td></tr>
          ) : (
            userList.map((u: any) => (
              <tr key={u.id}>
                {/* Full Name */}
                <td><strong className="user-primary-name">{u.fullName}</strong></td>
                
                {/* NEW: Updated Colorful Email / SĐT Badges */}
                <td>
                  <div className="contact-info-stack">
                    <span className="contact-badge email-pill">
                      <FaEnvelope className="contact-icon" /> {u.email}
                    </span>
                    <span className="contact-badge phone-pill">
                      <FaPhoneAlt className="contact-icon" /> {u.phone || 'N/A'}
                    </span>
                  </div>
                </td>

                {/* NEW: Updated Colorful Role Badges (No Bold) */}
                <td>
                  <div className="role-badge-stack">
                    {u.roles?.map((r: string) => (
                      <span key={r} className={`badge-role-tag-colorful ${r.toLowerCase()}`}>
                        {r}
                      </span>
                    ))}
                  </div>
                </td>

                {/* Account Status Pill */}
                <td>
                  <span className={`status-pill-colorful ${u.accountStatus?.toLowerCase()}`}>
                    <FaCircle className="dot" /> {u.accountStatus || 'ACTIVE'}
                  </span>
                </td>

                {/* Join Date Badge */}
                <td className="date-cell">
                   <span className="date-pill">
                      <FaCalendarAlt className="tiny-icon" /> {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '14/4/2026'}
                   </span>
                </td>
                
                {/* Action Buttons */}
                <td style={{ textAlign: 'right' }}>
                  <div className="action-button-group-supreme">
                    <button 
                      className="btn-action-inspect" 
                      onClick={() => onView(u.id)}
                      title="Xem chi tiết hồ sơ"
                    >
                      <FaEye />
                    </button>

                    {!u.roles?.includes('ADMIN') && (
                      <button 
                        className="btn-action-inspect promote-btn" 
                        onClick={() => {
                          const perms = ["MANAGE_USERS", "MANAGE_PRODUCTS", "MANAGE_REPORTS"];
                          if(window.confirm(`Xác nhận cấp quyền Quản trị cho ${u.fullName}?`)) {
                            onPromote(u.id, perms);
                          }
                        }}
                        title="Nâng cấp lên Admin"
                      >
                        <FaUserShield />
                      </button>
                    )}

                    {u.roles?.includes('ADMIN') && u.email !== 'admin@ainetsoft.com' && (
                      <button 
                        className="btn-action-inspect demote-btn" 
                        onClick={() => {
                          if(window.confirm(`Xác nhận thu hồi quyền Quản trị của ${u.fullName}?`)) {
                            onDemote(u.id);
                          }
                        }}
                        title="Hạ cấp xuống Người dùng"
                      >
                        <FaUserShield style={{ color: '#ff4d4f' }} />
                      </button>
                    )}

                    {u.roles?.includes('SELLER') && (
                      <button 
                        className="btn-action-inspect revoke-btn" 
                        onClick={() => onRevokeSeller(u.id)}
                        title="Thu hồi quyền Người bán"
                      >
                        <FaStoreSlash />
                      </button>
                    )}

                    {u.email !== 'admin@ainetsoft.com' && (
                      <button 
                        className={`btn-action-inspect ${u.accountStatus === 'BANNED' ? 'unban-btn' : 'ban-btn'}`}
                        onClick={() => onToggleStatus(u.id)}
                        title={u.accountStatus === 'BANNED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                      >
                        {u.accountStatus === 'BANNED' ? <FaUnlock /> : <FaBan />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;