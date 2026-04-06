import React, { useState, useEffect, useRef } from 'react';
import ToastNotification from '../../components/Toast/ToastNotification';
import { getUserProfile, updateProfile } from '../../services/authService';
import { FaSearch, FaChevronDown } from 'react-icons/fa'; 
import './Profile.css'; 

const Bank = () => {
  const [bankData, setBankData] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: ''
  });

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
        const data = await getUserProfile();
        if (data.bankAccounts && data.bankAccounts.length > 0) {
          setBankData(data.bankAccounts[0]);
        }
      } catch (error: any) {
        console.error("Profile load error:", error);
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
      const cleanData = {
        ...bankData,
        accountNumber: bankData.accountNumber.replace(/\s/g, ''),
        accountHolder: bankData.accountHolder.trim().toUpperCase()
      };

      await updateProfile({ bankAccounts: [cleanData] });
      setToastMessage("Cập nhật ngân hàng thành công!");
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error.message || "Cập nhật thất bại.");
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="user-profile-supreme-layout">
      {/* 🚀 STABILITY FIX: Keep the layout mounted during loading */}
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

          <div className="profile-main-grid">
            <form className="profile-data-form" onSubmit={(e) => e.preventDefault()}>
              
              <div className="supreme-form-row">
                <label>Tên Ngân hàng <span className="req">*</span></label>
                <div className="input-group-container" ref={dropdownRef} style={{ position: 'relative' }}>
                  <div 
                    className={`searchable-select-box ${isDropdownOpen ? 'active' : ''}`}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <span>{bankData.bankName || "-- Chọn Ngân hàng --"}</span>
                    <FaChevronDown className={`chevron-icon ${isDropdownOpen ? 'rotate' : ''}`} />
                  </div>

                  {isDropdownOpen && (
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
                        {filteredBanks.length > 0 ? (
                          filteredBanks.map(bank => (
                            <li key={bank} onClick={() => handleSelectBank(bank)}>
                              {bank}
                            </li>
                          ))
                        ) : (
                          <li className="no-results">Không tìm thấy ngân hàng</li>
                        )}
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
                    value={bankData.accountHolder} 
                    onChange={(e) => setBankData({...bankData, accountHolder: e.target.value.toUpperCase()})}
                    placeholder="NGUYEN VAN A (Không dấu hoặc có dấu)"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="save-btn-supreme" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Đang lưu..." : "Lưu tài khoản"}
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