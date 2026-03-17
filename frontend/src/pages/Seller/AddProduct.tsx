import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaTruck, FaShieldAlt, FaShareAlt, FaPlus, FaTrash, 
  FaClock, FaTicketAlt, FaInfoCircle, FaCheckCircle, 
  FaMoneyBillWave, FaEdit 
} from 'react-icons/fa';
import api, { getCategories } from '../../services/api'; 
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ToastNotification from '../../components/Toast/ToastNotification';
import heic2any from 'heic2any'; // Support for iPhone HEIC photos
import './AddProduct.css';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

interface Category {
  id: string;
  name: string;
}

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  estimatedTime: string;
}

interface SelectedShipping {
  methodId: string;
  methodName: string;
  cost: number;
  estimatedTime: string;
  voucherNote: string;
}

const AddProduct = () => {
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // 1. DATA STATE
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    categoryId: '', 
    shopName: localStorage.getItem('userName') || 'Cửa hàng của tôi',
    sellerId: '',
    protectionEnabled: true,
    allowSharing: true 
  });

  // 2. PROFESSIONAL CONFIGURATION STATE (Situational Logic)
  const [globalShippingMethods, setGlobalShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<SelectedShipping[]>([]);
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }]);

  // 3. MEDIA & UI STATE
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 4. DATA INITIALIZATION & SECURITY
  useEffect(() => {
    const checkStatusAndFetchData = async () => {
      try {
        const profileRes = await api.get('/auth/me'); 
        const latestUser = profileRes.data;
        localStorage.setItem('user', JSON.stringify(latestUser));

        if (latestUser.sellerVerification !== 'VERIFIED') {
          alert("Tài khoản của bạn chưa được phê duyệt để đăng bán!");
          navigate('/seller/register');
          return;
        }

        setFormData(prev => ({ ...prev, sellerId: latestUser.id || latestUser.userId }));

        const catRes = await getCategories();
        setCategories(catRes.data);
        if (catRes.data.length > 0) {
          setFormData(prev => ({ ...prev, categoryId: catRes.data[0].id }));
        }

        // Fetch Global Shipping Templates for the seller to choose from
        try {
            const shipRes = await api.get('/api/shipping-methods');
            setGlobalShippingMethods(shipRes.data);
        } catch (shipErr) {
            console.warn("Lưu ý: Không thể lấy mẫu vận chuyển từ Admin. Bạn có thể thêm thủ công.");
        }

      } catch (error) {
        console.error("Auth check failed:", error);
        navigate('/login');
      }
    };
    checkStatusAndFetchData();
  }, [navigate]);

  // --- SHIPPING HANDLERS ---
  const toggleShippingMethod = (method: ShippingMethod) => {
    const exists = selectedShipping.find(s => s.methodId === method.id);
    if (exists) {
      setSelectedShipping(prev => prev.filter(s => s.methodId !== method.id));
    } else {
      setSelectedShipping(prev => [...prev, {
        methodId: method.id,
        methodName: method.name,
        cost: method.baseCost,
        estimatedTime: method.estimatedTime,
        voucherNote: ''
      }]);
    }
  };

  const updateShippingDetail = (methodId: string, field: keyof SelectedShipping, value: any) => {
    setSelectedShipping(prev => prev.map(s => s.methodId === methodId ? { ...s, [field]: value } : s));
  };

  const addManualShipping = () => {
    const manualId = `manual-${Date.now()}`;
    setSelectedShipping(prev => [...prev, {
      methodId: manualId,
      methodName: 'Giao hàng riêng',
      cost: 30000,
      estimatedTime: '2-3 ngày',
      voucherNote: ''
    }]);
  };

  // --- MEDIA HANDLERS (Preserved original functions) ---
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (imageFiles.length + files.length > 5) {
      setToastMessage("Bạn chỉ được tải lên tối đa 5 hình ảnh.");
      setShowToast(true);
      return;
    }
    const processedFiles: File[] = [];
    const processedPreviews: string[] = [];

    for (const file of files) {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith(".heic") || fileName.endsWith(".heif")) {
        try {
          const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 });
          const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
          const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" });
          processedFiles.push(newFile);
          processedPreviews.push(URL.createObjectURL(blob));
        } catch (error) {
          console.error("HEIC processing error:", error);
        }
      } else {
        processedFiles.push(file);
        processedPreviews.push(URL.createObjectURL(file));
      }
    }
    setImageFiles(prev => [...prev, ...processedFiles]);
    setImagePreviews(prev => [...prev, ...processedPreviews]);
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

  // --- SPECS HANDLERS ---
  const addSpecField = () => setSpecs([...specs, { key: '', value: '' }]);
  const removeSpecField = (index: number) => setSpecs(specs.filter((_, i) => i !== index));
  const updateSpec = (index: number, field: 'key' | 'value', val: string) => {
    const newSpecs = [...specs];
    newSpecs[index][field] = val;
    setSpecs(newSpecs);
  };

  // --- FINAL SUBMISSION ---
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
      const specificationsMap: Record<string, string> = {};
      specs.forEach(s => {
        if (s.key.trim() && s.value.trim()) specificationsMap[s.key] = s.value;
      });

      const payload = { 
        ...formData, 
        specifications: specificationsMap,
        shippingOptions: selectedShipping 
      };

      data.append("product", new Blob([JSON.stringify(payload)], { type: "application/json" }));
      imageFiles.forEach(file => data.append("images", file));
      if (videoFile) data.append("video", videoFile);

      await api.post('/products/seller/add', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setToastMessage("Đăng sản phẩm thành công! Đang chờ Admin duyệt.");
      setShowToast(true);
      setTimeout(() => navigate('/seller/products'), 2000);
      
    } catch (error: any) {
      setToastMessage(error.response?.data?.message || "Lỗi khi lưu sản phẩm.");
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
            {/* SECTION 1: MEDIA */}
            <section className="form-section">
              <div className="section-title"><h3>Hình ảnh & Video</h3></div>
              <div className="media-upload-area">
                {imagePreviews.map((url, index) => (
                  <div key={`img-${index}`} className="image-preview-item">
                    <img src={url} alt="Preview" />
                    <button type="button" className="remove-img" onClick={() => {
                      setImageFiles(prev => prev.filter((_, i) => i !== index));
                      setImagePreviews(prev => prev.filter((_, i) => i !== index));
                    }}>×</button>
                    {index === 0 && <span className="primary-badge">Ảnh chính</span>}
                  </div>
                ))}
                {videoPreview ? (
                  <div className="video-preview-item">
                    <video src={videoPreview} />
                    <button type="button" className="remove-video" onClick={() => {setVideoFile(null); setVideoPreview(null);}}>×</button>
                  </div>
                ) : (
                  <div className="video-placeholder" onClick={() => videoInputRef.current?.click()}>
                    <span>📹 Thêm Video</span>
                  </div>
                )}
                {imageFiles.length < 5 && (
                  <div className="upload-placeholder" onClick={() => imageInputRef.current?.click()}>
                    <span>+ Thêm ảnh</span>
                  </div>
                )}
                <input type="file" ref={imageInputRef} multiple onChange={handleImageChange} accept="image/*,.heic,.heif" style={{ display: 'none' }} />
                <input type="file" ref={videoInputRef} onChange={handleVideoChange} accept="video/*" style={{ display: 'none' }} />
              </div>
            </section>

            {/* SECTION 2: BASIC INFO */}
            <section className="form-section">
              <div className="section-title"><h3>Thông tin cơ bản</h3></div>
              <div className="input-group">
                <label>Tên sản phẩm</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Nhập tên sản phẩm (VD: iPhone 15 Pro Max)" />
              </div>
              <div className="input-group">
                <label>Mô tả chi tiết</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Mô tả công dụng, tính năng nổi bật..." rows={5} />
              </div>
              <div className="row-group">
                <div className="input-group half">
                  <label>Danh mục</label>
                  <select value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="input-group half">
                  <label>Cửa hàng</label>
                  <input type="text" value={formData.shopName} disabled className="disabled-input" />
                </div>
              </div>
            </section>

            {/* SECTION 3: PROFESSIONAL SHIPPING CONFIG */}
            <section className="form-section">
              <div className="section-header-flex">
                <div className="section-title"><h3><FaTruck /> Cấu hình vận chuyển</h3></div>
                <button type="button" className="btn-manual-ship" onClick={addManualShipping}><FaPlus /> Thêm mới</button>
              </div>
              <p className="sub-hint">Kích hoạt các phương thức và tùy chỉnh chi phí/thời gian cho riêng sản phẩm này.</p>
              
              <div className="shipping-config-grid">
                {/* A. Templates from Global Admin */}
                {globalShippingMethods.map(method => {
                  const isSel = selectedShipping.some(s => s.methodId === method.id);
                  const data = selectedShipping.find(s => s.methodId === method.id);
                  return (
                    <div key={method.id} className={`ship-config-card ${isSel ? 'selected' : ''}`}>
                       <div className="card-top">
                          <div className="method-meta">
                             <input type="checkbox" checked={isSel} onChange={() => toggleShippingMethod(method)} id={`s-${method.id}`} />
                             <label htmlFor={`s-${method.id}`}>{method.name}</label>
                          </div>
                          {isSel && <FaCheckCircle className="check-icon" />}
                       </div>
                       
                       {isSel && (
                         <div className="card-inputs-guided animate-fade-in">
                            <div className="guided-field-row">
                               <div className="input-field-group">
                                  <label><FaMoneyBillWave /> Phí vận chuyển (₫)</label>
                                  <input type="number" value={data?.cost} onChange={e => updateShippingDetail(method.id, 'cost', Number(e.target.value))} placeholder="VD: 28700" />
                               </div>
                               <div className="input-field-group">
                                  <label><FaClock /> Thời gian giao hàng</label>
                                  <input type="text" value={data?.estimatedTime} onChange={e => updateShippingDetail(method.id, 'estimatedTime', e.target.value)} placeholder="VD: Ngày mai 08:00" />
                               </div>
                            </div>
                            <div className="input-field-group full-width">
                               <label><FaTicketAlt /> Ưu đãi & Ghi chú (Sẽ hiện dưới tên phương thức)</label>
                               <input type="text" value={data?.voucherNote} onChange={e => updateShippingDetail(method.id, 'voucherNote', e.target.value)} placeholder="VD: Tặng Voucher 20.000đ nếu đơn giao sau thời gian trên..." />
                            </div>
                         </div>
                       )}
                    </div>
                  );
                })}

                {/* B. Manual Custom Rows */}
                {selectedShipping.filter(s => s.methodId.startsWith('manual')).map(m => (
                  <div key={m.methodId} className="ship-config-card selected manual">
                      <div className="card-top">
                          <div className="edit-title-group">
                            <label className="tiny-label">Tên phương thức</label>
                            <input type="text" className="editable-name" value={m.methodName} onChange={e => updateShippingDetail(m.methodId, 'methodName', e.target.value)} placeholder="VD: Giao hỏa tốc" />
                          </div>
                          <button type="button" className="btn-del-card" onClick={() => setSelectedShipping(selectedShipping.filter(s => s.methodId !== m.methodId))}><FaTrash /></button>
                      </div>
                      <div className="card-inputs-guided">
                          <div className="guided-field-row">
                              <div className="input-field-group"><label><FaMoneyBillWave /> Phí (₫)</label><input type="number" value={m.cost} onChange={e => updateShippingDetail(m.methodId, 'cost', Number(e.target.value))} /></div>
                              <div className="input-field-group"><label><FaClock /> Thời gian</label><input type="text" value={m.estimatedTime} onChange={e => updateShippingDetail(m.methodId, 'estimatedTime', e.target.value)} /></div>
                          </div>
                          <div className="input-field-group full-width"><label><FaTicketAlt /> Ưu đãi</label><input type="text" value={m.voucherNote} onChange={e => updateShippingDetail(m.methodId, 'voucherNote', e.target.value)} /></div>
                      </div>
                  </div>
                ))}

                {globalShippingMethods.length === 0 && selectedShipping.length === 0 && (
                   <div className="empty-shipping-notice">
                      <FaInfoCircle /> <p>Vui lòng bấm <strong>"+ Thêm mới"</strong> để tự định nghĩa các phương thức vận chuyển cho sản phẩm này.</p>
                   </div>
                )}
              </div>
            </section>

            {/* SECTION 4: SPECS */}
            <section className="form-section">
              <div className="section-title"><h3>Thông số kỹ thuật</h3></div>
              <div className="specs-container">
                {specs.map((spec, index) => (
                  <div key={index} className="spec-row">
                    <input type="text" placeholder="Tên (VD: RAM)" value={spec.key} onChange={(e) => updateSpec(index, 'key', e.target.value)} />
                    <input type="text" placeholder="Giá trị (VD: 16GB)" value={spec.value} onChange={(e) => updateSpec(index, 'value', e.target.value)} />
                    {specs.length > 1 && <button type="button" className="remove-spec" onClick={() => removeSpecField(index)}><FaTrash/></button>}
                  </div>
                ))}
                <button type="button" className="add-spec-btn" onClick={addSpecField}>+ Thêm thuộc tính</button>
              </div>
            </section>

            {/* SECTION 5: SALES & PROTECTION FLAGS */}
            <section className="form-section">
              <div className="section-title"><h3>Dịch vụ & Bảo vệ</h3></div>
              <div className="row-group">
                <div className="input-group half">
                  <label>Giá bán niêm yết (₫)</label>
                  <input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} />
                </div>
                <div className="input-group half">
                  <label>Số lượng tồn kho</label>
                  <input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})} />
                </div>
              </div>

              <div className="protection-toggles-row">
                <div className="toggle-box">
                  <div className="toggle-left">
                    <FaShieldAlt className="icon-prot" />
                    <div>
                      <label>An tâm mua sắm</label>
                      <p>Huy hiệu bảo vệ và chính sách 15 ngày trả hàng.</p>
                    </div>
                  </div>
                  <input type="checkbox" checked={formData.protectionEnabled} onChange={(e) => setFormData({...formData, protectionEnabled: e.target.checked})} />
                </div>
                
                <div className="toggle-box">
                  <div className="toggle-left">
                    <FaShareAlt className="icon-share" />
                    <div>
                      <label>Nút chia sẻ</label>
                      <p>Cho phép người mua quảng bá sản phẩm lên Facebook/Zalo.</p>
                    </div>
                  </div>
                  <input type="checkbox" checked={formData.allowSharing} onChange={(e) => setFormData({...formData, allowSharing: e.target.checked})} />
                </div>
              </div>
            </section>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => navigate(-1)}>Hủy bỏ</button>
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? "Đang xử lý..." : "Lưu & Đăng bán"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default AddProduct;