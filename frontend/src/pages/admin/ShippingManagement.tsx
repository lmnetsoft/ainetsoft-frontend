import React, { useState, useEffect } from 'react';
import { 
  FaTruck, FaPlus, FaTrash, FaEdit, FaChevronDown, FaChevronUp, 
  FaTimes, FaShippingFast, FaSync 
} from 'react-icons/fa';
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
    active: true 
  });

  useEffect(() => {
    fetchData(true); 
  }, []);

  const fetchData = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      const data = await adminService.getAllShippingMethods();
      setMethods(data || []);
      if (!isInitialLoad) toast.success("Dữ liệu vận chuyển đã đồng bộ");
    } catch (error) {
      toast.error("Không thể tải danh sách vận chuyển");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (e: React.MouseEvent | null, method: any) => {
    if (e) e.stopPropagation(); 
    const newStatus = !method.active;
    try {
      await adminService.updateShippingMethod(method.id, { ...method, active: newStatus });
      setMethods(prev => prev.map(m => m.id === method.id ? { ...m, active: newStatus } : m));
      toast.success(`Đã ${newStatus ? 'kích hoạt' : 'tắt'} ${method.name}`);
    } catch (error) {
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
      fetchData(false); 
    } catch (error) {
      toast.error("Lỗi khi lưu dữ liệu");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Xóa đơn vị vận chuyển này?")) return;
    try {
      await adminService.deleteShippingMethod(id);
      toast.success("Đã xóa vĩnh viễn");
      fetchData(false); 
    } catch (error) {
      toast.error("Không thể xóa phương thức đang sử dụng");
    }
  };

  if (loading && methods.length === 0) return <div className="admin-loading-state">Đang đồng bộ cấu hình vận chuyển...</div>;

  return (
    /* 🟢 root div is now the standard wrapper */
    <div className="admin-dashboard-wrapper">
      <header className="admin-page-header">
        <div className="header-left">
          <h1><FaTruck /> Cấu hình vận chuyển</h1>
          <div className="badge-container">
            <span className="master-badge">LOGISTICS</span>
            <span className="status-dot">Online</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-refresh" onClick={() => fetchData(false)}>
                <FaSync /> Làm mới
            </button>
            <button className="btn-add-reason" onClick={() => handleOpenModal()}>
                <FaPlus /> Thêm đơn vị
            </button>
        </div>
      </header>

      <div className="shipping-config-section">
        <p className="subtitle" style={{ marginBottom: '25px' }}>
           Kích hoạt và cấu hình các phương thức vận chuyển cho toàn sàn AiNetsoft.
        </p>
        
        <div className="shipping-methods-list">
          {methods.map((m) => (
            <div key={m.id} className={`shipping-method-item ${!m.active ? 'is-disabled' : ''}`}>
              <div className="method-main-row" onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}>
                <div className="method-info-title">
                  <FaShippingFast className="method-icon-bg" />
                  <span className="name-bold">{m.name}</span>
                </div>
                
                <div className="method-controls">
                  <button className="thu-gon-btn">
                    {expandedId === m.id ? <><FaChevronUp /> Thu gọn</> : <><FaChevronDown /> Chi tiết</>}
                  </button>
                  
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
                      <label>Mô tả dịch vụ:</label>
                      <p>{m.description}</p>
                    </div>
                    <div className="detail-item">
                      <label>Phí vận chuyển cơ bản:</label>
                      <p className="metric-value" style={{ fontSize: '1.2rem', color: '#2d3436' }}>
                        {m.baseCost.toLocaleString()} VNĐ
                      </p>
                    </div>
                    <div className="detail-item">
                      <label>Thời gian giao hàng dự kiến:</label>
                      <p><strong>{m.estimatedTime}</strong></p>
                    </div>
                  </div>
                  <div className="panel-actions">
                    <button className="mod-btn approve" onClick={() => handleOpenModal(m)}><FaEdit /> Sửa</button>
                    <button className="mod-btn reject" onClick={(e) => handleDelete(e, m.id)}><FaTrash /> Xóa</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          <div className="add-more-placeholder" onClick={() => handleOpenModal()}>
            <div className="plus-icon-circle"><FaPlus /></div>
            <span>Thêm Đơn Vị Vận Chuyển Mới</span>
            <p>Mở rộng các tùy chọn giao nhận cho khách hàng</p>
          </div>
        </div>
      </div>

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
              <div className="review-grid" style={{gridTemplateColumns: '1fr', padding: '25px', gap: '20px'}}>
                <div className="form-group-admin">
                  <label>Tên đơn vị vận chuyển</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="vd: Hỏa Tốc" />
                </div>
                <div className="form-group-admin">
                  <label>Mô tả chi tiết</label>
                  <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="vd: Nhận hàng trong 2 giờ nội thành" />
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                  <div className="form-group-admin">
                    <label>Phí cơ bản (VNĐ)</label>
                    <input required type="number" value={form.baseCost} onChange={e => setForm({...form, baseCost: Number(e.target.value)})} />
                  </div>
                  <div className="form-group-admin">
                    <label>Thời gian ước tính</label>
                    <input required value={form.estimatedTime} onChange={e => setForm({...form, estimatedTime: e.target.value})} placeholder="vd: 1-2 ngày" />
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