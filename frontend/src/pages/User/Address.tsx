import React, { useState, useEffect, useRef } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css'; 
import ToastNotification from '../../components/Toast/ToastNotification';
import { getUserProfile, updateProfile, sendOtp } from '../../services/authService';
import { getProvinces, getDistricts, getWards } from '../../services/shippingService';
import goongjs from '@goongmaps/goong-js';
import '@goongmaps/goong-js/dist/goong-js.css'; 
import { FaMapMarkerAlt, FaSearch, FaTimes } from 'react-icons/fa';
import './Profile.css'; 
import OtpVerification from '../../components/OtpVerification/OtpVerification';

const GOONG_API_KEY = import.meta.env.VITE_GOONG_API_KEY; 
const GOONG_MAPTILES_KEY = import.meta.env.VITE_GOONG_MAPTILES_KEY;

const inlineStyles = `
  .map-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 20000 !important; }
  .map-modal-card { background: white; width: 90%; max-width: 800px; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; height: 85vh; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
  .map-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #eee; }
  .map-search-container { padding: 15px; background: #f8f9fa; border-bottom: 1px solid #eee; position: relative; }
  .map-search-input-group { display: flex; gap: 10px; }
  .map-search-input-group input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
  .map-canvas-area { flex: 1; background: #eee; position: relative; min-height: 300px; }
  #goong-map-canvas { width: 100%; height: 100%; }
  .map-modal-footer { padding: 15px 20px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; gap: 15px; }
  .btn-confirm-map { background: #ee4d2d; color: white; border: none; padding: 10px 30px; border-radius: 4px; font-weight: 600; cursor: pointer; }
  .btn-cancel-map { background: #f0f0f0; color: #555; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
  .map-suggestions { position: absolute; top: 100%; left: 15px; right: 15px; background: white; border: 1px solid #ddd; z-index: 21000; max-height: 200px; overflow-y: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.15); list-style: none; padding: 0; margin: 0; }
  .map-suggestions li { padding: 12px 15px; cursor: pointer; border-bottom: 1px solid #f5f5f5; font-size: 14px; }
  .map-suggestions li:hover { background: #fdf2f0; color: #ee4d2d; }
  .gps-box-ainetsoft { border: 1px dashed #ee4d2d; background: #fffaf9; padding: 15px; border-radius: 6px; display: flex; gap: 15px; align-items: flex-start; margin-top: 10px; }
  .gps-box-ainetsoft.clickable { cursor: pointer; transition: 0.2s; }
  .gps-box-ainetsoft.clickable:hover { background: #ffefe5; }
  .gps-red { color: #ee4d2d; font-size: 24px; margin-top: 2px; }
  .gps-text strong { display: block; color: #333; margin-bottom: 4px; }
  .gps-text span { color: #666; font-size: 14px; }
  .gps-hint-text { color: #888; font-size: 12px; margin-top: 8px; font-style: italic; }
`;

const Address = () => {
  const [addressData, setAddressData] = useState({
    receiverName: '', 
    phone: '84', 
    province: '',
    district: '',
    ward: '',
    detail: '',
    districtId: 0,
    wardCode: '',
    latitude: '', 
    longitude: '' 
  });

  const [userEmail, setUserEmail] = useState('');
  const [originalPhone, setOriginalPhone] = useState('84');
  const [dbPhone, setDbPhone] = useState(''); 
  const [userMainPhone, setUserMainPhone] = useState<string | null>(null); // 🚀 TRACK LỖI BẤT ĐỒNG BỘ DB

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [selectedProvId, setSelectedProvId] = useState<number>(0);

  const [showMapModal, setShowMapModal] = useState(false);
  const [mapSearch, setMapSearch] = useState("");
  const [mapSuggestions, setMapSuggestions] = useState<any[]>([]);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  useEffect(() => {
    const fetchAddressInfo = async () => {
      try {
        setLoading(true);
        const data = await getUserProfile();
        
        if (data.email) setUserEmail(data.email);
        
        setUserMainPhone(data.phone || null); // Ghi nhận DB có sdt chính chưa

        let rawPhone = (data.addresses && data.addresses.length > 0) 
          ? data.addresses[0].phone 
          : data.phone;

        setDbPhone(rawPhone || ''); 

        let normalizedPhone = '84';
        if (rawPhone) {
            const digits = rawPhone.replace(/\D/g, '');
            if (digits.startsWith('084')) {
                normalizedPhone = digits.slice(1);
            } else if (digits.startsWith('0')) {
                normalizedPhone = '84' + digits.slice(1);
            } else {
                normalizedPhone = digits;
            }
        }

        if (data.addresses && data.addresses.length > 0) {
          const addr = data.addresses[0];
          setAddressData({
            receiverName: addr.receiverName || '',
            phone: normalizedPhone,
            province: addr.province || '',
            district: addr.district || '',
            ward: addr.ward || '',
            detail: addr.detail || '',
            districtId: addr.districtId || 0,
            wardCode: addr.wardCode || '',
            latitude: addr.latitude || '',
            longitude: addr.longitude || ''
          });
          
          if (addr.province) {
            const provs = await getProvinces();
            setProvinces(provs || []);
            const match = (provs || []).find((p: any) => p.ProvinceName === addr.province);
            if (match) setSelectedProvId(match.ProvinceID);
          }
        } else {
          setAddressData(prev => ({
            ...prev,
            receiverName: data.fullName || '',
            phone: normalizedPhone
          }));
          const provs = await getProvinces();
          setProvinces(provs || []);
        }
        
        setOriginalPhone(normalizedPhone);
        
      } catch (error: any) {
        console.error("Lỗi tải địa chỉ:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAddressInfo();
    document.title = "ĐỊA CHỈ CỦA TÔI | AiNetsoft";
  }, []);

  useEffect(() => {
    if (selectedProvId > 0) {
        getDistricts(selectedProvId).then(res => setDistricts(res || []));
    } else {
        setDistricts([]);
        setWards([]);
    }
  }, [selectedProvId]);

  useEffect(() => {
    if (addressData.districtId > 0) {
        getWards(addressData.districtId).then(res => setWards(res || []));
    } else {
        setWards([]);
    }
  }, [addressData.districtId]);

  const autoFillGHNDropdowns = async (fullAddress: string) => {
    if (!provinces || provinces.length === 0) return;
    const normalizedAddr = fullAddress.toLowerCase();

    const matchedProv = provinces.find((p: any) => 
        normalizedAddr.includes(p.ProvinceName.toLowerCase().replace('tỉnh ', '').replace('thành phố ', ''))
    );
    if (!matchedProv) return;

    setSelectedProvId(matchedProv.ProvinceID);
    const fetchedDists = await getDistricts(matchedProv.ProvinceID) || [];
    setDistricts(fetchedDists);

    const matchedDist = fetchedDists.find((d: any) => 
        normalizedAddr.includes(d.DistrictName.toLowerCase().replace('quận ', '').replace('huyện ', '').replace('thị xã ', '').replace('thành phố ', ''))
    );

    if (!matchedDist) {
        setAddressData(prev => ({ ...prev, province: matchedProv.ProvinceName, districtId: 0, district: '', wardCode: '', ward: '', detail: fullAddress }));
        return;
    }

    const fetchedWards = await getWards(matchedDist.DistrictID) || [];
    setWards(fetchedWards);

    const matchedWard = fetchedWards.find((w: any) => 
        normalizedAddr.includes(w.WardName.toLowerCase().replace('phường ', '').replace('xã ', '').replace('thị trấn ', ''))
    );

    setAddressData(prev => ({
        ...prev,
        province: matchedProv.ProvinceName,
        districtId: matchedDist.DistrictID,
        district: matchedDist.DistrictName,
        wardCode: matchedWard ? matchedWard.WardCode : '',
        ward: matchedWard ? matchedWard.WardName : '',
        detail: fullAddress
    }));
  };

  useEffect(() => {
    if (showMapModal && !mapInstance.current) {
        goongjs.accessToken = GOONG_MAPTILES_KEY;
        const map = new goongjs.Map({
            container: 'goong-map-canvas',
            style: 'https://tiles.goong.io/assets/navigation_day.json',
            center: [106.660172, 10.762622], 
            zoom: 14
        });
        map.addControl(new goongjs.NavigationControl(), 'top-right');
        
        const initialLat = addressData.latitude ? parseFloat(addressData.latitude) : 10.762622;
        const initialLng = addressData.longitude ? parseFloat(addressData.longitude) : 106.660172;
        
        const marker = new goongjs.Marker({ color: '#ee4d2d' }).setLngLat([initialLng, initialLat]).addTo(map);
        map.flyTo({ center: [initialLng, initialLat], zoom: 16 });
        
        mapInstance.current = map;
        markerInstance.current = marker;

        map.on('click', (e: any) => {
            const { lng, lat } = e.lngLat;
            marker.setLngLat([lng, lat]);
            setAddressData(prev => ({ ...prev, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
        });
    }
    return () => { 
        if (mapInstance.current) {
            mapInstance.current.remove();
            mapInstance.current = null;
            markerInstance.current = null;
        }
    };
  }, [showMapModal]);

  const handleMapSearch = async (val: string) => {
    setMapSearch(val);
    if (val.length < 3) { setMapSuggestions([]); return; }
    try {
        const res = await fetch(`https://rsapi.goong.io/Place/AutoComplete?api_key=${GOONG_API_KEY}&input=${encodeURIComponent(val)}`);
        const data = await res.json();
        if (data.predictions) setMapSuggestions(data.predictions);
    } catch (e) {}
  };

  const handleDirectSearch = async () => {
    if (mapSearch.length < 3) return;
    try {
        const res = await fetch(`https://rsapi.goong.io/geocode?address=${encodeURIComponent(mapSearch)}&api_key=${GOONG_API_KEY}`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            const { lat, lng } = data.results[0].geometry.location;
            const fullAddressText = data.results[0].formatted_address;
            mapInstance.current?.flyTo({ center: [lng, lat], zoom: 16 });
            markerInstance.current?.setLngLat([lng, lat]);
            setAddressData(prev => ({ ...prev, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
            autoFillGHNDropdowns(fullAddressText);
        }
    } catch (e) {
        setToastMessage("Không tìm thấy địa chỉ này.");
        setShowToast(true);
    }
  };

  const selectMapSuggestion = async (p: any) => {
    setMapSearch(p.description);
    setMapSuggestions([]);
    try {
        const res = await fetch(`https://rsapi.goong.io/Place/Detail?api_key=${GOONG_API_KEY}&place_id=${p.place_id}`);
        const data = await res.json();
        if (data.result && mapInstance.current) {
            const { lat, lng } = data.result.geometry.location;
            const fullAddressText = p.description;
            mapInstance.current.flyTo({ center: [lng, lat], zoom: 16 });
            markerInstance.current.setLngLat([lng, lat]);
            setAddressData(prev => ({ ...prev, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
            autoFillGHNDropdowns(fullAddressText);
        }
    } catch (e) {}
  };

  const validateVNPhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const regex = /^(84|0)(3|5|7|8|9)\d{8}$/;
    return regex.test(cleanPhone);
  };

  const handleSave = async () => {
    if (!addressData.receiverName || !addressData.province || !addressData.districtId || !addressData.wardCode || !addressData.detail) {
      setToastMessage("Vui lòng điền đầy đủ thông tin Tỉnh, Quận, Phường và Địa chỉ chi tiết.");
      setShowToast(true);
      return;
    }

    if (!addressData.phone || !validateVNPhone(addressData.phone)) {
      setToastMessage("Số điện thoại không hợp lệ hoặc không thuộc nhà mạng Việt Nam.");
      setShowToast(true);
      return;
    }

    // 🚀 ĐÃ FIX CHUẨN UX: Nếu không có SĐT chính trong DB, BẮT BUỘC coi là thay đổi số!
    const currentClean = addressData.phone.replace(/\D/g, '');
    const originalClean = originalPhone.replace(/\D/g, '');
    let phoneChanged = currentClean !== originalClean;

    if (!userMainPhone) {
        phoneChanged = true;
    }

    try {
      setIsSaving(true);

      if (phoneChanged) {
        const finalPhoneForOtp = addressData.phone.startsWith('+') ? addressData.phone : `+${addressData.phone}`;
        await sendOtp(finalPhoneForOtp);
        setShowOtpModal(true);
        setToastMessage("Mã xác minh đã được gửi qua SMS.");
        setShowToast(true);
        setIsSaving(false);
        return; 
      }

      await performFinalUpdate();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data || error.message || "Lỗi hệ thống khi gửi SMS.";
      setToastMessage(errorMsg);
      setShowToast(true);
      setIsSaving(false);
    }
  };

  const performFinalUpdate = async (otpCode?: string) => {
    const currentClean = addressData.phone.replace(/\D/g, '');
    const originalClean = originalPhone.replace(/\D/g, '');
    const phoneChanged = currentClean !== originalClean || !userMainPhone;

    const finalPhone = phoneChanged 
        ? (addressData.phone.startsWith('+') ? addressData.phone : `+${addressData.phone}`) 
        : dbPhone;

    const payload: any = {
      fullName: addressData.receiverName,
      phone: finalPhone,
      otpCode: otpCode, 
      addresses: [{ ...addressData, phone: finalPhone, isDefault: true }]
    };
    
    if (userEmail) {
        payload.email = userEmail;
    }
    
    const result = await updateProfile(payload);
    setToastMessage(result || "Cập nhật địa chỉ thành công!");
    setShowToast(true);
    setOriginalPhone(addressData.phone); 
    setDbPhone(finalPhone); 
    setUserMainPhone(finalPhone); // Fix mất sync sau khi lưu
    setIsSaving(false);
  };

  const handleVerifyOtp = async (code: string) => {
    try {
      setIsVerifyingOtp(true);
      await performFinalUpdate(code);
      setShowOtpModal(false);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data || error.message || "Mã xác thực không chính xác.";
      setToastMessage(errorMsg);
      setShowToast(true);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const pId = parseInt(e.target.value);
      const pName = e.target.options[e.target.selectedIndex].text;
      setSelectedProvId(pId);
      setAddressData({ ...addressData, province: pId > 0 ? pName : '', districtId: 0, district: '', wardCode: '', ward: '' });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const dId = parseInt(e.target.value);
      const dName = e.target.options[e.target.selectedIndex].text;
      setAddressData({ ...addressData, districtId: dId, district: dId > 0 ? dName : '', wardCode: '', ward: '' });
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const wCode = e.target.value;
      const wName = e.target.options[e.target.selectedIndex].text;
      setAddressData({ ...addressData, wardCode: wCode, ward: wCode ? wName : '' });
  };

  return (
    <div className="user-profile-supreme-layout">
      <style>{inlineStyles}</style>
      {loading ? (
        <div className="profile-loading-box">Đang tải địa chỉ...</div>
      ) : (
        <>
          <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
          
          {showOtpModal && (
            <div className="admin-modal-overlay">
              <div className="seller-review-modal" style={{ maxWidth: '480px', height: 'auto', padding: '10px' }}>
                 <OtpVerification 
                   phoneNumber={addressData.phone.startsWith('+') ? addressData.phone : `+${addressData.phone}`}
                   onBack={() => setShowOtpModal(false)}
                   onVerify={handleVerifyOtp}
                   onResend={() => sendOtp(addressData.phone.startsWith('+') ? addressData.phone : `+${addressData.phone}`)}
                 />
              </div>
            </div>
          )}

          <div className="profile-content-header centered-header">
            <h1>ĐỊA CHỈ CỦA TÔI</h1>
            <p>Vietnam là mặc định, đồng bộ với hồ sơ cá nhân</p>
          </div>
          
          <hr className="supreme-divider" />

          <div className="profile-main-grid">
            <form className="profile-data-form" onSubmit={(e) => e.preventDefault()}>
              
              <div className="supreme-form-row">
                <label>Tên người nhận <span className="req">*</span></label>
                <div className="input-group-container">
                  <input 
                    type="text" 
                    value={addressData.receiverName} 
                    onChange={(e) => setAddressData({...addressData, receiverName: e.target.value})} 
                    placeholder="Nhập tên người nhận"
                  />
                </div>
              </div>

              <div className="supreme-form-row">
                <label>Số điện thoại <span className="req">*</span></label>
                <div className="input-group-container">
                  <PhoneInput
                    country={'vn'} 
                    preferredCountries={['vn']}
                    value={addressData.phone}
                    onChange={(phone) => setAddressData({ ...addressData, phone })}
                    enableSearch={true}
                    searchPlaceholder="Tìm kiếm quốc gia..."
                    containerClass="supreme-phone-container"
                    inputStyle={{ width: '100%', height: '45px', paddingLeft: '48px', fontSize: '0.9375rem' }}
                    specialLabel={""}
                    forceDialCode={true}
                    countryCodeEditable={false}
                  />
                </div>
              </div>

              <div className="supreme-form-row">
                <label>Tỉnh / Thành phố <span className="req">*</span></label>
                <div className="input-group-container">
                  <select 
                    className="supreme-input-full" 
                    value={selectedProvId || ""} 
                    onChange={handleProvinceChange}
                  >
                    <option value="">-- Chọn Tỉnh/Thành phố --</option>
                    {provinces.map((p: any) => (
                        <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="supreme-form-row">
                <label>Quận / Huyện <span className="req">*</span></label>
                <div className="input-group-container">
                  <select 
                    className="supreme-input-full" 
                    value={addressData.districtId || ""} 
                    onChange={handleDistrictChange}
                    disabled={!selectedProvId}
                  >
                    <option value="">-- Chọn Quận/Huyện --</option>
                    {districts.map((d: any) => (
                        <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="supreme-form-row">
                <label>Phường / Xã <span className="req">*</span></label>
                <div className="input-group-container">
                  <select 
                    className="supreme-input-full" 
                    value={addressData.wardCode || ""} 
                    onChange={handleWardChange}
                    disabled={!addressData.districtId}
                  >
                    <option value="">-- Chọn Phường/Xã --</option>
                    {wards.map((w: any) => (
                        <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="supreme-form-row">
                <label>Địa chỉ cụ thể <span className="req">*</span></label>
                <div className="input-group-container">
                  <input 
                    type="text" 
                    value={addressData.detail} 
                    onChange={(e) => setAddressData({...addressData, detail: e.target.value})} 
                    placeholder="Số nhà, tên đường..."
                  />
                </div>
              </div>

              <div className="supreme-form-row">
                <label></label>
                <div className="input-group-container">
                    <div className="gps-box-ainetsoft clickable" onClick={() => setShowMapModal(true)}>
                      <FaMapMarkerAlt className="gps-red" />
                      <div className="gps-text">
                        <strong>Tọa độ GPS (Bắt buộc cho Shipper)</strong>
                        <span>{addressData.latitude ? `${addressData.latitude}, ${addressData.longitude}` : 'Nhấn vào đây để tìm và điền tự động'}</span>
                        <p className="gps-hint-text">* Cung cấp tọa độ chính xác giúp thuật toán tìm kho hàng gần nhất và rút ngắn thời gian giao.</p>
                      </div>
                    </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="save-btn-supreme" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Đang lưu..." : "Lưu địa chỉ"}
                </button>
              </div>
            </form>

            <div className="profile-avatar-column" style={{ border: 'none' }}></div>
          </div>
        </>
      )}

      {/* 🚀 MODAL BẢN ĐỒ GOONG */}
      {showMapModal && (
          <div className="map-modal-overlay">
            <div className="map-modal-card">
              <div className="map-modal-header">
                  <h3>Chọn địa điểm giao hàng</h3>
                  <FaTimes onClick={() => setShowMapModal(false)} style={{cursor: 'pointer'}} />
              </div>
              <div className="map-search-container">
                <div className="map-search-input-group">
                  <input type="text" placeholder="Nhập tên đường, tòa nhà hoặc khu vực..." value={mapSearch} onChange={e => handleMapSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleDirectSearch()} />
                  <button className="btn-confirm-map" type="button" onClick={handleDirectSearch}><FaSearch /></button>
                </div>
                {mapSuggestions.length > 0 && (
                    <ul className="map-suggestions">
                        {mapSuggestions.map(p => (<li key={p.place_id} onMouseDown={() => selectMapSuggestion(p)}>{p.description}</li>))}
                    </ul>
                )}
              </div>
              <div className="map-canvas-area"><div id="goong-map-canvas"></div></div>
              <div className="map-modal-footer">
                  <button className="btn-cancel-map" onClick={() => setShowMapModal(false)}>Hủy bỏ</button>
                  <button className="btn-confirm-map" onClick={() => { setShowMapModal(false); setMapSearch(""); }}>Xác nhận vị trí</button>
              </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default Address;
