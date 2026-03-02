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
        // Dynamic: Check if user already has a bank saved in MongoDB
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
    try {
      setIsSaving(true);
      // Dynamic: Send bankAccounts as a list to the Embedded User model
      const message = await updateProfile({
        bankAccounts: [bankData]
      });
      setToastMessage(message || "Cập nhật ngân hàng thành công!");
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error.message || "Cập nhật thất bại.");
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="profile-wrapper"><div className="container" style={{padding: '100px', textAlign: 'center'}}><h3>Đang tải dữ liệu...</h3></div></div>;

  return (
    <div className="profile-wrapper">
      <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
      <div className="container profile-container">
        <AccountSidebar />
        <main className="profile-main-content">
          <div className="content-header">
            <h1>Tài khoản Ngân hàng</h1>
            <p>Thông tin này dùng để nhận thanh toán và rút tiền về ví</p>
          </div>
          <hr className="divider" />
          <div className="profile-form-container">
            <form className="profile-info-form">
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
                  placeholder="VIET DINH CONG"
                />
              </div>
              <div className="form-row">
                <label></label>
                <button type="button" className="save-btn" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Đang lưu..." : "Hoàn thành"}
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