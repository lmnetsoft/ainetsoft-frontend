import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service';
import { toast } from 'react-hot-toast';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sellers' | 'products'>('sellers');
  const [pendingSellers, setPendingSellers] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'sellers') {
      fetchSellers();
    }
  }, [activeTab]);

  const fetchSellers = async () => {
    try {
      const res = await adminService.getPendingSellers();
      setPendingSellers(res.data);
    } catch (err) {
      toast.error("Không thể tải danh sách chờ duyệt.");
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await adminService.processSeller(userId, true, "Hồ sơ hợp lệ");
      toast.success("Đã phê duyệt người bán!");
      fetchSellers(); // Refresh list
    } catch (err) {
      toast.error("Lỗi khi xử lý phê duyệt.");
    }
  };

  return (
    <div className="admin-container p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Bảng điều khiển Admin</h1>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button 
          onClick={() => setActiveTab('sellers')}
          className={`py-2 px-6 ${activeTab === 'sellers' ? 'border-b-2 border-orange-500 text-orange-600 font-medium' : 'text-gray-500'}`}
        >
          Duyệt Người Bán ({pendingSellers.length})
        </button>
        <button 
          onClick={() => setActiveTab('products')}
          className={`py-2 px-6 ${activeTab === 'products' ? 'border-b-2 border-orange-500 text-orange-600 font-medium' : 'text-gray-500'}`}
        >
          Duyệt Sản Phẩm
        </button>
      </div>

      {activeTab === 'sellers' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên người dùng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email/Phone</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pendingSellers.map(seller => (
                <tr key={seller.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{seller.fullName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{seller.email || seller.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleApprove(seller.id)}
                      className="text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-all"
                    >
                      Duyệt Shop
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pendingSellers.length === 0 && (
            <div className="text-center py-12 text-gray-400">Hiện không có yêu cầu nào cần xử lý.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;