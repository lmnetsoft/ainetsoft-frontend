import React, { useState, useEffect, useRef } from 'react';
import { FaCoins, FaHistory, FaUserEdit, FaSearch, FaUserCircle } from 'react-icons/fa';
import api from '../../services/api';
import ToastNotification from '../../components/Toast/ToastNotification';
import './AdminCoins.css';

import logoWithoutText from '../../assets/images/logo_without_text.png';

const AdminCoins = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [adjustData, setAdjustData] = useState({ userId: '', amount: '', reason: '' });
    
    // --- 🚀 NEW STATES FOR SEARCH & PICK ---
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [toast, setToast] = useState({ message: '', isVisible: false });

    const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8080";

    useEffect(() => {
        fetchStats();
        // Click ra ngoài để đóng dropdown
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/coins/stats');
            setStats(res.data);
        } catch (err) {
            showToast("Không thể tải thống kê Xu.");
        } finally {
            setLoading(false);
        }
    };

    // --- 🚀 NEW: LOGIC TÌM KIẾM USER ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.trim().length >= 2) {
                handleUserSearch();
            } else {
                setSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleUserSearch = async () => {
        setIsSearching(true);
        try {
            const res = await api.get(`/admin/users/search?query=${searchTerm}`);
            setSuggestions(res.data);
            setShowSuggestions(true);
        } catch (err) {
            console.error("Search error", err);
        } finally {
            setIsSearching(false);
        }
    };

    const selectUser = (user: any) => {
        setAdjustData({ ...adjustData, userId: user.id });
        setSearchTerm(`${user.fullName} (${user.email})`);
        setShowSuggestions(false);
    };

    const handleAdjust = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adjustData.userId || !adjustData.amount) {
            showToast("Vui lòng chọn người dùng và nhập số Xu.");
            return;
        }

        try {
            await api.post('/admin/coins/adjust', adjustData);
            showToast("✅ Điều chỉnh Xu thành công!");
            setAdjustData({ userId: '', amount: '', reason: '' });
            setSearchTerm('');
            fetchStats();
        } catch (err: any) {
            showToast(err.response?.data?.message || "Lỗi khi điều chỉnh Xu.");
        }
    };

    const showToast = (message: string) => {
        setToast({ message, isVisible: true });
    };

    const bitnamilegacy = (path: string | null) => {
        if (!path || path === "DEFAULT_LOGO") return logoWithoutText;
        if (path.startsWith('http') || path.startsWith('data:')) return path;
        return `${API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
    };

    if (loading) return <div className="admin-loading">Đang tải dữ liệu...</div>;

    return (
        <div className="admin-coins-wrapper">
            <ToastNotification 
                message={toast.message} 
                isVisible={toast.isVisible} 
                onClose={() => setToast({ ...toast, isVisible: false })} 
            />

            <div className="admin-coins-header">
                <h2>💰 QUẢN LÝ AINETSOFT XU</h2>
                <p>Theo dõi dòng tiền ảo lưu hành và thực hiện các tác vụ điều chỉnh thủ công.</p>
            </div>

            <div className="coins-stats-grid">
                <div className="stat-card">
                    <div className="stat-info">
                        <span>TỔNG XU ĐANG LƯU HÀNH</span>
                        <h3>{stats?.totalCoinsInSystem?.toLocaleString()} <small>Xu</small></h3>
                        <p>≈ {stats?.totalCoinsInSystem?.toLocaleString()} VNĐ nợ hệ thống</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <span>TỔNG SỐ VÍ CÓ XU</span>
                        <h3>{stats?.totalWallets?.toLocaleString()} <small>ví</small></h3>
                        <p>Dựa trên tổng số người dùng có ví trên hệ thống</p>
                    </div>
                </div>
            </div>

            <div className="coins-action-card">
                <div className="card-header">
                    <FaUserEdit /> Thưởng/Trừ Xu Thủ Công
                </div>
                <div className="card-body">
                    <p className="helper-text">Sử dụng công cụ này để đền bù cho khách hàng khi có sự cố đơn hàng hoặc thu hồi Xu phát sinh sai lệch.</p>
                    
                    <form className="coins-adjust-form" onSubmit={handleAdjust}>
                        <div className="search-user-container" ref={dropdownRef}>
                            <div className="search-input-wrapper">
                                <FaSearch className="search-icon" />
                                <input 
                                    type="text" 
                                    placeholder="Tìm tên hoặc Email khách hàng..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                                />
                                {isSearching && <div className="searching-spinner" />}
                            </div>

                            {showSuggestions && suggestions.length > 0 && (
                                <div className="user-suggestions-dropdown">
                                    {suggestions.map((u) => (
                                        <div key={u.id} className="suggestion-item" onClick={() => selectUser(u)}>
                                            <img src={bitnamilegacy(u.avatarUrl)} alt="avatar" />
                                            <div className="suggest-info">
                                                <div className="suggest-name">{u.fullName}</div>
                                                <div className="suggest-email">{u.email}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <input 
                            type="number" 
                            placeholder="Số Xu (VD: 1000 hoặc -500)" 
                            value={adjustData.amount}
                            onChange={(e) => setAdjustData({ ...adjustData, amount: e.target.value })}
                        />
                        <input 
                            type="text" 
                            placeholder="Lý do (Báo cho khách hàng)" 
                            value={adjustData.reason}
                            onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                        />
                        <button type="submit" className="btn-execute">Thực hiện</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminCoins;