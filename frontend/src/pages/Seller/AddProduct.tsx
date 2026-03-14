import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getCategories } from '../../services/api'; 
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ToastNotification from '../../components/Toast/ToastNotification';
import './AddProduct.css';

interface Category {
  id: string;
  name: string;
}

const AddProduct = () => {
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // 1. Text & Dynamic Data State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    categoryId: '', // Now using ID from database
    shopName: localStorage.getItem('userName') || 'Cửa hàng của tôi'
  });

  // 2. Specifications State (Dynamic Key-Value Pairs)
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([
    { key: '', value: '' }
  ]);

  // 3. Media & Category State
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Initial Data Fetch: Security + Categories
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.sellerVerification !== 'VERIFIED') {
      alert("Bạn cần được Admin phê duyệt tài khoản Người bán trước khi đăng sản phẩm!");
      navigate('/seller/register');
      return;
    }

    const fetchCategories = async () => {
      try {
        const res = await getCategories();
        setCategories(res.data);
        if (res.data.length > 0) {
          setFormData(prev => ({ ...prev, categoryId: res.data[0].id }));
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };
    fetchCategories();
  }, [navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (imageFiles.length + files.length > 5) {
      setToastMessage("Bạn chỉ được tải lên tối đa 5 hình ảnh.");
      setShowToast(true);
      return;
    }
    setImageFiles(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 15 * 1024 * 1024) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    } else if (file) {
      setToastMessage("Dung lượng video phải nhỏ hơn 15MB.");
      setShowToast(true);
    }
  };

  // Spec management
  const addSpecField = () => setSpecs([...specs, { key: '', value: '' }]);
  const removeSpecField = (index: number) => setSpecs(specs.filter((_, i) => i !== index));
  const updateSpec = (index: number, field: 'key' | 'value', val: string) => {
    const newSpecs = [...specs];
    newSpecs[index][field] = val;
    setSpecs(newSpecs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.price <= 0 || imageFiles.length === 0) {
      setToastMessage("Vui lòng điền đủ tên, giá và ít nhất 1 ảnh.");
      setShowToast(true);
      return;
    }

    try {
      setIsSubmitting(true);
      const data = new FormData();

      // Convert Specs Array to the Map format the Backend expects
      const specificationsMap: Record<string, string> = {};
      specs.forEach(s => {
        if (s.key.trim() && s.value.trim()) specificationsMap[s.key] = s.value;
      });

      const payload = { ...formData, specifications: specificationsMap };
      data.append("product", new Blob([JSON.stringify(payload)], { type: "application/json" }));
      
      imageFiles.forEach(file => data.append("images", file));
      if (videoFile) data.append("video", videoFile);

      await api.post('/products/seller/add', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setToastMessage("Đã gửi sản phẩm! Vui lòng chờ Admin kiểm duyệt.");
      setShowToast(true);
      setTimeout(() => navigate('/seller/my-products'), 2000);
      
    } catch (error: any) {
      setToastMessage(error.response?.data?.message || "Lỗi khi đăng sản phẩm.");
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-product-wrapper">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      <div className="container seller-container">
        <AccountSidebar />
        
        <main className="add-product-main">
          <div className="form-header">
            <h1>Đăng bán sản phẩm mới</h1>
            <p>Sản phẩm sẽ được Admin duyệt trước khi hiển thị công khai.</p>
          </div>

          <form onSubmit={handleSubmit} className="product-form">
            <section className="form-section">
              <h3>Hình ảnh & Video</h3>
              <div className="media-upload-area">
                <div className="image-upload-grid">
                  {imagePreviews.map((url, index) => (
                    <div key={index} className="image-preview-item">
                      <img src={url} alt="Preview" />
                      <button type="button" className="remove-img" onClick={() => {
                        setImageFiles(prev => prev.filter((_, i) => i !== index));
                        setImagePreviews(prev => prev.filter((_, i) => i !== index));
                      }}>×</button>
                    </div>
                  ))}
                  {imageFiles.length < 5 && (
                    <div className="upload-placeholder" onClick={() => imageInputRef.current?.click()}>
                      <span>+ Thêm ảnh</span>
                    </div>
                  )}
                </div>

                <div className="video-upload-area">
                    {videoPreview ? (
                        <div className="video-preview-item">
                            <video src={videoPreview} controls />
                            <button type="button" className="remove-video" onClick={() => {setVideoFile(null); setVideoPreview(null);}}>Xóa Video</button>
                        </div>
                    ) : (
                        <div className="video-placeholder" onClick={() => videoInputRef.current?.click()}>
                            <span>📹 Thêm Video giới thiệu (Max 15MB)</span>
                        </div>
                    )}
                </div>
                <input type="file" ref={imageInputRef} multiple onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
                <input type="file" ref={videoInputRef} onChange={handleVideoChange} accept="video/*" style={{ display: 'none' }} />
              </div>
            </section>

            <section className="form-section">
              <h3>Thông tin cơ bản</h3>
              <div className="input-group">
                <label>Tên sản phẩm</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ví dụ: Apple iPhone 15 Pro Max" />
              </div>

              <div className="input-group">
                <label>Mô tả chi tiết</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Mô tả công dụng, tính năng..." rows={5} />
              </div>

              <div className="row-group">
                <div className="input-group half">
                  <label>Danh mục</label>
                  <select value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="input-group half">
                  <label>Tên Shop</label>
                  <input type="text" value={formData.shopName} disabled className="disabled-input" />
                </div>
              </div>
            </section>

            {/* NEW SECTION: Specifications (Shopee-style) */}
            <section className="form-section">
              <h3>Thông số kỹ thuật</h3>
              <p className="sub-label">Thêm các thuộc tính như: Thương hiệu, Chất liệu, Bảo hành...</p>
              <div className="specs-container">
                {specs.map((spec, index) => (
                  <div key={index} className="spec-row">
                    <input type="text" placeholder="Tên (vd: RAM)" value={spec.key} onChange={(e) => updateSpec(index, 'key', e.target.value)} />
                    <input type="text" placeholder="Giá trị (vd: 16GB)" value={spec.value} onChange={(e) => updateSpec(index, 'value', e.target.value)} />
                    {specs.length > 1 && <button type="button" className="remove-spec" onClick={() => removeSpecField(index)}>×</button>}
                  </div>
                ))}
                <button type="button" className="add-spec-btn" onClick={addSpecField}>+ Thêm thông số</button>
              </div>
            </section>

            <section className="form-section">
              <h3>Thông tin bán hàng</h3>
              <div className="row-group">
                <div className="input-group half">
                  <label>Giá niêm yết (₫)</label>
                  <input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} />
                </div>
                <div className="input-group half">
                  <label>Số lượng tồn kho</label>
                  <input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})} />
                </div>
              </div>
            </section>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => navigate(-1)}>Hủy</button>
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? "Đang xử lý..." : "Gửi yêu cầu kiểm duyệt"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default AddProduct;