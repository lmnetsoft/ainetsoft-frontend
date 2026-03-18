import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaTruck, FaShieldAlt, FaShareAlt, FaPlus, FaTrash, 
  FaClock, FaTicketAlt, FaInfoCircle, FaCheckCircle, 
  FaMoneyBillWave, FaTimes 
} from 'react-icons/fa';
import api, { getCategories } from '../../services/api'; 
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ToastNotification from '../../components/Toast/ToastNotification';
import heic2any from 'heic2any'; // CRITICAL: Support for iPhone HEIC photos
import './AddProduct.css';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8080';

interface Category { id: string; name: string; }

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

  // --- 1. DATA STATE ---
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

  // --- 2. CONFIGURATION STATE (Situational Logic) ---
  const [globalShippingMethods, setGlobalShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<SelectedShipping[]>([]);
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }]);

  // --- 3. MEDIA & UI STATE ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // --- 4. HELPERS: NUMBER FORMATTING (Visual Verification: 1 000 000) ---
  const formatDisplayNumber = (num: number | string) => {
    if (num === '' || num === undefined || num === null || num === 0) return '';
    const val = num.toString().replace(/\s+/g, '');
    return val.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const parseFormattedNumber = (str: string) => {
    const clean = str.replace(/\s+/g, '');
    return clean === '' ? 0 : Number(clean);
  };

  // --- 5. DATA INITIALIZATION & SECURITY LOOP (Preserved) ---
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

        try {
            const shipRes = await api.get('/api/shipping-methods');
            setGlobalShippingMethods(shipRes.data);
        } catch (shipErr) {
            console.warn("Lưu ý: Không thể lấy mẫu vận chuyển từ Admin. Chế độ thủ công đã sẵn sàng.");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        navigate('/login');
      }
    };
    checkStatusAndFetchData();
  }, [navigate]);

  // --- 6. SHIPPING HANDLERS ---
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

  // --- 7. MEDIA HANDLERS (Preserved HEIC & 15MB Validation) ---
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
    if (file && file.size <= 15 * 1024 * 1024) { // 15MB Limit
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    } else if (file) {
      setToastMessage("Dung lượng video phải nhỏ hơn 15MB.");
      setShowToast(true);
    }
  };

  // --- 8. SPECS HANDLERS ---
  const updateSpec = (index: number, field: 'key' | 'value', val: string) => {
    const newSpecs = [...specs];
    newSpecs[index][field] = val;
    setSpecs(newSpecs);
  };

  // --- 9. FINAL SUBMISSION ---
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
      
      setToastMessage("Đăng sản phẩm thành công! Đang chờ duyệt.");
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
              <div className="section-title"><h3>HÌNH ẢNH & VIDEO</h3></div>
              <div className="media-upload-area">
                {imagePreviews.map((url, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={url} alt="Preview" />
                    <button type="button" className="remove-img" onClick={() => {
                      setImageFiles(prev => prev.filter((_, i) => i !== index));
                      setImagePreviews(prev => prev.filter((_, i) => i !== index));
                    }}><FaTimes /></button>
                    {index === 0 && <span className="primary-badge">Ảnh chính</span>}
                  </div>
                ))}
                {videoPreview ? (
                  <div className="video-preview-item">
                    <video src={videoPreview} />
                    <button type="button" className="remove-video" onClick={() => {setVideoFile(null); setVideoPreview(null);}}><FaTimes /></button>
                    <div className="video-icon-overlay">▶</div>
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
                <input type="file" ref={imageInputRef} multiple hidden onChange={handleImageChange} accept="image/*,.heic,.heif" />
                <input type="file" ref={videoInputRef} hidden onChange={handleVideoChange} accept="video/*" />
              </div>
            </section>

            {/* SECTION 2: BASIC INFO */}
            <section className="form-section">
              <div className="section-title"><h3>THÔNG TIN CƠ BẢN</h3></div>
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

            {/* SECTION 3: SHIPPING CONFIGURATION */}
            <section className="form-section">
              <div className="section-header-flex">
                <div className="section-title"><h3><FaTruck /> CẤU HÌNH VẬN CHUYỂN</h3></div>
                <button type="button" className="btn-manual-ship" onClick={addManualShipping}><FaPlus /> Thêm mới</button>
              </div>
              <p className="sub-hint">Kích hoạt các phương thức và tùy chỉnh chi phí/thời gian cho riêng sản phẩm này.</p>
              
              <div className="shipping-config-grid">
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
                                  <label><FaMoneyBillWave /> PHÍ (₫)</label>
                                  <input 
                                    type="text" 
                                    value={formatDisplayNumber(data?.cost || 0)} 
                                    onChange={e => updateShippingDetail(method.id, 'cost', parseFormattedNumber(e.target.value))} 
                                    placeholder="VD: 30 000" 
                                  />
                               </div>
                               <div className="input-field-group">
                                  <label><FaClock /> THỜI GIAN</label>
                                  <input type="text" value={data?.estimatedTime} onChange={e => updateShippingDetail(method.id, 'estimatedTime', e.target.value)} placeholder="VD: Ngày mai 08:00" />
                               </div>
                            </div>
                            <div className="input-field-group full-width">
                               <label><FaTicketAlt /> ƯU ĐÃI</label>
                               <input type="text" value={data?.voucherNote} onChange={e => updateShippingDetail(method.id, 'voucherNote', e.target.value)} placeholder="VD: Tặng Voucher 20.000đ..." />
                            </div>
                         </div>
                       )}
                    </div>
                  );
                })}

                {selectedShipping.filter(s => s.methodId.startsWith('manual')).map(m => (
                  <div key={m.methodId} className="ship-config-card selected manual">
                      {/* PROFESSIONAL CLOSE BUTTON INSIDE THE CARD */}
                      <button type="button" className="btn-del-card-fixed" onClick={() => setSelectedShipping(selectedShipping.filter(s => s.methodId !== m.methodId))}>
                        <FaTimes />
                      </button>

                      <div className="card-top">
                          <div className="edit-title-group">
                            <span className="tiny-label-fixed">Tên phương thức</span>
                            <input type="text" className="editable-name-fixed" value={m.methodName} onChange={e => updateShippingDetail(m.methodId, 'methodName', e.target.value)} />
                          </div>
                      </div>
                      <div className="card-inputs-guided">
                          <div className="guided-field-row">
                              <div className="input-field-group">
                                <label><FaMoneyBillWave /> PHÍ (₫)</label>
                                <input type="text" value={formatDisplayNumber(m.cost)} onChange={e => updateShippingDetail(m.methodId, 'cost', parseFormattedNumber(e.target.value))} />
                              </div>
                              <div className="input-field-group"><label><FaClock /> THỜI GIAN</label><input type="text" value={m.estimatedTime} onChange={e => updateShippingDetail(m.methodId, 'estimatedTime', e.target.value)} /></div>
                          </div>
                          <div className="input-field-group full-width"><label><FaTicketAlt /> ƯU ĐÃI</label><input type="text" value={m.voucherNote} onChange={e => updateShippingDetail(m.methodId, 'voucherNote', e.target.value)} /></div>
                      </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 4: SPECS */}
            <section className="form-section">
              <div className="section-title"><h3>THÔNG SỐ KỸ THUẬT</h3></div>
              <div className="specs-container">
                {specs.map((spec, index) => (
                  <div key={index} className="spec-row">
                    <input type="text" placeholder="RAM" value={spec.key} onChange={(e) => updateSpec(index, 'key', e.target.value)} />
                    <input type="text" placeholder="16GB" value={spec.value} onChange={(e) => updateSpec(index, 'value', e.target.value)} />
                    {specs.length > 1 && <button type="button" className="remove-spec" onClick={() => setSpecs(specs.filter((_, i) => i !== index))}><FaTrash/></button>}
                  </div>
                ))}
                <button type="button" className="add-spec-btn" onClick={() => setSpecs([...specs, {key:'', value:''}])}>+ Thêm thuộc tính</button>
              </div>
            </section>

            {/* SECTION 5: SALES & PROTECTION */}
            <section className="form-section">
              <div className="section-title"><h3>DỊCH VỤ & BẢO VỆ</h3></div>
              <div className="row-group">
                <div className="input-group half">
                  <label>Giá bán niêm yết (₫)</label>
                  <input 
                    type="text" 
                    value={formatDisplayNumber(formData.price)} 
                    onChange={(e) => setFormData({...formData, price: parseFormattedNumber(e.target.value)})} 
                    placeholder="VD: 1 000 000" 
                  />
                </div>
                <div className="input-group half">
                  <label>Số lượng tồn kho</label>
                  <input 
                    type="text" 
                    value={formatDisplayNumber(formData.stock)} 
                    onChange={(e) => setFormData({...formData, stock: parseFormattedNumber(e.target.value)})} 
                    placeholder="VD: 10 000"
                  />
                </div>
              </div>

              <div className="protection-toggles-row">
                <div className="toggle-box">
                  <div className="toggle-left"><FaShieldAlt className="icon-prot" /><div><label>An tâm mua sắm</label><p>Bảo vệ 15 ngày trả hàng.</p></div></div>
                  <input type="checkbox" checked={formData.protectionEnabled} onChange={(e) => setFormData({...formData, protectionEnabled: e.target.checked})} />
                </div>
                
                <div className="toggle-box">
                  <div className="toggle-left"><FaShareAlt className="icon-share" /><div><label>Nút chia sẻ</label><p>Cho phép người mua quảng bá sản phẩm.</p></div></div>
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