import React, { useState, useEffect, useRef, useMemo } from 'react';
import api from '../../services/api';
import ToastNotification from '../../components/Toast/ToastNotification';
import { 
    FaCheck, FaTimes, FaFilter, FaClock, FaStore, FaMoneyBillWave, FaSync, 
    FaUniversity, FaChevronDown, FaExclamationTriangle, FaUser, FaShieldAlt, FaIdCard, FaSearch, FaEdit
} from 'react-icons/fa';
import './AdminWithdrawals.css';

const AdminWithdrawals = () => {
    // Data State
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false); 
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    
    // Pagination & Filter State
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Feature Toggle State
    const [autoPayoutEnabled, setAutoPayoutEnabled] = useState(false);

    // Modal States
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [adminNote, setAdminNote] = useState('');
    const [kycData, setKycData] = useState<any | null>(null);

    const filterOptions = [
        { value: 'ALL', label: 'Tất cả yêu cầu' },
        { value: 'PENDING', label: 'Đang chờ duyệt' },
        { value: 'PROCESSING', label: 'Chờ CK Thủ công' },
        { value: 'COMPLETED', label: 'Đã giải ngân' },
        { value: 'REJECTED', label: 'Đã từ chối' },
        { value: 'FAILED', label: 'Lỗi giao dịch' }
    ];

    useEffect(() => {
        fetchConfig();
        fetchRequests(0, 'ALL', 10);
        document.title = "Quản lý Rút tiền | AiNetsoft Admin";
        
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await api.get('/withdrawals/admin/config/auto-payout');
            setAutoPayoutEnabled(res.data.autoPayoutEnabled);
        } catch (e) { console.error('Lỗi lấy config', e); }
    };

    const toggleAutoPayout = async () => {
        try {
            const newState = !autoPayoutEnabled;
            await api.put('/withdrawals/admin/config/auto-payout', { enabled: newState });
            setAutoPayoutEnabled(newState);
            setToastMessage(newState ? "Đã BẬT tính năng Tự động giải ngân" : "Đã TẮT Tự động giải ngân.");
            setShowToast(true);
        } catch (e) { 
            setToastMessage("Không thể đổi cấu hình."); setShowToast(true); 
        }
    };

    const fetchRequests = async (currentPage: number, status: string, currentSize: number = pageSize) => {
        try {
            if (!loading) setRefreshing(true);
            const res = await api.get(`/withdrawals/admin/all?page=${currentPage}&size=${currentSize}&status=${status}`);
            
            const contentData = res.data.content || [];
            setRequests(contentData);
            setTotalPages(res.data.totalPages || 1);
            setTotalElements(res.data.totalElements !== undefined ? res.data.totalElements : contentData.length);
            setPage(res.data.number || 0);
        } catch (err) {
            setToastMessage("Không thể tải danh sách.");
            setShowToast(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        fetchRequests(0, filterStatus, newSize);
    };

    const handleFilterChange = (newStatus: string) => {
        setFilterStatus(newStatus);
        setIsOpen(false);
        fetchRequests(0, newStatus, pageSize);
    };

    const handleProcess = async (id: string, status: 'APPROVED' | 'COMPLETED' | 'REJECTED') => {
        if (status === 'REJECTED' && !adminNote.trim()) {
            setToastMessage("Vui lòng nhập lý do từ chối vào ô Ghi chú.");
            setShowToast(true);
            return;
        }
        try {
            await api.put(`/withdrawals/admin/process/${id}`, { status, adminNote });
            
            if (status === 'REJECTED') setToastMessage("Đã từ chối yêu cầu.");
            else if (status === 'APPROVED') setToastMessage("Đã xử lý lệnh rút tiền.");
            else setToastMessage("Giải ngân thành công!");
            
            setShowToast(true);
            setProcessingId(null);
            setAdminNote('');
            fetchRequests(page, filterStatus, pageSize);
        } catch (err: any) {
            setToastMessage(err.response?.data?.message || "Lỗi xử lý hệ thống.");
            setShowToast(true);
        }
    };

    const currentLabel = filterOptions.find(opt => opt.value === filterStatus)?.label;
    const activeReq = requests.find(r => r.id === processingId);
    const isPending = activeReq?.status === 'PENDING';
    const isProcessing = activeReq?.status === 'PROCESSING';

    if (loading && !refreshing && requests.length === 0) return <div className="admin-loading">Đang tải dữ liệu...</div>;

    return (
        <div className="admin-withdrawal-container">
            <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
            
            <div className="admin-page-header">
                <h1>QUẢN LÝ RÚT TIỀN</h1>
                <p>Hệ thống đối soát và giải ngân tiền (Tự động / Thủ công)</p>
                <div className="header-stats">
                    <div className="auto-payout-toggle-wrapper">
                        <span className="toggle-label">Auto-Payout</span>
                        <label className="switch">
                            <input type="checkbox" checked={autoPayoutEnabled} onChange={toggleAutoPayout} />
                            <span className="slider round"></span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="admin-toolbar-elite">
                <div className="toolbar-left">
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
                                        onClick={() => handleFilterChange(opt.value)}>
                                        {opt.label}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <span className="total-records-badge">Tổng: {totalElements} lệnh</span>
                </div>
                
                <button className={`btn-refresh-pro ${refreshing ? 'is-syncing' : ''}`} onClick={() => fetchRequests(page, filterStatus, pageSize)} disabled={refreshing}>
                    <FaSync className="sync-icon" /> {refreshing ? 'Đang tải...' : 'Làm mới'}
                </button>
            </div>

            <div className="table-stable-wrapper">
                <table className="elite-admin-table">
                    <thead>
                        <tr>
                            <th style={{width: '25%'}}>Người yêu cầu</th>
                            <th style={{width: '15%'}}>Số tiền</th>
                            <th style={{width: '25%'}}>Chi tiết Ngân hàng</th>
                            <th style={{width: '10%'}}>Thời gian</th>
                            <th style={{width: '10%'}}>Trạng thái</th>
                            <th style={{width: '15%'}} className="text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length > 0 ? (
                            requests.map((req) => (
                                <tr key={req.id}>
                                    <td>
                                        <div className="elite-shop-flex">
                                            <div className="shop-icon-circle" style={{ background: req.targetType === 'BUYER' ? '#e6f7ff' : '#fff1f0', color: req.targetType === 'BUYER' ? '#1890ff' : '#ff4d4f' }}>
                                                {req.targetType === 'BUYER' ? <FaUser /> : <FaStore />}
                                            </div>
                                            <div className="shop-text-info">
                                                <div className="shop-name-bold">{req.shopName || "Unknown"}</div>
                                                <div className="seller-name-muted">{req.sellerFullName || "User"}</div>
                                                {req.targetType === 'BUYER' ? (
                                                    <span className="type-badge buyer-badge">NGƯỜI MUA</span>
                                                ) : (
                                                    <span className="type-badge seller-badge">CỬA HÀNG</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="currency-val-red">₫{req.amount?.toLocaleString('vi-VN')}</span></td>
                                    <td>
                                        <div className="bank-stack">
                                            <div className="bank-header"><FaUniversity className="bank-icon" /> <strong>{req.bankName}</strong></div>
                                            <code className="bank-acc-num">{req.accountNumber}</code>
                                            <div className="bank-acc-holder">{req.accountHolder}</div>
                                        </div>
                                    </td>
                                    <td><div className="timestamp-info"><span>{new Date(req.createdAt).toLocaleDateString('vi-VN')}</span></div></td>
                                    <td>
                                        <span className={`badge-pill ${req.status?.toLowerCase()}`}>
                                            {req.status === 'COMPLETED' ? 'Thành công' : req.status === 'PENDING' ? 'Chờ duyệt' : req.status === 'PROCESSING' ? 'Chờ CK tay' : req.status === 'FAILED' ? 'Lỗi GD' : 'Từ chối'}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <div className="action-buttons-group">
                                            <button className="btn-kyc-check" onClick={() => setKycData(req)} title="Kiểm tra Danh tính & Rủi ro">
                                                <FaSearch />
                                            </button>

                                            {req.status === 'PENDING' ? (
                                                <button className="btn-approve-action" onClick={() => setProcessingId(req.id)}><FaCheck /> Phê duyệt</button>
                                            ) : req.status === 'PROCESSING' ? (
                                                <button className="btn-process-action" onClick={() => setProcessingId(req.id)}><FaMoneyBillWave /> Xác nhận CK</button>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={6} className="no-data-msg">Không tìm thấy yêu cầu nào.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 0 && (
                <div className="pagination-wrapper">
                    <div className="page-size-selector">
                        <span>Hiển thị:</span>
                        <select value={pageSize} onChange={(e) => handlePageSizeChange(Number(e.target.value))}>
                            <option value={10}>10 / trang</option>
                            <option value={30}>30 / trang</option>
                            <option value={50}>50 / trang</option>
                            <option value={100}>100 / trang</option>
                        </select>
                    </div>

                    <div className="pagination-controls">
                        <button className="page-btn" disabled={page === 0} onClick={() => fetchRequests(page - 1, filterStatus, pageSize)}>
                            Trước
                        </button>
                        <span className="page-info">Trang <strong>{page + 1}</strong> / {totalPages}</span>
                        <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => fetchRequests(page + 1, filterStatus, pageSize)}>
                            Tiếp theo
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL KIỂM TRA KYC */}
            {kycData && (
                <div className="elite-modal-backdrop" onClick={() => setKycData(null)}>
                    <div className="elite-modal-window kyc-modal-window" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-elite">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                                <FaShieldAlt color="#3b82f6" /> Hồ sơ Xác thực Danh tính (KYC)
                            </h3>
                            <button className="btn-close-modal" onClick={() => setKycData(null)}><FaTimes /></button>
                        </div>
                        <div className="modal-body-elite" style={{ padding: '20px' }}>
                            <div className="kyc-grid-layout">
                                <div className="kyc-card">
                                    <h4><FaUser /> Thông tin Hệ thống</h4>
                                    <p><strong>Tài khoản:</strong> {kycData.shopName}</p>
                                    <p><strong>Loại User:</strong> {kycData.targetType === 'BUYER' ? 'Người Mua' : 'Cửa Hàng'}</p>
                                    <p><strong>Ngày tạo lệnh:</strong> {new Date(kycData.createdAt).toLocaleString('vi-VN')}</p>
                                    <p><strong>Mức độ rủi ro:</strong> <span style={{color: '#10b981', fontWeight: 'bold'}}>An Toàn</span></p>
                                </div>
                                <div className="kyc-card">
                                    <h4><FaIdCard /> Thông tin Thụ hưởng</h4>
                                    <p><strong>Ngân hàng:</strong> {kycData.bankName}</p>
                                    <p><strong>Số tài khoản:</strong> <code style={{background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px'}}>{kycData.accountNumber}</code></p>
                                    <p><strong>Tên chủ thẻ:</strong> <span style={{textTransform: 'uppercase', color: '#eab308', fontWeight: 'bold'}}>{kycData.accountHolder}</span></p>
                                </div>
                            </div>
                            <div className="kyc-alert-box">
                                <FaExclamationTriangle className="icon-warn"/>
                                <span>Vui lòng đảm bảo <b>Tên chủ thẻ ngân hàng ({kycData.accountHolder})</b> khớp với tên đăng ký trên hệ thống để phòng chống rửa tiền.</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PHÊ DUYỆT RÚT TIỀN */}
            {processingId && activeReq && (
                <div className="elite-modal-backdrop" onClick={() => setProcessingId(null)}>
                    <div className="elite-modal-window" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-elite">
                            <h3>{isPending ? 'Xử lý Yêu cầu (Duyệt Lệnh)' : 'Xác nhận Chuyển khoản (Thủ công)'}</h3>
                            <button className="btn-close-modal" onClick={() => setProcessingId(null)}><FaTimes /></button>
                        </div>
                        
                        <div className="modal-body-elite">
                            {isPending && (
                                <div className={`warning-callout ${autoPayoutEnabled ? 'auto-payout-callout' : 'pending-callout'}`}>
                                    <FaExclamationTriangle className="icon-warn" />
                                    <p>
                                        {autoPayoutEnabled ? 
                                            <span>Lệnh này sẽ được <b>TỰ ĐỘNG GIẢI NGÂN</b> qua API Ngân hàng ngay khi bạn bấm duyệt!</span> : 
                                            <span>Hệ thống đang Tắt Auto-Payout. Lệnh này sẽ được chuyển sang trạng thái <b>Chờ CK thủ công</b>.</span>
                                        }
                                    </p>
                                </div>
                            )}

                            {isProcessing && (
                                <div className="warning-callout processing-callout">
                                    <FaExclamationTriangle className="icon-warn" />
                                    <p>Admin chú ý: Bạn phải dùng App Ngân hàng chuyển đúng <b>₫{activeReq.amount?.toLocaleString('vi-VN')}</b> cho tài khoản <b>{activeReq.accountNumber}</b> trước khi bấm Xác nhận!</p>
                                </div>
                            )}
                            
                            {/* 🚀 ĐÃ SỬA: KHU VỰC NHẬP LIỆU ĐƯỢC THIẾT KẾ LẠI */}
                            <div className="form-group-elite">
                                <label className="elite-label">
                                    <FaEdit className="label-icon" /> Ghi chú đối soát (Mã GD / Lý do từ chối)
                                </label>
                                <textarea 
                                    className="elite-textarea"
                                    value={adminNote} 
                                    onChange={(e) => setAdminNote(e.target.value)} 
                                    placeholder={isProcessing ? "Ví dụ: Đã chuyển khoản qua VCB, Mã GD: 123456..." : "Ghi chú nội bộ (không bắt buộc nếu duyệt)..."}
                                    rows={4}
                                />
                            </div>
                        </div>

                        <div className="modal-footer-elite">
                            {isPending && (
                                <>
                                    <button className="btn-reject-modal" onClick={() => handleProcess(processingId, 'REJECTED')}>Từ chối</button>
                                    <button className="btn-confirm-modal" onClick={() => handleProcess(processingId, 'APPROVED')}>Duyệt Lệnh</button>
                                </>
                            )}
                            
                            {isProcessing && (
                                <>
                                    <button className="btn-reject-modal" onClick={() => setProcessingId(null)}>Hủy / Đóng</button>
                                    <button className="btn-confirm-modal" onClick={() => handleProcess(processingId, 'COMPLETED')}>Đã Chuyển Khoản Xong</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminWithdrawals;
