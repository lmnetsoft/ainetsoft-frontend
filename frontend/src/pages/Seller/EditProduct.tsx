import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ToastNotification from '../../components/Toast/ToastNotification';
import './AddProduct.css'; // We can reuse the same styles as AddProduct

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: 'Electronics',
    images: [] as string[]
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const categories = ['Electronics', 'Fashion', 'Home & Living', 'Beauty', 'Health', 'Sports', 'Other'];

  // 1. Fetch existing product data on mount
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        const p = res.data;
        setFormData({
          name: p.name,
          description: p.description,
          price: p.price,
          stock: p.stock,
          category: p.category,
          images: p.images || []
        });
      } catch (err) {
        toast.error("Không thể tải thông tin sản phẩm.");
        navigate('/seller/my-products');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          if (newImages.length === files.length) {
            setFormData(prev => ({ 
              ...prev, 
              images: [...prev.images, ...newImages].slice(0, 5) 
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      // Calls the update endpoint we defined in ProductService
      await api.put(`/products/seller/update/${id}`, formData);
      
      setToastMessage("Cập nhật thành công! Sản phẩm đã được gửi lại để Admin duyệt.");
      setShowToast(true);
      
      setTimeout(() => navigate('/seller/my-products'), 2000);
    } catch (error: any) {
      setToastMessage(error.response?.data?.message || "Lỗi khi cập nhật.");
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="add-product-wrapper">
      <ToastNotification 
        message={toastMessage} 
        isVisible={showToast} 
        onClose={() => setShowToast(false)} 
      />

      <div className="container seller-container">
        <AccountSidebar />
        
        <main className="add-product-main">
          <div className="form-header">
            <h1>Chỉnh sửa sản phẩm</h1>
            <p className="warning-text">Lưu ý: Sau khi chỉnh sửa, sản phẩm sẽ tạm ẩn để Admin duyệt lại.</p>
          </div>

          <form onSubmit={handleSubmit} className="product-form">
            <section className="form-section">
              <h3>Hình ảnh hiện tại</h3>
              <div className="image-upload-grid">
                {formData.images.map((img, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={img} alt="" />
                    <button type="button" className="remove-img" onClick={() => setFormData({...formData, images: formData.images.filter((_, i) => i !== index)})}>×</button>
                  </div>
                ))}
                {formData.images.length < 5 && (
                  <div className="upload-placeholder" onClick={() => fileInputRef.current?.click()}>
                    <span>+ Thay đổi ảnh</span>
                  </div>
                )}
                <input type="file" ref={fileInputRef} multiple onChange={handleImageChange} accept="image/*" className="hidden" />
              </div>
            </section>

            <section className="form-section">
              <h3>Thông tin chi tiết</h3>
              <div className="input-group">
                <label>Tên sản phẩm</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label>Mô tả</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={6}
                />
              </div>
              <div className="row-group">
                <div className="input-group half">
                  <label>Giá (₫)</label>
                  <input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} />
                </div>
                <div className="input-group half">
                  <label>Kho</label>
                  <input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})} />
                </div>
              </div>
            </section>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => navigate(-1)}>Hủy bỏ</button>
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : "Cập nhật & Chờ duyệt"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default EditProduct;