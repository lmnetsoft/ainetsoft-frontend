import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaEye, FaBoxOpen } from 'react-icons/fa';
import adminService from '../../services/admin.service';
import { toast } from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

const ProductModeration = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPendingProducts(); }, []);

  const formatMediaUrl = (url?: string) => {
    if (!url || url === 'undefined' || url === 'null') return "/placeholder.png";
    if (url.startsWith('http')) return url;
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
        <h3><FaBoxOpen /> Phê duyệt Sản Phẩm</h3>
        <p>Hệ thống phát hiện {products.length} sản phẩm đang chờ lệnh phê duyệt.</p>
      </div>

      <div className="admin-table-container">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>Hình ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Người bán</th>
              <th>Giá niêm yết</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={5} className="empty-row">Sạch bóng! Không có sản phẩm nào cần duyệt.</td></tr>
            ) : (
              products.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="admin-prod-thumb">
                      <img src={formatMediaUrl(p.imageUrls?.[0])} alt="product" />
                    </div>
                  </td>
                  <td>
                    <div className="admin-prod-name">{p.name}</div>
                    <div className="admin-prod-id">ID: {p.id}</div>
                  </td>
                  <td><span className="admin-shop-badge">{p.shopName || 'N/A'}</span></td>
                  <td><strong className="admin-price-text">{p.price?.toLocaleString()}₫</strong></td>
                  <td className="action-btns">
                    <button className="btn-table-success" title="Duyệt" onClick={() => handleApprove(p.id)}>
                      <FaCheck />
                    </button>
                    <button className="btn-table-danger" title="Từ chối" onClick={() => handleReject(p.id)}>
                      <FaTimes />
                    </button>
                    <button className="btn-table-view" title="Xem trước" onClick={() => window.open(`/product/${p.id}`, '_blank')}>
                      <FaEye />
                    </button>
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