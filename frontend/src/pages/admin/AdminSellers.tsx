import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/admin.service';
import ToastNotification from '../../components/Toast/ToastNotification';
import { FaCheckCircle, FaTimesCircle, FaUserClock } from 'react-icons/fa';

interface PendingSeller {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  roles: string[];
}

const AdminSellers = () => {
  const [sellers, setSellers] = useState<PendingSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 1. Fetch the pending sellers when the page loads
  const fetchPendingSellers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getPendingSellers();
      setSellers(data);
    } catch (error: any) {
      console.error("Failed to fetch sellers:", error);
      setToastMessage("Không thể tải danh sách người bán chờ duyệt.");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingSellers();
    document.title = "Duyệt Người Bán | Admin AiNetsoft";
  }, []);

  // 2. Handle the Approve/Reject Action
  const handleAction = async (sellerId: string, isApproved: boolean) => {
    try {
      // Call the backend service
      await adminService.approveSeller(sellerId, isApproved);
      
      // Show success message
      setToastMessage(isApproved ? "Đã phê duyệt người bán thành công!" : "Đã từ chối người bán.");
      setShowToast(true);
      
      // Remove the processed user from the UI immediately
      setSellers(prev => prev.filter(seller => seller.id !== sellerId));
    } catch (error: any) {
      console.error("Action failed:", error);
      setToastMessage("Có lỗi xảy ra khi xử lý yêu cầu.");
      setShowToast(true);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
        <FaUserClock size={32} color="#5b67f1" />
        <h2 style={{ margin: 0, color: '#1e293b' }}>Quản lý Yêu cầu Mở Shop</h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '15px', color: '#64748b' }}>Đang tải dữ liệu...</p>
        </div>
      ) : sellers.length === 0 ? (
        <div style={{ background: '#fff', padding: '60px 20px', textAlign: 'center', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <FaUserClock size={48} color="#cbd5e1" style={{ marginBottom: '15px' }} />
          <h3 style={{ color: '#475569', margin: 0 }}>Không có yêu cầu nào đang chờ xử lý.</h3>
          <p style={{ color: '#94a3b8', marginTop: '10px' }}>Tất cả các tài khoản đăng ký bán hàng đã được duyệt.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '15px 20px', color: '#475569', fontWeight: '600' }}>Người dùng</th>
                <th style={{ padding: '15px 20px', color: '#475569', fontWeight: '600' }}>Email liên hệ</th>
                <th style={{ padding: '15px 20px', color: '#475569', fontWeight: '600' }}>Số điện thoại</th>
                <th style={{ padding: '15px 20px', color: '#475569', fontWeight: '600', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((seller) => (
                <tr key={seller.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '20px', fontWeight: '500', color: '#1e293b' }}>
                    {seller.fullName}
                  </td>
                  <td style={{ padding: '20px', color: '#64748b' }}>
                    {seller.email}
                  </td>
                  <td style={{ padding: '20px', color: '#64748b' }}>
                    {seller.phone || 'Chưa cập nhật'}
                  </td>
                  <td style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                      <button 
                        onClick={() => handleAction(seller.id, true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                      >
                        <FaCheckCircle /> Duyệt
                      </button>
                      <button 
                        onClick={() => handleAction(seller.id, false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#fff', color: '#ef4444', border: '1px solid #ef4444', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                      >
                        <FaTimesCircle /> Từ chối
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminSellers;