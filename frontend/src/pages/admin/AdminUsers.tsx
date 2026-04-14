import React, { useEffect, useState } from 'react';
import { 
  FaUserShield, FaUserSlash, FaSearch, FaShieldAlt, 
  FaCircle, FaSync, FaUsers, FaFilter 
} from 'react-icons/fa';
import adminService from '../../services/admin.service';
import UserPromotionModal from './UserPromotionModal';
import './AdminUsers.css';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🚀 PHASE 1: FILTER STATES
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Pagination State
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  // 🚀 Fetch users whenever filters or page changes
  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter, page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        role: roleFilter === "ALL" ? "" : roleFilter,
        status: statusFilter === "ALL" ? "" : statusFilter,
        page: page,
        size: 10
      };

      const res = await adminService.getAllUsers(params);
      
      // Backend now returns Page<User>, so we access .content
      setUsers(res.content || []);
      setTotalPages(res.totalPages || 0);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Search Input (with Enter key support)
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        setPage(0);
        loadUsers();
    }
  };

  return (
    <div className="admin-dashboard-wrapper">
      
      <header className="admin-page-header">
        <div className="header-left">
          <h1><FaUsers style={{marginRight: '12px', fontSize: '22px'}} /> QUẢN LÝ NGƯỜI DÙNG</h1>
          <p>Xem danh sách, phân quyền và quản lý trạng thái tài khoản thành viên.</p>
        </div>
        <button className="btn-refresh" onClick={loadUsers} disabled={loading}>
          <FaSync className={loading ? 'spin' : ''} />
          <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
        </button>
      </header>

      <div className="admin-content-body">
        
        {/* 🚀 PHASE 1: ENHANCED FILTER BAR */}
        <div className="table-controls-row" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div className="admin-search-box-supreme" style={{ flex: 2, minWidth: '300px' }}>
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Nhấn Enter để tìm theo email hoặc tên..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearchKeyPress}
            />
          </div>

          <div className="filter-group-elite" style={{ display: 'flex', gap: '10px' }}>
            <div className="select-wrapper-supreme">
               <FaFilter className="select-icon" />
               <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}>
                  <option value="ALL">Tất cả Vai trò</option>
                  <option value="USER">Người dùng (USER)</option>
                  <option value="SELLER">Người bán (SELLER)</option>
                  <option value="ADMIN">Quản trị (ADMIN)</option>
               </select>
            </div>

            <div className="select-wrapper-supreme">
               <FaCircle className="select-icon" style={{ fontSize: '10px' }} />
               <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                  <option value="ALL">Tất cả Trạng thái</option>
                  <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                  <option value="BANNED">Đang bị khóa (BANNED)</option>
                  <option value="PENDING_SELLER">Chờ duyệt Shop</option>
               </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-placeholder">Đang tải danh sách người dùng...</div>
        ) : (
          <div className="admin-table-container-supreme">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Thành viên</th>
                  <th>Vai trò hệ thống</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={4} className="empty-row">Không tìm thấy người dùng nào khớp với bộ lọc.</td></tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id} className={user.isGlobalAdmin ? 'row-global-admin' : ''}>
                      <td>
                        <div className="user-info-cell">
                          <span className="user-name-text">{user.fullName}</span>
                          <span className="user-email-text">{user.email}</span>
                        </div>
                      </td>
                      <td>
                        <div className="badge-list-supreme">
                          {user.isGlobalAdmin && <span className="badge-master">GLOBAL ADMIN</span>}
                          {user.roles && user.roles.map((role: string) => (
                            <span key={role} className={`badge-role-tag ${role.toLowerCase()}`}>
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${user.accountStatus?.toLowerCase()}`}>
                          <FaCircle className="dot-icon" /> {user.accountStatus || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="actions-cell-right">
                        {!user.isGlobalAdmin && (
                          <div className="action-btn-group">
                            <button 
                              className="btn-action promote"
                              onClick={() => { setSelectedUser(user); setShowModal(true); }}
                              title="Phân quyền Admin"
                            >
                              <FaShieldAlt />
                            </button>
                            <button 
                              className="btn-action ban"
                              onClick={() => { if(window.confirm('Khóa người dùng này?')) adminService.banUser(user.id).then(loadUsers); }}
                              title="Khóa tài khoản"
                            >
                              <FaUserSlash />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Simple Pagination Controls */}
            {totalPages > 1 && (
                <div className="admin-pagination-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <button disabled={page === 0} onClick={() => setPage(page - 1)} className="btn-page-nav">Trước</button>
                    <span style={{ alignSelf: 'center' }}>Trang {page + 1} / {totalPages}</span>
                    <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} className="btn-page-nav">Sau</button>
                </div>
            )}
          </div>
        )}
      </div>

      {showModal && selectedUser && (
        <UserPromotionModal 
          user={selectedUser} 
          onClose={() => setShowModal(false)} 
          onSuccess={() => {
            setShowModal(false);
            loadUsers();
          }} 
        />
      )}
    </div>
  );
};

export default AdminUsers;