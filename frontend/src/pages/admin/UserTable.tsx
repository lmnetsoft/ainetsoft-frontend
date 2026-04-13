import React from 'react';
import { FaSearch, FaFilter, FaCircle, FaEnvelope, FaPhoneAlt, FaCalendarAlt, FaTimesCircle } from 'react-icons/fa';

interface UserTableProps {
  users: any; 
  userSearchTerm: string;
  setUserSearchTerm: (val: string) => void;
  // 🚀 PHASE 1: Received from parent for Auto-Refresh synchronization
  roleFilter: string;
  setRoleFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  onSearchTrigger: () => void;
}

const UserTable: React.FC<UserTableProps> = ({ 
  users, 
  userSearchTerm, 
  setUserSearchTerm, 
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  onSearchTrigger 
}) => {

  /**
   * 🚀 FIX: Extracts array from Spring Page object or handles raw array.
   * Prevents the white screen crash.
   */
  const userList = Array.isArray(users) ? users : (users?.content || []);

  const handleClearSearch = () => {
    setUserSearchTerm("");
    // Delay slightly to ensure state is clear before re-fetching
    setTimeout(() => onSearchTrigger(), 0);
  };

  return (
    <div className="admin-table-container-supreme">
      
      {/* 🚀 ELITE FILTER BAR: Stretched with Auto-Trigger logic */}
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
          {/* 🚀 NEW: Quick Clear Button */}
          {userSearchTerm && (
            <button className="clear-search-btn" onClick={handleClearSearch} title="Xóa tìm kiếm">
              <FaTimesCircle />
            </button>
          )}
        </div>

        <div className="filter-group-colorful">
          {/* 🚀 Role Dropdown: Updates parent state to trigger auto-fetch */}
          <div className={`select-wrapper-colorful role-${roleFilter.toLowerCase()}`}>
            <FaFilter className="icon-filter" />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="ALL">Tất cả Vai trò</option>
              <option value="USER">USER</option>
              <option value="SELLER">SELLER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          {/* 🚀 Status Dropdown: Updates parent state to trigger auto-fetch */}
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

      <table className="admin-data-table-supreme">
        <thead>
          <tr>
            <th>HỌ TÊN</th>
            <th>EMAIL / SĐT</th>
            <th>VAI TRÒ</th>
            <th>TRẠNG THÁI</th>
            <th style={{ textAlign: 'right' }}>NGÀY THAM GIA</th>
          </tr>
        </thead>
        <tbody>
          {userList.length === 0 ? (
            <tr><td colSpan={5} className="empty-row-visual">Không tìm thấy kết quả phù hợp.</td></tr>
          ) : (
            userList.map((u: any) => (
              <tr key={u.id}>
                <td><strong className="user-primary-name">{u.fullName}</strong></td>
                <td>
                  <div className="contact-cell">
                    <span><FaEnvelope className="tiny-icon" /> {u.email}</span>
                    <span className="sub-contact"><FaPhoneAlt className="tiny-icon" /> {u.phone || 'N/A'}</span>
                  </div>
                </td>
                <td>
                  <div className="role-badge-stack">
                    {u.roles?.map((r: string) => (
                      <span key={r} className={`badge-role-tag-colorful ${r.toLowerCase()}`}>
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <span className={`status-pill-colorful ${u.accountStatus?.toLowerCase()}`}>
                    <FaCircle className="dot" /> {u.accountStatus || 'ACTIVE'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }} className="date-cell">
                  <FaCalendarAlt className="tiny-icon" /> {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '13/4/2026'}
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