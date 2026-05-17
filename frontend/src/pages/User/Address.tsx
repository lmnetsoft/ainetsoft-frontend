import React, { useState, useEffect } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css'; 
import ToastNotification from '../../components/Toast/ToastNotification';
import { getUserProfile, updateProfile, sendOtp } from '../../services/authService';
import { getProvinces, getDistricts, getWards } from '../../services/shippingService';
import './Profile.css'; 
import OtpVerification from '../../components/OtpVerification/OtpVerification';

const Address = () => {
  const [addressData, setAddressData] = useState({
    receiverName: '', 
    phone: '84', 
    province: '',
    district: '',
    ward: '',
    detail: '',
    districtId: 0,
    wardCode: ''
  });

  const [userEmail, setUserEmail] = useState('');
  const [originalPhone, setOriginalPhone] = useState('84');

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // 🚀 LOGISTICS DATA STATES
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [selectedProvId, setSelectedProvId] = useState<number>(0);

  useEffect(() => {
    const fetchAddressInfo = async () => {
      try {
        setLoading(true);
        const data = await getUserProfile();
        
        if (data.email) {
            setUserEmail(data.email);
        }

        let rawPhone = (data.addresses && data.addresses.length > 0) 
          ? data.addresses[0].phone 
          : data.phone;

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
            wardCode: addr.wardCode || ''
          });
        } else {
          setAddressData(prev => ({
            ...prev,
            receiverName: data.fullName || '',
            phone: normalizedPhone
          }));
        }
        
        setOriginalPhone(normalizedPhone);
        
        // Fetch Provinces initial
        const provs = await getProvinces();
        setProvinces(provs || []);
        
      } catch (error: any) {
        console.error("Lỗi tải địa chỉ:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAddressInfo();
    document.title = "ĐỊA CHỈ CỦA TÔI | AiNetsoft";
  }, []);

  // Fetch Districts when Province changes
  useEffect(() => {
    if (selectedProvId > 0) {
        getDistricts(selectedProvId).then(res => setDistricts(res || []));
    } else {
        setDistricts([]);
        setWards([]);
    }
  }, [selectedProvId]);

  // Fetch Wards when District changes
  useEffect(() => {
    if (addressData.districtId > 0) {
        getWards(addressData.districtId).then(res => setWards(res || []));
    } else {
        setWards([]);
    }
  }, [addressData.districtId]);

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

    const phoneChanged = addressData.phone !== originalPhone;

    try {
      setIsSaving(true);

      if (phoneChanged) {
        await sendOtp(addressData.phone);
        setShowOtpModal(true);
        setToastMessage("Mã xác minh đã được gửi đến số điện thoại mới.");
        setShowToast(true);
        setIsSaving(false);
        return; 
      }

      await performFinalUpdate();
    } catch (error: any) {
      setToastMessage(error.message || "Cập nhật địa chỉ thất bại.");
      setShowToast(true);
      setIsSaving(false);
    }
  };

  const performFinalUpdate = async (otpCode?: string) => {
    const finalPhone = addressData.phone.startsWith('+') ? addressData.phone : `+${addressData.phone}`;

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
    setIsSaving(false);
  };

  const handleVerifyOtp = async (code: string) => {
    try {
      setIsVerifyingOtp(true);
      await performFinalUpdate(code);
      setShowOtpModal(false);
    } catch (error: any) {
      setToastMessage(error.message || "Mã xác thực không chính xác.");
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
      {loading ? (
        <div className="profile-loading-box">Đang tải địa chỉ...</div>
      ) : (
        <>
          <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
          
          {showOtpModal && (
            <div className="admin-modal-overlay">
              <div className="seller-review-modal" style={{ maxWidth: '480px', height: 'auto', padding: '10px' }}>
                 <OtpVerification 
                   phoneNumber={addressData.phone}
                   onBack={() => setShowOtpModal(false)}
                   onVerify={handleVerifyOtp}
                   onResend={() => sendOtp(addressData.phone)}
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
    </div>
  );
};

export default Address;
