import React, { useState, useEffect, useRef, useMemo } from 'react';
import api from '../../services/api';
import ToastNotification from '../../components/Toast/ToastNotification';
import { 
    FaCheck, FaTimes, FaFilter, FaClock, FaStore, FaMoneyBillWave, FaSync, FaUniversity, FaChevronDown, FaExclamationTriangle 
} from 'react-icons/fa';
import './AdminWithdrawals.css';

const AdminWithdrawals = () => {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false); 
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [adminNote, setAdminNote] = useState('');
    
    const [isOpen, setIsOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filterOptions = [
        { value: 'ALL', label: 'Tất cả yêu cầu' },
        { value: 'PENDING', label: 'Đang chờ duyệt' },
        { value: 'COMPLETED', label: 'Đã giải ngân' },
        { value: 'REJECTED', label: 'Đã từ chối' }
    ];

    useEffect(() => {
        fetchRequests();
        document.title = "Quản lý Rút tiền | AiNetsoft Admin";
        
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchRequests = async () => {
        try {
            if (!loading) setRefreshing(true);
            const res = await api.get('/withdrawals/admin/all');
            
            // 🚀 ELITE SORT: Newest on Top (Descending by Date)
            // This ensures 10/4/2026 appears before 31/3/2026
            const sortedData = res.data.sort((a: any, b: any) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            
            setRequests(sortedData);
        } catch (err) {
            setToastMessage("Không thể tải danh sách.");
            setShowToast(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleProcess = async (id: string, status: 'COMPLETED' | 'REJECTED') => {
        if (status === 'REJECTED' && !adminNote.trim()) {
            setToastMessage("Vui lòng nhập lý do từ chối.");
            setShowToast(true);
            return;
        }
        try {
            await api.put(`/withdrawals/admin/process/${id}`, { status, adminNote });
            setToastMessage(status === 'COMPLETED' ? "Giải ngân thành công!" : "Đã từ chối yêu cầu.");
            setShowToast(true);
            setProcessingId(null);
            setAdminNote('');
            fetchRequests(); // Re-fetch and re-sort automatically
        } catch (err: any) {
            setToastMessage("Lỗi xử lý hệ thống.");
            setShowToast(true);
        }
    };

    const filteredData = useMemo(() => {
        return filterStatus === 'ALL' 
            ? requests 
            : requests.filter(r => r.status?.toUpperCase() === filterStatus.toUpperCase());
    }, [requests, filterStatus]);

    const currentLabel = filterOptions.find(opt => opt.value === filterStatus)?.label;

    if (loading && !refreshing) return <div className="admin-loading">Đang tải dữ liệu...</div>;

    return (
        <div className="admin-withdrawal-container">
            <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
            
            <div className="admin-page-header">
                <h1>QUẢN LÝ RÚT TIỀN</h1>
                <p>Hệ thống đối soát và giải ngân tự động 2026</p>
                <div className="header-stats">
                    <FaMoneyBillWave className="icon-money" /> Tổng yêu cầu: <strong>{requests.length}</strong>
                    <button className={`btn-refresh-elite ${refreshing ? 'is-syncing' : ''}`} onClick={fetchRequests} disabled={refreshing}>
                        <FaSync />
                    </button>
                </div>
            </div>

            <div className="admin-toolbar-elite">
                <div className="elite-custom-select-wrapper" ref={dropdownRef}>
                    <div className={`elite-select-trigger ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                        <div className="filter-icon-wrapper"><FaFilter className="filter-icon-red" /></div>
                        <span className="selected-label">{currentLabel}</span>
                        <FaChevronDown className={`chevron-icon ${isOpen ? 'rotate' : ''}`} />
                    </div>
                    {isOpen && (
                        <ul className="elite-options-list">
                            {filterOptions.map(opt => (
                                <li key={opt.value} className={filterStatus === opt.value ? 'selected' : ''}
                                    onClick={() => { setFilterStatus(opt.value); setIsOpen(false); }}>
                                    {opt.label}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className="table-stable-wrapper">
                <table className="elite-admin-table">
                    <thead>
                        <tr>
                            <th style={{width: '25%'}}>Người bán / Cửa hàng</th>
                            <th style={{width: '15%'}}>Số tiền</th>
                            <th style={{width: '25%'}}>Chi tiết Ngân hàng</th>
                            <th style={{width: '12%'}}>Thời gian</th>
                            <th style={{width: '12%'}}>Trạng thái</th>
                            <th style={{width: '11%'}} className="text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length > 0 ? (
                            filteredData.map((req) => (
                                <tr key={req.id}>
                                    <td>
                                        <div className="elite-shop-flex">
                                            <div className="shop-icon-circle"><FaStore /></div>
                                            <div className="shop-text-info">
                                                <div className="shop-name-bold">{req.shopName || "Hitech Center"}</div>
                                                <div className="seller-name-muted">{req.sellerFullName || "Hệ thống"}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="currency-val-red">₫{req.amount?.toLocaleString('vi-VN')}</span>
                                    </td>
                                    <td>
                                        <div className="bank-stack">
                                            <div className="bank-header"><FaUniversity className="bank-icon" /> <strong>{req.bankName}</strong></div>
                                            <code className="bank-acc-num">{req.accountNumber}</code>
                                            <div className="bank-acc-holder">{req.accountHolder}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="timestamp-info">
                                            <span>{new Date(req.createdAt).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge-pill ${req.status?.toLowerCase()}`}>
                                            {req.status === 'COMPLETED' ? 'Thành công' : req.status === 'PENDING' ? 'Chờ duyệt' : 'Bị từ chối'}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        {req.status?.toUpperCase() === 'PENDING' ? (
                                            <button className="btn-approve-action" onClick={() => setProcessingId(req.id)}><FaCheck /> Phê duyệt</button>
                                        ) : (
                                            <div className="completion-info">
                                                <FaClock /> {req.processedAt ? new Date(req.processedAt).toLocaleDateString('vi-VN') : '--'}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={6} className="no-data-msg">Không tìm thấy yêu cầu nào.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* 🚀 FIXED ELITE MODAL OVERLAY (Resolved layout issue from image_e1dd4f.png) */}
            {processingId && (
                <div className="elite-modal-backdrop">
                    <div className="elite-modal-window">
                        <div className="modal-header-elite">
                            <h3>Xác nhận giải ngân</h3>
                            <button className="btn-close-modal" onClick={() => setProcessingId(null)}><FaTimes /></button>
                        </div>
                        
                        <div className="modal-body-elite">
                            <div className="warning-callout">
                                <FaExclamationTriangle className="icon-warn" />
                                <p>Đảm bảo bạn đã thực hiện chuyển khoản qua App Ngân hàng trước khi xác nhận hệ thống.</p>
                            </div>
                            
                            <div className="form-group-elite">
                                <label>Ghi chú đối soát</label>
                                <textarea 
                                    value={adminNote} 
                                    onChange={(e) => setAdminNote(e.target.value)} 
                                    placeholder="Nhập mã giao dịch hoặc lý do từ chối (nếu có)..."
                                    rows={4}
                                />
                            </div>
                        </div>

                        <div className="modal-footer-elite">
                            <button className="btn-reject-modal" onClick={() => handleProcess(processingId, 'REJECTED')}>Từ chối yêu cầu</button>
                            <button className="btn-confirm-modal" onClick={() => handleProcess(processingId, 'COMPLETED')}>Xác nhận đã chuyển tiền</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminWithdrawals;