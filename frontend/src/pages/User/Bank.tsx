import React, { useState, useEffect } from 'react';
import AccountSidebar from '../../components/AccountSidebar/AccountSidebar';
import ToastNotification from '../../components/Toast/ToastNotification';
import { getUserProfile, updateProfile } from '../../services/authService';
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
    fetchBankInfo();
    document.title = "Ngân hàng của tôi | AiNetsoft";
  }, []);

  const handleSave = async () => {
    if (!bankData.bankName || !bankData.accountNumber || !bankData.accountHolder) {
      setToastMessage("Vui lòng nhập đầy đủ thông tin tài khoản!");
      setShowToast(true);
      return;
    }

    try {
      setIsSaving(true);
      // Sending as a list to match the User model 'List<BankInfo>'
      await updateProfile({
        bankAccounts: [bankData]
      });
      setToastMessage("Cập nhật ngân hàng thành công!");
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error.message || "Cập nhật thất bại.");
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="profile-wrapper"><div className="loading-spinner"></div></div>;

  return (
    <div className="profile-wrapper">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
      <div className="container profile-container">
        <AccountSidebar />
        <main className="profile-main-content">
          <div className="content-header">
            <h1>Tài khoản Ngân hàng</h1>
            <p>Thông tin này giúp bạn rút doanh thu bán hàng về ví cá nhân</p>
          </div>
          <hr className="divider" />
          <div className="profile-form-container">
            <form className="profile-info-form" onSubmit={(e) => e.preventDefault()}>
              <div className="form-row">
                <label>Tên Ngân hàng</label>
                <select 
                  value={bankData.bankName} 
                  onChange={(e) => setBankData({...bankData, bankName: e.target.value})}
                >
                  <option value="">-- Chọn Ngân hàng --</option>
                  <option value="Vietcombank">Vietcombank</option>
                  <option value="Techcombank">Techcombank</option>
                  <option value="MB Bank">MB Bank</option>
                  <option value="Agribank">Agribank</option>
                  <option value="VietinBank">VietinBank</option>
                </select>
              </div>
              <div className="form-row">
                <label>Số tài khoản</label>
                <input 
                  type="text" 
                  value={bankData.accountNumber} 
                  onChange={(e) => setBankData({...bankData, accountNumber: e.target.value})}
                  placeholder="Nhập số tài khoản"
                />
              </div>
              <div className="form-row">
                <label>Tên chủ tài khoản</label>
                <input 
                  type="text" 
                  value={bankData.accountHolder} 
                  onChange={(e) => setBankData({...bankData, accountHolder: e.target.value.toUpperCase()})}
                  placeholder="Họ tên không dấu (ví dụ: NGUYEN VAN A)"
                />
              </div>
              <div className="form-row">
                <label></label>
                <button type="button" className="save-btn" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Đang lưu..." : "Lưu tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Bank;