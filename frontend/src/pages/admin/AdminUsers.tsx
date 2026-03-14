import React, { useEffect, useState } from 'react';
import { FaUserShield, FaUserSlash, FaSearch, FaShieldAlt, FaCircle } from 'react-icons/fa';
import { adminService } from '../../services/admin.service';
import UserPromotionModal from './UserPromotionModal';
import './AdminDashboard.css';

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
      setUsers(res.data);
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

  if (loading) return <div className="admin-loading-state">Đang tải dữ liệu...</div>;

  return (
    <div className="admin-users-section">
      <div className="table-controls">
        <div className="admin-search-box">
          <FaSearch />
          <input 
            type="text" 
            placeholder="Tìm theo email hoặc tên..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-refresh" onClick={loadUsers}>Làm mới</button>
      </div>

      <table className="admin-dashboard-table">
        <thead>
          <tr>
            <th>Người dùng</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user.id} className={user.isGlobalAdmin ? 'row-highlight-global' : ''}>
              <td>
                <div className="user-info-cell">
                  <span className="name-bold">{user.fullName}</span>
                  <span className="email-sub">{user.email}</span>
                </div>
              </td>
              <td>
                <div className="badge-list">
                  {user.isGlobalAdmin && <span className="badge-global">GLOBAL ADMIN</span>}
                  {user.roles.map((role: string) => (
                    <span key={role} className={`badge-role ${role.toLowerCase()}`}>{role}</span>
                  ))}
                </div>
              </td>
              <td>
                <span className={`status-indicator ${user.accountStatus?.toLowerCase()}`}>
                  <FaCircle /> {user.accountStatus}
                </span>
              </td>
              <td className="actions-cell">
                {/* Global Admin cannot be modified to prevent self-lockout */}
                {!user.isGlobalAdmin && (
                  <div className="action-buttons-group">
                    <button 
                      className="action-btn-promote"
                      onClick={() => { setSelectedUser(user); setShowModal(true); }}
                      title="Phân quyền Admin"
                    >
                      <FaShieldAlt />
                    </button>
                    <button 
                      className="action-btn-ban"
                      onClick={() => { if(window.confirm('Khóa người dùng này?')) adminService.banUser(user.id).then(loadUsers); }}
                      title="Khóa tài khoản"
                    >
                      <FaUserSlash />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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