import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; // Use our centralized API instance
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ToastNotification from '../../components/Toast/ToastNotification';
import './AddProduct.css';

const AddProduct = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: 'Electronics',
    images: [] as string[],
    // This is just for UI display; Backend will use the User's actual name
    shopName: localStorage.getItem('userName') || 'Cửa hàng của tôi'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const categories = ['Electronics', 'Fashion', 'Home & Living', 'Beauty', 'Health', 'Sports', 'Other'];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).forEach(file => {
        if (file.size > 1024 * 1024) {
          setToastMessage("Ảnh quá lớn! Vui lòng chọn ảnh dưới 1MB.");
          setShowToast(true);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          // Only update once all selected files are processed
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

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
       setToastMessage("Vui lòng nhập tên sản phẩm");
       setShowToast(true);
       return;
    }
    if (formData.price <= 0) {
       setToastMessage("Giá sản phẩm phải lớn hơn 0");
       setShowToast(true);
       return;
    }
    if (formData.images.length === 0) {
       setToastMessage("Vui lòng thêm ít nhất 1 hình ảnh");
       setShowToast(true);
       return;
    }

    try {
      setIsSubmitting(true);
      
      // POST to the finalized endpoint in ProductController.java
      await api.post('/products/seller/add', formData);
      
      setToastMessage("Đăng bán sản phẩm thành công!");
      setShowToast(true);
      
      // Redirect to inventory
      setTimeout(() => navigate('/seller/my-products'), 1500);
      
    } catch (error: any) {
      // Catch specific backend error (e.g. "Bạn cần đăng ký làm Người bán")
      setToastMessage(error.response?.data || "Lỗi khi đăng sản phẩm.");
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <h1>Thêm 1 sản phẩm mới</h1>
            <p>Vui lòng cung cấp thông tin chính xác để khách hàng dễ dàng tìm kiếm</p>
          </div>

          <form onSubmit={handleSubmit} className="product-form">
            
            <section className="form-section">
              <h3>Hình ảnh sản phẩm (Tối đa 5 ảnh)</h3>
              <div className="image-upload-grid">
                {formData.images.map((img, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={img} alt="Preview" />
                    <button type="button" className="remove-img" onClick={() => removeImage(index)}>×</button>
                  </div>
                ))}
                {formData.images.length < 5 && (
                  <div className="upload-placeholder" onClick={() => fileInputRef.current?.click()}>
                    <span>+ Thêm ảnh</span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  multiple 
                  onChange={handleImageChange} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
              </div>
            </section>

            <section className="form-section">
              <h3>Thông tin cơ bản</h3>
              <div className="input-group">
                <label>Tên sản phẩm</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Nhập tên sản phẩm (Ví dụ: Apple iPhone 15 Pro Max)"
                  maxLength={120}
                />
              </div>

              <div className="input-group">
                <label>Mô tả sản phẩm</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Nhập mô tả chi tiết về tính năng, công dụng..."
                  rows={6}
                />
              </div>

              <div className="row-group">
                <div className="input-group half">
                  <label>Danh mục</label>
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group half">
                  <label>Tên Shop (Cố định)</label>
                  <input type="text" value={formData.shopName} disabled className="disabled-input" />
                </div>
              </div>
            </section>

            <section className="form-section">
              <h3>Thông tin bán hàng</h3>
              <div className="row-group">
                <div className="input-group half">
                  <label>Giá (₫)</label>
                  <input 
                    type="number" 
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    placeholder="0"
                  />
                </div>
                <div className="input-group half">
                  <label>Kho hàng</label>
                  <input 
                    type="number" 
                    value={formData.stock} 
                    onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                    placeholder="0"
                  />
                </div>
              </div>
            </section>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => navigate(-1)}>Hủy</button>
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : "Lưu & Hiển thị"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default AddProduct;