import React, { useEffect, useState, useCallback, useRef } from 'react';
import { FaUsers, FaSync } from 'react-icons/fa';
import adminService from '../../services/admin.service';
import UserTable from './UserTable'; 
import UserPromotionModal from './UserPromotionModal';
import UserProfileModal from './UserProfileModal';
import { toast } from 'react-hot-toast';
import './AdminDashboard.css';

const AdminUsers: React.FC = () => {
  const topRef = useRef<HTMLDivElement>(null);
  const [usersData, setUsersData] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

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

      const [res, summary] = await Promise.all([
        adminService.getAllUsers(params),
        adminService.getDashboardSummary().catch(() => null)
      ]);
      
      const payload = res?.data || res;
      const content = payload?.content || (Array.isArray(payload) ? payload : []);
      
      let totalElems = payload?.totalElements;
      if (totalElems === undefined) totalElems = payload?.totalItems;
      if (totalElems === undefined || totalElems === null) {
          const isFiltering = searchTerm !== "" || roleFilter !== "ALL" || statusFilter !== "ALL";
          totalElems = isFiltering ? content.length : (summary?.totalUsers || content.length);
      }

      const calculatedPages = Math.ceil(totalElems / pageSize) || 1;
      const totalPgs = payload?.totalPages !== undefined ? payload.totalPages : calculatedPages;

      setUsersData(content); 
      setTotalElements(totalElems);
      setTotalPages(totalPgs);
    } catch (error) {
      toast.error("Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter, statusFilter, page, pageSize]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // 🚀 LOGIC TỰ ĐỘNG CUỘN TRANG (SMOOTH SCROLL)
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setTimeout(() => {
      if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(0);
    setTimeout(() => {
      if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const handleViewProfile = async (userId: string) => {
    try {
      const fullUser = await adminService.getUserDetails(userId);
      setSelectedUser(fullUser);
      setShowProfileModal(true);
    } catch (err) { toast.error("Không thể tải thông tin chi tiết hồ sơ."); }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const msg = await adminService.toggleUserStatus(userId);
      toast.success(msg);
      loadUsers();
    } catch (err: any) { toast.error(err.message || "Lỗi thay đổi trạng thái."); }
  };

  const handleRevokeSeller = async (userId: string) => {
    const reason = window.prompt("Nhập lý do thu hồi quyền Người bán:");
    if (reason === null) return;
    if (!reason.trim()) { toast.error("Vui lòng nhập lý do."); return; }
    try {
      const msg = await adminService.revokeSellerRights(userId, reason);
      toast.success(msg);
      loadUsers();
    } catch (err: any) { toast.error(err.message || "Lỗi thu hồi quyền."); }
  };

  const handleRestoreSeller = async (userId: string) => {
    try {
      const msg = await adminService.restoreSellerRights(userId);
      toast.success(msg);
      loadUsers();
    } catch (err: any) { toast.error(err.message || "Lỗi khôi phục quyền."); }
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
    } catch (err: any) { toast.error(err.message || "Lỗi thu hồi quyền Admin."); }
  };

  return (
    <div className="admin-dashboard-wrapper" ref={topRef}>
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
        {loading && (!usersData || usersData.length === 0) ? (
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
            onRestoreSeller={handleRestoreSeller} 
            
            currentPage={page}
            pageSize={pageSize}
            totalElements={totalElements}
            totalPages={totalPages}
            onPageChange={handlePageChange} 
            onPageSizeChange={handlePageSizeChange} 
          />
        )}
      </div>

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
