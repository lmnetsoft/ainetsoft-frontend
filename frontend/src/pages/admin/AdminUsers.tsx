import React, { useEffect, useState, useCallback } from 'react';
import { 
  FaUsers, FaSync 
} from 'react-icons/fa';
import adminService from '../../services/admin.service';
import UserTable from './UserTable'; // Using the refined component
import UserPromotionModal from './UserPromotionModal';
import UserProfileModal from './UserProfileModal';
import { toast } from 'react-hot-toast';
import './AdminUsers.css';

const AdminUsers: React.FC = () => {
  const [usersData, setUsersData] = useState<any>(null); // Stores the full Page object
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Pagination States
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modal States
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // 🚀 Fetch users whenever filters, page, or pageSize changes
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        role: roleFilter === "ALL" ? "" : roleFilter,
        status: statusFilter === "ALL" ? "" : statusFilter,
        page: page,
        size: pageSize
      };

      const res = await adminService.getAllUsers(params);
      
      // Store the whole response for UserTable to handle
      setUsersData(res); 
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng:", error);
      toast.error("Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter, statusFilter, page, pageSize]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // --- LOGIC HANDLERS ---

  const handleViewProfile = async (userId: string) => {
    try {
      const fullUser = await adminService.getUserDetails(userId);
      setSelectedUser(fullUser);
      setShowProfileModal(true);
    } catch (err) {
      toast.error("Không thể tải thông tin chi tiết hồ sơ.");
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const msg = await adminService.toggleUserStatus(userId);
      toast.success(msg);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Lỗi thay đổi trạng thái.");
    }
  };

  const handleRevokeSeller = async (userId: string) => {
    const reason = window.prompt("Nhập lý do thu hồi quyền Người bán:");
    if (reason === null) return;
    if (!reason.trim()) { toast.error("Vui lòng nhập lý do."); return; }
    
    try {
      const msg = await adminService.revokeSellerRights(userId, reason);
      toast.success(msg);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Lỗi thu hồi quyền.");
    }
  };

  const handleRestoreSeller = async (userId: string) => {
    try {
      const msg = await adminService.restoreSellerRights(userId);
      toast.success(msg);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khôi phục quyền.");
    }
  };

  const handlePromote = (userId: string) => {
    setSelectedUser({ id: userId });
    setShowPromotionModal(true);
  };

  const handleDemote = async (userId: string) => {
    try {
      const msg = await adminService.demoteFromAdmin(userId);
      toast.success(msg);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Lỗi thu hồi quyền Admin.");
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
        {loading && !usersData ? (
          <div className="loading-placeholder">Đang tải danh sách người dùng...</div>
        ) : (
          <UserTable 
            users={usersData}
            userSearchTerm={searchTerm}
            setUserSearchTerm={setSearchTerm}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onSearchTrigger={() => { setPage(0); loadUsers(); }}
            onView={handleViewProfile}
            onPromote={(id) => handlePromote(id)}
            onDemote={handleDemote}
            onToggleStatus={handleToggleStatus}
            onRevokeSeller={handleRevokeSeller}
            onRestoreSeller={handleRestoreSeller} // 🚀 NEW FUNCTION LINKED
            
            // Pagination Props
            currentPage={page}
            pageSize={pageSize}
            totalElements={totalElements}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => { setPageSize(newSize); setPage(0); }}
          />
        )}
      </div>

      {/* MODALS */}
      {showPromotionModal && selectedUser && (
        <UserPromotionModal 
          user={selectedUser} 
          onClose={() => setShowPromotionModal(false)} 
          onSuccess={() => {
            setShowPromotionModal(false);
            loadUsers();
          }} 
        />
      )}

      {showProfileModal && selectedUser && (
        <UserProfileModal 
          user={selectedUser} 
          onClose={() => setShowProfileModal(false)} 
        />
      )}
    </div>
  );
};

export default AdminUsers;