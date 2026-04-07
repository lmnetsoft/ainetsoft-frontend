import React from 'react';
import { FaSearch } from 'react-icons/fa';

interface UserTableProps {
  users: any[];
  userSearchTerm: string;
  setUserSearchTerm: (val: string) => void;
}

const UserTable: React.FC<UserTableProps> = ({ users, userSearchTerm, setUserSearchTerm }) => {
  const filteredUsers = users.filter(u => 
    u.fullName?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  return (
    <div className="admin-table-container">
      <div className="table-filter-header">
        <div className="search-box-wrapper">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm kiếm người dùng theo tên hoặc email..." 
            value={userSearchTerm}
            onChange={(e) => setUserSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <table className="admin-data-table">
        <thead>
          <tr>
            <th>Họ tên</th>
            <th>Email / SĐT</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Ngày tham gia</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length === 0 ? (
            <tr><td colSpan={5} className="empty-row">Không tìm thấy người dùng phù hợp.</td></tr>
          ) : (
            filteredUsers.map(u => (
              <tr key={u.id}>
                <td><strong>{u.fullName}</strong></td>
                <td><small>{u.email}<br/>{u.phone}</small></td>
                <td>{u.roles?.join(', ')}</td>
                <td><span className={`status-badge ${u.accountStatus?.toLowerCase()}`}>{u.accountStatus}</span></td>
                <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;