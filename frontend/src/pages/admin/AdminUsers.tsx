import React, { useEffect, useState } from 'react';
import { 
  FaUserShield, FaUserSlash, FaSearch, FaShieldAlt, 
  FaCircle, FaSync, FaUsers 
} from 'react-icons/fa';
import adminService from '../../services/admin.service'; // Ensure this matches your export type
import UserPromotionModal from './UserPromotionModal';
import './AdminUsers.css'; // We will create a dedicated CSS for this page

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllUsers();
      // Adjust this based on your API response structure (res.data or res)
      const data = res.data || res;
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    /* 🚀 MASTER WRAPPER: Ensures consistent white box and padding */
    <div className="admin-dashboard-wrapper">
      
      {/* 🚀 SUPREME HEADER: Matches the Dashboard style */}
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
        {/* Search & Control Bar */}
        <div className="table-controls-row">
          <div className="admin-search-box-supreme">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo email hoặc tên người dùng..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={4} className="empty-row">Không tìm thấy người dùng nào.</td></tr>
                ) : (
                  filteredUsers.map(user => (
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