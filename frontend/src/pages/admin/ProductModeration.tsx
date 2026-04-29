import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaEye } from 'react-icons/fa';
import adminService from '../../services/admin.service';
import { toast } from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

const ProductModeration = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPendingProducts(); }, []);

  // 🚀 FIXED: Upgraded Media URL formatter to match the rest of the system perfectly
  const formatMediaUrl = (url?: string) => {
    if (!url || url === 'undefined' || url === 'null' || url === '') return "/placeholder.png";
    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${BASE_URL}${cleanPath}`;
  };

  const loadPendingProducts = async () => {
    try {
      setLoading(true);
      const data = await adminService.getPendingProducts();
      setProducts(data || []);
    } catch (err) {
      toast.error("Không thể tải danh sách sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await adminService.approveProduct(id);
      toast.success("Sản phẩm đã được duyệt!");
      loadPendingProducts();
    } catch (err) { toast.error("Lỗi duyệt sản phẩm."); }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt("Lý do từ chối sản phẩm này:");
    if (!reason) return;
    try {
      await adminService.rejectProduct(id, reason);
      toast.success("Đã từ chối sản phẩm.");
      loadPendingProducts();
    } catch (err) { toast.error("Lỗi thao tác."); }
  };

  if (loading) return <div className="tab-loading-spinner">Đang quét kho sản phẩm...</div>;

  return (
    <div className="moderation-container">
      <div className="moderation-header">
        <p>Hệ thống phát hiện <strong>{products.length}</strong> sản phẩm đang chờ lệnh phê duyệt.</p>
      </div>

      <div className="admin-table-container">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'center', width: '80px' }}>HÌNH ẢNH</th>
              <th style={{ textAlign: 'left' }}>TÊN SẢN PHẨM</th>
              <th style={{ textAlign: 'left' }}>NGƯỜI BÁN</th>
              <th style={{ textAlign: 'center' }}>GIÁ NIÊM YẾT</th>
              <th style={{ textAlign: 'center' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={5} className="empty-row" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Sạch bóng! Không có sản phẩm nào cần duyệt.</td></tr>
            ) : (
              products.map(p => (
                <tr key={p.id}>
                  
                  {/* 🚀 UPGRADED: Image Thumbnail Wrapper */}
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '50px', height: '50px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                      <img 
                        src={formatMediaUrl(p.imageUrls?.[0])} 
                        alt="product" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                      />
                    </div>
                  </td>
                  
                  <td>
                    <div className="admin-prod-name" style={{ fontWeight: 600, color: '#1e293b' }}>{p.name}</div>
                    <div className="admin-prod-id" style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>ID: {p.id}</div>
                  </td>
                  
                  <td><span className="admin-shop-badge" style={{ fontWeight: 500 }}>{p.shopName || 'N/A'}</span></td>
                  
                  <td style={{ textAlign: 'center' }}>
                    <strong className="admin-price-text" style={{ color: '#e74c3c' }}>{p.price?.toLocaleString()}₫</strong>
                  </td>
                  
                  {/* 🚀 UPGRADED: Premium Pill Buttons */}
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      
                      <button 
                        title="Xem trước" 
                        onClick={() => window.open(`/product/${p.id}`, '_blank')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                      >
                        <FaEye size={14} /> Xem
                      </button>

                      <button 
                        title="Duyệt" 
                        onClick={() => handleApprove(p.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                      >
                        <FaCheckCircle size={14} /> Duyệt
                      </button>

                      <button 
                        title="Từ chối" 
                        onClick={() => handleReject(p.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                      >
                        <FaTimesCircle size={14} /> Từ chối
                      </button>

                    </div>
                  </td>
                  
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductModeration;