import React, { useState, useEffect } from 'react';
import ToastNotification from '../../components/Toast/ToastNotification';
import { getUserProfile, updateShopSettings } from '../../services/authService';
import api from '../../services/api'; 
import { 
    FaTruck, FaExclamationTriangle, FaPlus, FaTrash, FaHourglassHalf,
    FaChevronDown, FaChevronUp, FaBolt, FaBoxOpen, FaHandHoldingHeart, FaReceipt
} from 'react-icons/fa';

import './SellerSettings.css'; 

const getNextMidnightString = () => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${next.getFullYear()}-${pad(next.getMonth()+1)}-${pad(next.getDate())}T00:00:00`;
};

const SellerShippingSettings = () => {
    const [fullProfile, setFullProfile] = useState<any>(null);
    const [addresses, setAddresses] = useState<any[]>([]);

    const [shippingMethodsList, setShippingMethodsList] = useState<any[]>([]);
    const [enabledShippingMethodIds, setEnabledShippingMethodIds] = useState<string[]>([]);
    const [customShippingMethods, setCustomShippingMethods] = useState<string[]>([]);
    const [selfPickupEnabled, setSelfPickupEnabled] = useState<boolean>(false);
    
    const [expressPausedUntil, setExpressPausedUntil] = useState<string | null>(null);
    const [countdown, setCountdown] = useState<string>('00:00:00');
    
    // 🚀 NEW: Thermal Printing Config State
    const [thermalPrintingEnabled, setThermalPrintingEnabled] = useState<boolean>(false);

    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        express: true,
        standard: true,
        pickup: true,
        custom: true
    });

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [hasPendingUpdate, setHasPendingUpdate] = useState(false);

    const [initialShippingStr, setInitialShippingStr] = useState('');
    const [initialCustomStr, setInitialCustomStr] = useState('');
    const [initialSelfPickup, setInitialSelfPickup] = useState(false);
    const [initialExpressPaused, setInitialExpressPaused] = useState<string | null>(null);
    const [initialThermal, setInitialThermal] = useState(false);

    const hasActualChanges = 
        JSON.stringify(enabledShippingMethodIds) !== initialShippingStr || 
        JSON.stringify(customShippingMethods) !== initialCustomStr ||
        selfPickupEnabled !== initialSelfPickup ||
        expressPausedUntil !== initialExpressPaused ||
        thermalPrintingEnabled !== initialThermal;

    useEffect(() => {
        const fetchShippingData = async () => {
            try {
                setLoading(true);
                const [userData, shippingRes] = await Promise.all([
                    getUserProfile(),
                    api.get('/shipping-methods/active')
                ]);
                
                setShippingMethodsList(Array.isArray(shippingRes.data) ? shippingRes.data : []);

                if (userData.shopProfile) {
                    setFullProfile(userData.shopProfile);
                    setAddresses(userData.addresses || []);
                    setHasPendingUpdate(userData.hasPendingUpdate);

                    const enabledList = userData.shopProfile.enabledShippingMethodIds || [];
                    const rawCustomList = userData.shopProfile.customShippingMethods || [];
                    const pausedTime = userData.shopProfile.expressPausedUntil || null;
                    const thermalPrint = userData.shopProfile.thermalPrintingEnabled || false;

                    const hasSelfPickup = rawCustomList.includes('__SELF_PICKUP__');
                    const filteredCustomList = rawCustomList.filter((m: string) => m !== '__SELF_PICKUP__');

                    setEnabledShippingMethodIds(enabledList);
                    setCustomShippingMethods(filteredCustomList);
                    setSelfPickupEnabled(hasSelfPickup);
                    setExpressPausedUntil(pausedTime);
                    setThermalPrintingEnabled(thermalPrint);

                    setInitialShippingStr(JSON.stringify(enabledList));
                    setInitialCustomStr(JSON.stringify(filteredCustomList));
                    setInitialSelfPickup(hasSelfPickup);
                    setInitialExpressPaused(pausedTime);
                    setInitialThermal(thermalPrint);
                }
            } catch (error) { 
                console.error("Failed to load shipping settings:", error); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchShippingData();
        document.title = "Cài đặt Vận chuyển | AiNetsoft";
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (expressPausedUntil) {
            const tick = () => {
                const now = new Date().getTime();
                const target = new Date(expressPausedUntil).getTime();
                const diff = target - now;

                if (diff <= 0) {
                    setCountdown('00:00:00');
                    setExpressPausedUntil(null); 
                } else {
                    const h = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
                    const m = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
                    const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
                    setCountdown(`${h}:${m}:${s}`);
                }
            };
            tick();
            interval = setInterval(tick, 1000);
        }
        return () => clearInterval(interval);
    }, [expressPausedUntil]);

    const expressMethods = shippingMethodsList.filter(m => 
        m.name.toLowerCase().includes('hỏa tốc') || 
        m.name.toLowerCase().includes('siêu tốc')
    );
    const standardMethods = shippingMethodsList.filter(m => 
        !m.name.toLowerCase().includes('hỏa tốc') && 
        !m.name.toLowerCase().includes('siêu tốc')
    );

    const toggleShippingMethod = (methodId: string) => {
        setEnabledShippingMethodIds(prev => 
            prev.includes(methodId) ? prev.filter(id => id !== methodId) : [...prev, methodId]
        );
    };

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
    };

    const handleAddCustomMethod = () => setCustomShippingMethods([...customShippingMethods, '']);
    const handleUpdateCustomMethod = (index: number, value: string) => {
        const updated = [...customShippingMethods];
        updated[index] = value;
        setCustomShippingMethods(updated);
    };
    const handleRemoveCustomMethod = (index: number) => {
        setCustomShippingMethods(customShippingMethods.filter((_, i) => i !== index));
    };

    const togglePauseExpress = () => {
        if (expressPausedUntil) {
            setExpressPausedUntil(null);
        } else {
            setExpressPausedUntil(getNextMidnightString());
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const formData = new FormData();
            
            const finalCustomMethods = customShippingMethods.filter(m => m.trim() !== '');
            if (selfPickupEnabled) {
                finalCustomMethods.push('__SELF_PICKUP__');
            }

            const payload = {
                shopName: fullProfile.shopName,
                shopBio: fullProfile.shopDescription,
                taxCode: fullProfile.taxCode,
                businessType: fullProfile.businessType,
                lowStockThreshold: fullProfile.lowStockThreshold,
                holidayMode: fullProfile.holidayMode,
                enabledShippingMethodIds: enabledShippingMethodIds,
                customShippingMethods: finalCustomMethods,
                expressPausedUntil: expressPausedUntil, 
                thermalPrintingEnabled: thermalPrintingEnabled, // 🚀 Payload updated
                stockAddresses: addresses.map(addr => ({
                    fullName: addr.receiverName,
                    phoneNumber: addr.phone,
                    province: addr.province,
                    ward: addr.ward,
                    hamlet: addr.hamlet,
                    detailAddress: addr.detail,
                    latitude: addr.latitude,
                    longitude: addr.longitude,
                    isDefault: addr.isDefault 
                }))
            };
            
            formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

            await updateShopSettings(formData);
            
            setToastMessage("Cập nhật cấu hình vận chuyển thành công!");
            setShowToast(true);

            setInitialShippingStr(JSON.stringify(payload.enabledShippingMethodIds));
            setInitialCustomStr(JSON.stringify(customShippingMethods.filter(m => m.trim() !== '')));
            setInitialSelfPickup(selfPickupEnabled);
            setInitialExpressPaused(expressPausedUntil);
            setInitialThermal(thermalPrintingEnabled);

        } catch (error: any) {
            setToastMessage(error.response?.data || "Cập nhật thất bại.");
            setShowToast(true);
        } finally { 
            setIsSaving(false); 
        }
    };

    return (
        <main className="seller-settings-supreme-layout">
            <ToastNotification message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
            
            <style>
            {`
            .pause-tooltip-container { position: relative; }
            .pause-tooltip {
                visibility: hidden; opacity: 0; transition: opacity 0.2s;
                position: absolute; top: 100%; left: 0; margin-top: 8px;
                width: 320px; background: #fff; border: 1px solid #f0f0f0;
                border-radius: 6px; padding: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 100;
            }
            .pause-tooltip-container:hover .pause-tooltip { visibility: visible; opacity: 1; }
            .pause-tooltip ul { padding-left: 20px; margin: 0 0 10px 0; color: #595959; font-size: 12.5px; line-height: 1.6; }
            `}
            </style>

            <div className="header-with-icon">
                <FaTruck className="header-icon" style={{ color: '#ee4d2d' }} />
                <h1>Cài đặt Vận chuyển</h1>
                <p>Quản lý các đối tác vận chuyển, lấy hàng chủ động và phương thức giao hàng tự túc</p>
            </div>
            
            <hr className="supreme-divider" />

            {hasPendingUpdate && (
                <div className="vibrant-pending-banner">
                    <FaHourglassHalf className="spin-icon" />
                    <span>Hồ sơ Shop của bạn <strong>đang chờ Admin phê duyệt</strong>. Các thiết lập vận chuyển dưới đây sẽ vẫn được lưu và áp dụng độc lập ngay lập tức.</span>
                </div>
            )}

            {loading ? (
                <div className="loading-spinner-container">Đang tải cấu hình vận chuyển...</div>
            ) : (
                <div className="settings-scroll-view" style={{ backgroundColor: '#f6f6f6', padding: '20px', borderRadius: '8px' }}>
                    
                    {/* NHÓM 1: ĐƠN HỎA TỐC */}
                    {expressMethods.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <h3 style={{ fontSize: '18px', margin: 0, color: '#262626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FaBolt style={{ color: '#faad14' }} /> Đơn Hỏa Tốc
                                    </h3>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', fontSize: '13.5px', color: '#595959' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', marginRight: '10px' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: expressPausedUntil ? '#d9d9d9' : '#52c41a' }}></span>
                                            Trạng thái kênh: {expressPausedUntil ? 'Đang tạm ngừng' : 'Bật'}
                                        </span>
                                        <div className="pause-tooltip-container">
                                            <button 
                                                onClick={togglePauseExpress}
                                                style={{ background: '#fff', border: '1px solid #d9d9d9', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                            >
                                                {expressPausedUntil ? 'Bật lại kênh Hỏa Tốc' : 'Tạm ngừng kênh Hỏa Tốc'}
                                            </button>
                                            <div className="pause-tooltip">
                                                <ul>
                                                    <li>Shop sẽ không phát sinh đơn Hỏa Tốc trong thời gian tạm ngừng kênh</li>
                                                    <li>Đơn hàng phát sinh trước đó sẽ không bị ảnh hưởng</li>
                                                    <li>Hệ thống sẽ tự động chuyển về trạng thái Bật sau khi hết thời gian hạn mức</li>
                                                    <li>Hạn mức tạm ngừng kênh Hỏa Tốc sẽ được làm mới vào 00:00 (GMT+7)</li>
                                                </ul>
                                                {expressPausedUntil && (
                                                    <div style={{ fontSize: '13px', color: '#595959' }}>
                                                        Thời hạn tạm ngừng: <span style={{ color: '#ee4d2d', fontWeight: 'bold' }}>{countdown}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => toggleGroup('express')}
                                    style={{ background: 'none', border: '1px solid #e8e8e8', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', backgroundColor: '#fff' }}
                                >
                                    {expandedGroups.express ? 'Thu gọn' : 'Mở rộng'} {expandedGroups.express ? <FaChevronUp /> : <FaChevronDown />}
                                </button>
                            </div>
                            <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#8c8c8c' }}>Phương thức vận chuyển giao đến Người mua trong thời gian sớm nhất.</p>

                            {expandedGroups.express && (
                                <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e8e8e8', overflow: 'hidden' }}>
                                    {expressMethods.map((method, index) => (
                                        <div key={method.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: index === expressMethods.length - 1 ? 'none' : '1px solid #f0f0f0' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: '600', color: '#1f1f1f', fontSize: '15px' }}>{method.name}</span>
                                                {method.codEnabled && <span style={{ fontSize: '12px', color: '#ee4d2d', marginTop: '4px' }}>[COD đã được kích hoạt]</span>}
                                            </div>
                                            <label className="ainetsoft-switch">
                                                <input 
                                                    type="checkbox" 
                                                    checked={enabledShippingMethodIds.includes(method.id)} 
                                                    onChange={() => toggleShippingMethod(method.id)} 
                                                    disabled={!!expressPausedUntil} 
                                                />
                                                <span className="slider round"></span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* NHÓM 2: ĐƠN THƯỜNG */}
                    {standardMethods.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h3 style={{ fontSize: '18px', margin: 0, color: '#262626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FaBoxOpen style={{ color: '#1890ff' }} /> Đơn Thường
                                </h3>
                                <button 
                                    onClick={() => toggleGroup('standard')}
                                    style={{ background: 'none', border: '1px solid #e8e8e8', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', backgroundColor: '#fff' }}
                                >
                                    {expandedGroups.standard ? 'Thu gọn' : 'Mở rộng'} {expandedGroups.standard ? <FaChevronUp /> : <FaChevronDown />}
                                </button>
                            </div>
                            <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#8c8c8c' }}>Phương thức vận chuyển chuyên nghiệp, nhanh chóng và đáng tin cậy.</p>

                            {expandedGroups.standard && (
                                <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e8e8e8', overflow: 'hidden' }}>
                                    {standardMethods.map((method, index) => (
                                        <div key={method.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: index === standardMethods.length - 1 ? 'none' : '1px solid #f0f0f0' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: '600', color: '#1f1f1f', fontSize: '15px' }}>{method.name}</span>
                                                {method.codEnabled && <span style={{ fontSize: '12px', color: '#ee4d2d', marginTop: '4px' }}>[COD đã được kích hoạt]</span>}
                                            </div>
                                            <label className="ainetsoft-switch">
                                                <input 
                                                    type="checkbox" 
                                                    checked={enabledShippingMethodIds.includes(method.id)} 
                                                    onChange={() => toggleShippingMethod(method.id)} 
                                                />
                                                <span className="slider round"></span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* NHÓM 3: LẤY HÀNG CHỦ ĐỘNG */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h3 style={{ fontSize: '18px', margin: 0, color: '#262626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaHandHoldingHeart style={{ color: '#52c41a' }} /> Lấy hàng chủ động
                            </h3>
                            <button 
                                onClick={() => toggleGroup('pickup')}
                                style={{ background: 'none', border: '1px solid #e8e8e8', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', backgroundColor: '#fff' }}
                            >
                                {expandedGroups.pickup ? 'Thu gọn' : 'Mở rộng'} {expandedGroups.pickup ? <FaChevronUp /> : <FaChevronDown />}
                            </button>
                        </div>
                        <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#8c8c8c' }}>Cho phép Người mua chủ động đến nhận đơn hàng tại các điểm giao nhận / bưu cục liên kết.</p>

                        {expandedGroups.pickup && (
                            <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e8e8e8', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '600', color: '#1f1f1f', fontSize: '15px' }}>Người mua tự đến lấy tại bưu cục</span>
                                        <span style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>Tăng tính chủ động thời gian nhận hàng cho Người mua (không nhận tại Shop)</span>
                                    </div>
                                    <label className="ainetsoft-switch">
                                        <input 
                                            type="checkbox" 
                                            checked={selfPickupEnabled} 
                                            onChange={(e) => setSelfPickupEnabled(e.target.checked)} 
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* NHÓM 4: TỰ THỎA THUẬN */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h3 style={{ fontSize: '18px', margin: 0, color: '#262626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaTruck style={{ color: '#722ed1' }} /> Phương thức Tự thỏa thuận
                            </h3>
                            <button 
                                onClick={() => toggleGroup('custom')}
                                style={{ background: 'none', border: '1px solid #e8e8e8', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', backgroundColor: '#fff' }}
                            >
                                {expandedGroups.custom ? 'Thu gọn' : 'Mở rộng'} {expandedGroups.custom ? <FaChevronUp /> : <FaChevronDown />}
                            </button>
                        </div>
                        <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#8c8c8c' }}>Người bán tự cấu hình và xử lý các đơn vị vận chuyển ngoài hệ thống.</p>

                        {expandedGroups.custom && (
                            <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e8e8e8', padding: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', backgroundColor: '#fffbe6', padding: '12px', borderRadius: '6px', border: '1px solid #ffe58f', marginBottom: '20px' }}>
                                    <FaExclamationTriangle style={{ color: '#faad14', fontSize: '18px', flexShrink: 0, marginTop: '2px' }} />
                                    <span style={{ fontSize: '13.5px', color: '#8c6100', lineHeight: 1.5 }}>
                                        <strong>Miễn trừ trách nhiệm:</strong> AiNetsoft <b>không</b> chịu trách nhiệm đối với các rủi ro mất mát, thất lạc hoặc tranh chấp phát sinh từ các phương thức vận chuyển tự thỏa thuận do Người bán tự thiết lập.
                                    </span>
                                </div>

                                {customShippingMethods.map((method, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                                        <input 
                                            type="text" 
                                            className="supreme-input" 
                                            value={method} 
                                            onChange={e => handleUpdateCustomMethod(idx, e.target.value)} 
                                            placeholder="VD: Giao hàng qua chành xe Phương Trang..."
                                            style={{ flex: 1, backgroundColor: '#fafafa' }}
                                        />
                                        <button 
                                            onClick={() => handleRemoveCustomMethod(idx)} 
                                            style={{ background: '#fff1f0', color: '#ff4d4f', border: '1px solid #ffa39e', padding: '0 15px', borderRadius: '6px', cursor: 'pointer', transition: '0.2s' }}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                ))}
                                
                                <button 
                                    onClick={handleAddCustomMethod} 
                                    disabled={customShippingMethods.length >= 5}
                                    style={{ background: '#fff', border: '1px dashed #1890ff', color: '#1890ff', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}
                                >
                                    <FaPlus /> Thêm phương thức tự vận chuyển
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* 🚀 NHÓM 5: CHỨNG TỪ VẬN CHUYỂN */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h3 style={{ fontSize: '18px', margin: 0, color: '#262626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaReceipt style={{ color: '#096dd9' }} /> Chứng từ vận chuyển
                            </h3>
                        </div>
                        <div style={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e8e8e8', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '600', color: '#1f1f1f', fontSize: '15px' }}>In Nhiệt (Thermal)</span>
                                    <span style={{ fontSize: '13px', color: '#8c8c8c', marginTop: '4px' }}>Bật In Nhiệt cho các Phiếu Xuất Hàng của tất cả phương thức vận chuyển.</span>
                                </div>
                                <label className="ainetsoft-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={thermalPrintingEnabled} 
                                        onChange={(e) => setThermalPrintingEnabled(e.target.checked)} 
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="supreme-form-actions-right" style={{ marginTop: '30px' }}>
                        <button 
                            className="save-btn-supreme-right" 
                            style={{ backgroundColor: '#ee4d2d', padding: '12px 30px', fontSize: '16px' }}
                            onClick={handleSave} 
                            disabled={isSaving || !hasActualChanges}
                        >
                            {isSaving ? "Đang xử lý..." : "Lưu cài đặt"}
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default SellerShippingSettings;