import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './AdminFinanceSettings.css';

interface FinanceConfig {
  id?: string;
  cashbackRate: number;
  maxCoinsPerOrder: number;
  autoPayoutEnabled: boolean;
  commissionRate: number;
  flatWithdrawalFee: number;
  minWithdrawalAmount: number;
  autoPayoutMaxLimit: number;
  maxDailyWithdrawalsPerShop: number;
  escrowWindowDays: number;
  taxWithholdingRate: number;
  updatedAt?: string;
}

const AdminFinanceSettings: React.FC = () => {
  const [config, setConfig] = useState<FinanceConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get('/withdrawals/admin/config/finance');
      setConfig(response.data);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Không thể tải cấu hình tài chính: ' + (error.response?.data?.message || error.message) });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!config) return;
    const { name, value, type, checked } = e.target;
    
    setConfig({
      ...config,
      [name]: type === 'checkbox' ? checked : Number(value),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    try {
      setSaving(true);
      setMessage(null);
      const response = await api.put('/withdrawals/admin/config/finance', config);
      setConfig(response.data);
      setMessage({ type: 'success', text: 'Cập nhật cấu hình tài chính thành công!' });
      
      // Tự động ẩn thông báo sau 3 giây
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Cập nhật thất bại: ' + (error.response?.data?.message || error.message) });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="finance-loading">Đang tải cấu hình hệ thống...</div>;
  }

  if (!config) {
    return <div className="finance-error">Không có dữ liệu cấu hình.</div>;
  }

  return (
    <div className="admin-finance-settings-container">
      <div className="finance-header">
        <h2>Cấu hình Tài chính Hệ thống</h2>
        <p>Quản lý các thông số cốt lõi về hoa hồng, rút tiền, và thời gian đối soát.</p>
      </div>

      {message && (
        <div className={`finance-alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="finance-form">
        
        {/* SECTION 1: DOANH THU & HOA HỒNG */}
        <div className="finance-card">
          <h3>1. Doanh thu & Thuế</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Tỉ lệ Hoa hồng Sàn (%)</label>
              <div className="input-with-suffix">
                <input
                  type="number"
                  step="0.001"
                  name="commissionRate"
                  value={config.commissionRate}
                  onChange={handleInputChange}
                  required
                />
                <span className="suffix">VD: 0.01 = 1%</span>
              </div>
            </div>

            <div className="form-group">
              <label>Tỉ lệ Thu hộ Thuế TNCN (%)</label>
              <div className="input-with-suffix">
                <input
                  type="number"
                  step="0.001"
                  name="taxWithholdingRate"
                  value={config.taxWithholdingRate}
                  onChange={handleInputChange}
                  required
                />
                <span className="suffix">VD: 0.015 = 1.5%</span>
              </div>
            </div>

            <div className="form-group">
              <label>Thời gian Đổi trả / Tạm giữ (Ngày)</label>
              <div className="input-with-suffix">
                <input
                  type="number"
                  name="escrowWindowDays"
                  value={config.escrowWindowDays}
                  onChange={handleInputChange}
                  required
                />
                <span className="suffix">Ngày</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: RÚT TIỀN */}
        <div className="finance-card">
          <h3>2. Quy định Rút tiền</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Phí Rút Tiền Cố định (VNĐ)</label>
              <input
                type="number"
                name="flatWithdrawalFee"
                value={config.flatWithdrawalFee}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Số Tiền Rút Tối thiểu (VNĐ)</label>
              <input
                type="number"
                name="minWithdrawalAmount"
                value={config.minWithdrawalAmount}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Giới hạn Số lệnh rút/Ngày/Shop</label>
              <div className="input-with-suffix">
                <input
                  type="number"
                  name="maxDailyWithdrawalsPerShop"
                  value={config.maxDailyWithdrawalsPerShop}
                  onChange={handleInputChange}
                  required
                />
                <span className="suffix">Lần/Ngày</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: TỰ ĐỘNG GIẢI NGÂN (AUTO-PAYOUT) */}
        <div className="finance-card">
          <h3>3. Tự động Giải ngân (Vietcombank API)</h3>
          
          <div className="toggle-group">
            <label className="switch">
              <input
                type="checkbox"
                name="autoPayoutEnabled"
                checked={config.autoPayoutEnabled}
                onChange={handleInputChange}
              />
              <span className="slider round"></span>
            </label>
            <span className="toggle-label">
              Bật tính năng Tự động Chuyển khoản
            </span>
          </div>

          <div className="form-group mt-3">
            <label>Ngưỡng an toàn tối đa cho Auto-Payout (VNĐ)</label>
            <p className="field-hint">Nếu số tiền rút vượt quá ngưỡng này, hệ thống sẽ yêu cầu duyệt thủ công.</p>
            <input
              type="number"
              name="autoPayoutMaxLimit"
              value={config.autoPayoutMaxLimit}
              onChange={handleInputChange}
              required
              disabled={!config.autoPayoutEnabled}
            />
          </div>
        </div>

        {/* SECTION 4: THƯỞNG XU & CASHBACK */}
        <div className="finance-card">
          <h3>4. Thưởng Xu (Cashback)</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Tỉ lệ Hoàn Xu (%)</label>
              <div className="input-with-suffix">
                <input
                  type="number"
                  step="0.001"
                  name="cashbackRate"
                  value={config.cashbackRate}
                  onChange={handleInputChange}
                  required
                />
                <span className="suffix">VD: 0.01 = 1%</span>
              </div>
            </div>

            <div className="form-group">
              <label>Giới hạn Xu Tối đa/Đơn</label>
              <div className="input-with-suffix">
                <input
                  type="number"
                  name="maxCoinsPerOrder"
                  value={config.maxCoinsPerOrder}
                  onChange={handleInputChange}
                  required
                />
                <span className="suffix">Xu</span>
              </div>
            </div>
          </div>
        </div>

        <div className="finance-actions">
          <button type="submit" className="btn-save-config" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu Cấu Hình Mới'}
          </button>
        </div>
        
      </form>
    </div>
  );
};

export default AdminFinanceSettings;
