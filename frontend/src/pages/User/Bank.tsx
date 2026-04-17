import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; 
import ToastNotification from '../../components/Toast/ToastNotification';
import { getUserProfile, updateBankAccount } from '../../services/authService'; // 🚀 Ensure this is imported
import api from '../../services/api'; 
import { FaSearch, FaChevronDown, FaHourglassHalf } from 'react-icons/fa'; 
import './Profile.css'; 

const Bank = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const redirectTarget = queryParams.get('redirect');

  const [bankData, setBankData] = useState({
    id: '', 
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    userId: '' 
  });

  const [hasPendingUpdate, setHasPendingUpdate] = useState(false); // 🚀 SAFETY LOCK STATE
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const vnBanks = [
    "Vietcombank", "VietinBank", "BIDV", "Agribank", 
    "MB Bank", "Techcombank", "ACB", "VPBank", 
    "TPBank", "Sacombank", "VIB", "HDBank", 
    "SHB", "Eximbank", "OCB", "MSB", 
    "SeABank", "LPBank", "PVcomBank", "Nam A Bank", 
    "Kienlongbank", "VietBank", "BaoVietBank", "ABBANK", 
    "OceanBank", "GPBank", "DongA Bank", "Bac A Bank", 
    "Viet Capital Bank", "Shinhan Bank", "HSBC", "Standard Chartered"
  ].sort();

  const filteredBanks = vnBanks.filter(bank => 
    bank.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const fetchBankInfo = async () => {
      try {
        setLoading(true);
        // 1. Get full user profile to check for pending updates
        const user = await getUserProfile();
        
        if (user && user.id) {
          // 🚀 LOCK DETECTED: Set state from backend flag
          setHasPendingUpdate(user.hasPendingUpdate); 

          // 2. PRIORITY: If there is a pending bank draft, show it so the user sees their request
          if (user.pendingBankAccount) {
             setBankData({
               id: 'pending',
               bankName: user.pendingBankAccount.bankName,
               accountNumber: user.pendingBankAccount.accountNumber,
               accountHolder: user.pendingBankAccount.accountHolder,
               userId: user.id
             });
          } else {
            // 3. FALLBACK: Fetch live bank info if no update is pending
            const response = await api.get(`/bank-accounts/user/${user.id}`);
            if (response.data && response.data.length > 0) {
              setBankData({
                ...response.data[0],
                userId: user.id
              });
            } else {
              setBankData(prev => ({ ...prev, userId: user.id }));
            }
          }
        }
      } catch (error: any) {
        console.error("Bank data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    fetchBankInfo();
    document.addEventListener("mousedown", handleClickOutside);
    document.title = "Ngân hàng của tôi | AiNetsoft";
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectBank = (bank: string) => {
    if (hasPendingUpdate) return; // 🚀 BLOCK changes if locked
    setBankData({ ...bankData, bankName: bank });
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const validateBankAccount = (number: string) => {
    const digitsOnly = number.replace(/\s/g, ''); 
    const regex = /^\d{8,15}$/; 
    return regex.test(digitsOnly);
  };

  const handleSave = async () => {
    if (!bankData.bankName || !bankData.accountNumber || !bankData.accountHolder) {
      setToastMessage("Vui lòng nhập đầy đủ thông tin tài khoản!");
      setShowToast(true);
      return;
    }

    if (!validateBankAccount(bankData.accountNumber)) {
      setToastMessage("Số tài khoản không hợp lệ (Phải là số, từ 8-15 ký tự)!");
      setShowToast(true);
      return;
    }

    const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
    if (!nameRegex.test(bankData.accountHolder)) {
      setToastMessage("Tên chủ tài khoản không được chứa số hoặc ký tự đặc biệt!");
      setShowToast(true);
      return;
    }

    try {
      setIsSaving(true);
      
      const payload = {
        bankName: bankData.bankName,
        accountNumber: bankData.accountNumber.replace(/\s/g, ''),
        accountHolder: bankData.accountHolder.trim().toUpperCase(),
      };

      // 🚀 Use the new secure update function
      const message = await updateBankAccount(payload); 

      setToastMessage(message);
      setShowToast(true);

      // Force refresh state from backend to activate the lockdown
      const updatedUser = await getUserProfile();
      setHasPendingUpdate(updatedUser.hasPendingUpdate);

      if (redirectTarget === 'seller-register') {
          setTimeout(() => navigate('/seller/register'), 1500);
      }
    } catch (error: any) {
      setToastMessage(error.message || "Lỗi khi lưu thông tin.");
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="user-profile-supreme-layout">
      {loading ? (
        <div className="profile-loading-box">Đang tải dữ liệu...</div>
      ) : (
        <>
          <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
          
          <div className="profile-content-header centered-header">
            <h1>TÀI KHOẢN NGÂN HÀNG</h1>
            <p>Thông tin này giúp bạn rút doanh thu bán hàng về ví cá nhân</p>
          </div>
          
          <hr className="supreme-divider" />

          {/* 🚀 SAFETY LOCK BANNER: Informed user of pending state */}
          {hasPendingUpdate && (
             <div className="warning-text" style={{ marginBottom: '20px', justifyContent: 'center', color: '#faad14' }}>
                <FaHourglassHalf />
                <span style={{ marginLeft: '10px' }}>Yêu cầu thay đổi tài khoản ngân hàng đang được xét duyệt. Bạn không thể chỉnh sửa lúc này.</span>
             </div>
          )}

          <div className="profile-main-grid">
            {/* Added view-only-mode class for CSS targeting */}
            <form className={`profile-data-form ${hasPendingUpdate ? 'view-only-mode' : ''}`} onSubmit={(e) => e.preventDefault()}>
              
              <div className="supreme-form-row">
                <label>Tên Ngân hàng <span className="req">*</span></label>
                <div className="input-group-container" ref={dropdownRef}>
                  <div 
                    className={`searchable-select-box ${isDropdownOpen ? 'active' : ''} ${hasPendingUpdate ? 'disabled' : ''}`}
                    onClick={() => !hasPendingUpdate && setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <span>{bankData.bankName || "-- Chọn Ngân hàng --"}</span>
                    {!hasPendingUpdate && <FaChevronDown className={`chevron-icon ${isDropdownOpen ? 'rotate' : ''}`} />}
                  </div>

                  {isDropdownOpen && !hasPendingUpdate && (
                    <div className="bank-dropdown-menu">
                      <div className="search-input-wrapper">
                        <FaSearch className="search-icon" />
                        <input 
                          type="text" 
                          placeholder="Tìm kiếm ngân hàng..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onClick={(e) => e.stopPropagation()} 
                          autoFocus
                        />
                      </div>
                      <ul className="bank-list-results">
                        {filteredBanks.map(bank => (
                          <li key={bank} onClick={() => handleSelectBank(bank)}>{bank}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="supreme-form-row">
                <label>Số tài khoản <span className="req">*</span></label>
                <div className="input-group-container">
                  <input 
                    type="text" 
                    disabled={hasPendingUpdate} // 🚀 FIELD GREYED OUT
                    value={bankData.accountNumber} 
                    onChange={(e) => setBankData({...bankData, accountNumber: e.target.value.replace(/\D/g, '')})}
                    placeholder="Nhập số tài khoản (8-15 chữ số)"
                  />
                </div>
              </div>

              <div className="supreme-form-row">
                <label>Tên chủ tài khoản <span className="req">*</span></label>
                <div className="input-group-container">
                  <input 
                    type="text" 
                    disabled={hasPendingUpdate} // 🚀 FIELD GREYED OUT
                    value={bankData.accountHolder} 
                    onChange={(e) => setBankData({...bankData, accountHolder: e.target.value.toUpperCase()})}
                    placeholder="NGUYEN VAN A (Không dấu hoặc có dấu)"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="save-btn-supreme" 
                  onClick={handleSave} 
                  disabled={isSaving || hasPendingUpdate} // 🚀 BUTTON GREYED OUT
                >
                  {isSaving ? "Đang lưu..." : hasPendingUpdate ? "ĐANG CHỜ DUYỆT" : "Lưu tài khoản"}
                </button>
              </div>
            </form>

            <div className="profile-avatar-column" style={{ border: 'none' }}>
                <div className="bank-info-illustration" style={{ padding: '20px' }}>
                    <p className="supreme-side-hint">Vui lòng đảm bảo số tài khoản chính xác (8-15 chữ số) để giao dịch không bị gián đoạn.</p>
                </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Bank;