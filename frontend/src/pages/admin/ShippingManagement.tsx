import React, { useState, useEffect } from 'react';
import { 
  FaTruck, FaPlus, FaTrash, FaEdit, FaChevronDown, FaChevronUp, 
  FaTimes, FaShippingFast 
} from 'react-icons/fa';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import adminService from '../../services/admin.service';
import { toast } from 'react-hot-toast';
import './AdminDashboard.css';
import './ShippingManagement.css';

const ShippingManagement = () => {
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    baseCost: 0,
    estimatedTime: '',
    active: true // Unified to 'active'
  });

  useEffect(() => {
    fetchData(true); // Initial load with spinner
  }, []);

  const fetchData = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      const data = await adminService.getAllShippingMethods();
      setMethods(data);
    } catch (error) {
      toast.error("Không thể tải danh sách vận chuyển");
    } finally {
      setLoading(false);
    }
  };

  /**
   * OPTIMISTIC UPDATE:
   * Changes the UI state immediately so the button moves slightly/smoothly
   * without triggering a full-page reload or list jump.
   */
  const handleToggleActive = async (e: React.MouseEvent | null, method: any) => {
    if (e) e.stopPropagation(); 

    const originalMethods = [...methods]; // Backup for rollback if API fails
    const newStatus = !method.active;

    // 1. Update UI state immediately (Smooth & Static)
    setMethods(prev => prev.map(m => 
      m.id === method.id ? { ...m, active: newStatus } : m
    ));

    try {
      // 2. Perform background API call
      await adminService.updateShippingMethod(method.id, { ...method, active: newStatus });
      toast.success(`Đã ${newStatus ? 'kích hoạt' : 'tắt'} ${method.name}`);
    } catch (error) {
      // 3. Rollback if backend update fails
      setMethods(originalMethods);
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  const handleOpenModal = (method: any = null) => {
    if (method) {
      setForm({ ...method });
      setEditingId(method.id);
    } else {
      setForm({ name: '', description: '', baseCost: 0, estimatedTime: '', active: true });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminService.updateShippingMethod(editingId, form);
        toast.success("Cập nhật thành công");
      } else {
        await adminService.createShippingMethod(form);
        toast.success("Thêm mới thành công");
      }
      setShowModal(false);
      fetchData(false); // Silent refresh
    } catch (error) {
      toast.error("Lỗi khi lưu dữ liệu");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Xác nhận xóa đơn vị vận chuyển này?")) return;
    try {
      await adminService.deleteShippingMethod(id);
      toast.success("Đã xóa vĩnh viễn");
      fetchData(false); // Silent refresh
    } catch (error) {
      toast.error("Không thể xóa phương thức đang sử dụng");
    }
  };

  const toggleAccordion = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="admin-master-layout shipping-management-page">
      <div className="sidebar-fixed-column">
        <AccountSidebar />
      </div>
      
      <main className="admin-main-view">
        <div className="admin-dashboard-wrapper">
          <header className="admin-page-header">
            <div className="header-left">
              <h1><FaTruck /> Phương thức vận chuyển</h1>
              <div className="badge-container">
                <span className="master-badge">LOGISTICS</span>
                <span className="status-dot">Hệ thống đang hoạt động</span>
              </div>
            </div>
            <button className="btn-refresh" onClick={() => handleOpenModal()}>
              <FaPlus /> Thêm đơn vị mới
            </button>
          </header>

          <div className="shipping-config-section">
            <p className="section-desc">Kích hoạt và cấu hình các phương thức vận chuyển phù hợp cho toàn sàn.</p>
            
            {/* FIXED: Conditional loading. 
              Only shows spinner if we have NO data yet. 
              This prevents the UI from "jumping" during toggles.
            */}
            {loading && methods.length === 0 ? (
              <div className="tab-loading-spinner">Đang đồng bộ dữ liệu...</div>
            ) : (
              <div className="shipping-methods-list">
                {methods.map((m) => (
                  <div key={m.id} className={`shipping-method-item ${!m.active ? 'is-disabled' : ''}`}>
                    <div className="method-main-row" onClick={() => toggleAccordion(m.id)}>
                      <div className="method-info-title">
                        <FaShippingFast className="method-icon-bg" />
                        <span>{m.name}</span>
                      </div>
                      
                      <div className="method-controls">
                        <div className="thu-gon-wrapper">
                          <button className="thu-gon-btn">
                            {expandedId === m.id ? 'Thu gọn' : 'Chi tiết'} 
                            {expandedId === m.id ? <FaChevronUp /> : <FaChevronDown />}
                          </button>
                        </div>
                        
                        <div className="toggle-switch-wrapper" onClick={(e) => e.stopPropagation()}>
                          <label className="admin-switch">
                            <input 
                              type="checkbox" 
                              checked={m.active} 
                              onChange={() => handleToggleActive(null, m)} 
                            />
                            <span className="admin-slider round"></span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {expandedId === m.id && (
                      <div className="method-details-panel">
                        <div className="details-grid">
                          <div className="detail-item">
                            <label>Mô tả:</label>
                            <p>{m.description}</p>
                          </div>
                          <div className="detail-item">
                            <label>Giá cơ bản:</label>
                            <p>{m.baseCost.toLocaleString()} VNĐ</p>
                          </div>
                          <div className="detail-item">
                            <label>Ước tính:</label>
                            <p>{m.estimatedTime}</p>
                          </div>
                        </div>
                        <div className="panel-actions">
                          <button className="btn-edit-ship" onClick={() => handleOpenModal(m)}><FaEdit /> Chỉnh sửa</button>
                          <button className="btn-delete-ship" onClick={(e) => handleDelete(e, m.id)}><FaTrash /> Xóa</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="add-more-container">
                    <div className="add-more-placeholder" onClick={() => handleOpenModal()}>
                      <div className="plus-icon-circle"><FaPlus /></div>
                      <span>Thêm Đơn Vị Vận Chuyển</span>
                      <p>Các đơn vị vận chuyển khác được AiNetsoft hỗ trợ</p>
                    </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="seller-review-modal" style={{maxWidth: '500px'}}>
            <div className="modal-header">
              <div className="header-title">
                <FaTruck className="title-icon" />
                <h3>{editingId ? 'Cấu hình đơn vị' : 'Thêm đơn vị mới'}</h3>
              </div>
              <button className="close-btn" onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="review-grid" style={{gridTemplateColumns: '1fr', padding: '25px'}}>
                <div className="form-group-admin">
                  <label>Tên hiển thị</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="vd: Hỏa Tốc" />
                </div>
                <div className="form-group-admin">
                  <label>Mô tả ngắn</label>
                  <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="vd: Nhận hàng trong 2 giờ" />
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                  <div className="form-group-admin">
                    <label>Giá gốc (VNĐ)</label>
                    <input required type="number" value={form.baseCost} onChange={e => setForm({...form, baseCost: Number(e.target.value)})} />
                  </div>
                  <div className="form-group-admin">
                    <label>Thời gian ước tính</label>
                    <input required value={form.estimatedTime} onChange={e => setForm({...form, estimatedTime: e.target.value})} placeholder="vd: 2-3 ngày" />
                  </div>
                </div>
              </div>
              
              <div className="modal-footer-actions">
                <div className="button-group">
                  <button type="button" className="btn-reject-modal" onClick={() => setShowModal(false)}>Hủy</button>
                  <button type="submit" className="btn-approve-modal">Lưu cấu hình</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingManagement;