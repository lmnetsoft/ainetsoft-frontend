import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getCategories } from '../../services/api';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ToastNotification from '../../components/Toast/ToastNotification';
import './AddProduct.css'; 

// The base URL for your backend server
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

interface Category {
  id: string;
  name: string;
}

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // 1. Core Product State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    categoryId: '',
    shopName: '',
    sellerId: '' // Track sellerId to ensure path consistency for subfolders
  });

  // 2. Media Management
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // 3. Metadata
  const [categories, setCategories] = useState<Category[]>([]);
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  /**
   * DYNAMIC IMAGE RESOLVER
   * Standardized to handle the uploads/ads/{sellerId}/ structure.
   * Prepends the BASE_URL to any relative path coming from the DB.
   */
  const formatMediaUrl = (url?: string) => {
    if (!url || url === 'undefined' || url === 'null' || url === '') return "/placeholder.png";
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    
    // Standardize leading slash to avoid double-slashes or missing slashes
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    
    return `${BASE_URL}${cleanPath}`;
  };

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const [profileRes, catRes, prodRes] = await Promise.all([
          api.get('/auth/me'),
          getCategories(),
          api.get(`/products/${id}`)
        ]);

        // Security Check: Only verified sellers can edit
        if (profileRes.data.sellerVerification !== 'VERIFIED') {
          navigate('/seller/register');
          return;
        }

        setCategories(catRes.data);

        const p = prodRes.data;
        setFormData({
          name: p.name,
          description: p.description,
          price: p.price,
          stock: p.stock,
          categoryId: p.categoryId || (catRes.data[0]?.id),
          shopName: p.shopName,
          sellerId: p.sellerId // Capture owner ID for potential path logic
        });

        // Use the image array from backend (checking common naming variations)
        const imageList = p.imageUrls || p.images || [];
        setExistingImages(Array.isArray(imageList) ? imageList : []);
        
        // Convert Specifications Map back to Array for the UI
        if (p.specifications) {
          const specArray = Object.entries(p.specifications).map(([key, value]) => ({ 
            key, 
            value: value as string 
          }));
          setSpecs(specArray.length > 0 ? specArray : [{ key: '', value: '' }]);
        } else {
          setSpecs([{ key: '', value: '' }]);
        }

      } catch (err) {
        console.error("Load error:", err);
        setToastMessage("Không thể tải thông tin sản phẩm.");
        setShowToast(true);
        setTimeout(() => navigate('/seller/products'), 2000);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [id, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalCount = existingImages.length + newImageFiles.length + files.length;
    
    if (totalCount > 5) {
      setToastMessage("Tổng số lượng ảnh không được vượt quá 5.");
      setShowToast(true);
      return;
    }

    setNewImageFiles(prev => [...prev, ...files]);
    const previews = files.map(file => URL.createObjectURL(file));
    setNewImagePreviews(prev => [...prev, ...previews]);
  };

  const updateSpec = (index: number, field: 'key' | 'value', val: string) => {
    const newSpecs = [...specs];
    newSpecs[index][field] = val;
    setSpecs(newSpecs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const data = new FormData();

      const specMap: Record<string, string> = {};
      specs.forEach(s => {
        if (s.key.trim() && s.value.trim()) specMap[s.key] = s.value;
      });

      const productPayload = { 
        ...formData, 
        specifications: specMap,
        images: existingImages // These are the URLs we chose to KEEP
      };

      data.append("product", new Blob([JSON.stringify(productPayload)], { type: "application/json" }));
      
      // Add newly uploaded files
      newImageFiles.forEach(file => data.append("images", file));
      if (videoFile) data.append("video", videoFile);

      await api.put(`/products/seller/update/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setToastMessage("Cập nhật thành công! Đang chờ Admin duyệt lại.");
      setShowToast(true);
      setTimeout(() => navigate('/seller/products'), 2000);
    } catch (error: any) {
      setToastMessage(error.response?.data?.message || "Lỗi khi cập nhật.");
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="loading-placeholder-seller">Đang tải dữ liệu...</div>;

  return (
    <div className="add-product-wrapper">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      <div className="container seller-container">
        <AccountSidebar />
        
        <main className="add-product-main">
          <div className="form-header">
            <h1>Chỉnh sửa sản phẩm</h1>
            <p className="warning-text">Lưu ý: Sau khi lưu, sản phẩm sẽ cần được Admin duyệt lại.</p>
          </div>

          <form onSubmit={handleSubmit} className="product-form">
            <section className="form-section">
              <h3>Hình ảnh sản phẩm (Tối đa 5)</h3>
              <div className="media-upload-area">
                <div className="image-upload-grid">
                  
                  {/* RENDER EXISTING IMAGES - RESOLVED VIA SUBFOLDER PATHS */}
                  {existingImages.map((url, index) => (
                    <div key={`exist-${index}`} className="image-preview-item">
                      <img 
                        src={formatMediaUrl(url)} 
                        alt="Current" 
                        onError={(e) => { e.currentTarget.src = "/placeholder.png"; }}
                      />
                      <button type="button" className="remove-img" onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== index))}>×</button>
                    </div>
                  ))}
                  
                  {/* RENDER NEW UPLOADS */}
                  {newImagePreviews.map((url, index) => (
                    <div key={`new-${index}`} className="image-preview-item new-upload">
                      <img src={url} alt="New" />
                      <button type="button" className="remove-img" onClick={() => {
                        setNewImageFiles(prev => prev.filter((_, i) => i !== index));
                        setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
                      }}>×</button>
                    </div>
                  ))}

                  {(existingImages.length + newImageFiles.length) < 5 && (
                    <div className="upload-placeholder" onClick={() => imageInputRef.current?.click()}>
                      <span>+ Thêm ảnh</span>
                    </div>
                  )}
                </div>
                <input type="file" ref={imageInputRef} multiple onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
              </div>
            </section>

            <section className="form-section">
              <h3>Thông tin cơ bản</h3>
              <div className="input-group">
                <label>Tên sản phẩm</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Mô tả chi tiết</label>
                <textarea rows={5} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="row-group">
                <div className="input-group half">
                  <label>Danh mục</label>
                  <select value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="input-group half">
                  <label>Giá niêm yết (₫)</label>
                  <input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} />
                </div>
              </div>
            </section>

            <section className="form-section">
              <h3>Thông số kỹ thuật</h3>
              <div className="specs-container">
                {specs.map((spec, index) => (
                  <div key={index} className="spec-row">
                    <input type="text" placeholder="Tên" value={spec.key} onChange={(e) => updateSpec(index, 'key', e.target.value)} />
                    <input type="text" placeholder="Giá trị" value={spec.value} onChange={(e) => updateSpec(index, 'value', e.target.value)} />
                    <button type="button" className="remove-spec" onClick={() => setSpecs(specs.filter((_, i) => i !== index))}>×</button>
                  </div>
                ))}
                <button type="button" className="add-spec-btn" onClick={() => setSpecs([...specs, { key: '', value: '' }])}>+ Thêm thông số</button>
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