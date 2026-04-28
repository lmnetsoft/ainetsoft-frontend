import React, { useState } from 'react';
import { FaBullhorn, FaTimes, FaUsers, FaStore, FaGlobe } from 'react-icons/fa';
import { sendBroadcastNotification } from '../../services/notificationService';
import toast from 'react-hot-toast';

interface AdminBroadcastModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AdminBroadcastModal: React.FC<AdminBroadcastModalProps> = ({ isOpen, onClose }) => {
    const [audience, setAudience] = useState('ALL');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    if (!isOpen) return null;

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            toast.error("Vui lòng nhập đầy đủ Tiêu đề và Nội dung!");
            return;
        }

        try {
            setIsSending(true);
            await sendBroadcastNotification(audience, title, message);
            toast.success("Đã phát sóng thông báo thành công!");
            
            // Reset form và đóng modal
            setTitle('');
            setMessage('');
            setAudience('ALL');
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi phát sóng thông báo.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }} onClick={onClose}>
            
            <div style={{
                background: '#fff', width: '500px', borderRadius: '12px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden',
                animation: 'fadeIn 0.3s ease-in-out'
            }} onClick={e => e.stopPropagation()}>
                
                <div style={{
                    background: '#fff5f2', padding: '20px 25px', borderBottom: '1px solid #ffdece',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0, color: '#ee4d2d', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaBullhorn size={20} /> PHÁT LOA THÔNG BÁO TOÀN SÀN
                    </h3>
                    <button onClick={onClose} style={{
                        background: 'transparent', border: 'none', fontSize: '18px', color: '#888', cursor: 'pointer'
                    }}><FaTimes /></button>
                </div>

                <form onSubmit={handleBroadcast} style={{ padding: '25px' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontWeight: 600, color: '#555', marginBottom: '8px' }}>Đối tượng nhận tin</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="button" onClick={() => setAudience('ALL')} style={{
                                flex: 1, padding: '10px', borderRadius: '6px', border: `2px solid ${audience === 'ALL' ? '#ee4d2d' : '#efefef'}`,
                                background: audience === 'ALL' ? '#fff5f2' : '#fff', color: audience === 'ALL' ? '#ee4d2d' : '#777',
                                cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                            }}><FaGlobe /> Tất cả</button>
                            
                            <button type="button" onClick={() => setAudience('SELLERS')} style={{
                                flex: 1, padding: '10px', borderRadius: '6px', border: `2px solid ${audience === 'SELLERS' ? '#26aa99' : '#efefef'}`,
                                background: audience === 'SELLERS' ? '#f0fcf9' : '#fff', color: audience === 'SELLERS' ? '#26aa99' : '#777',
                                cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                            }}><FaStore /> Người bán</button>

                            <button type="button" onClick={() => setAudience('BUYERS')} style={{
                                flex: 1, padding: '10px', borderRadius: '6px', border: `2px solid ${audience === 'BUYERS' ? '#3b82f6' : '#efefef'}`,
                                background: audience === 'BUYERS' ? '#eff6ff' : '#fff', color: audience === 'BUYERS' ? '#3b82f6' : '#777',
                                cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                            }}><FaUsers /> Khách mua</button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontWeight: 600, color: '#555', marginBottom: '8px' }}>Tiêu đề thông báo</label>
                        <input 
                            type="text" 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            placeholder="Ví dụ: BẢO TRÌ HỆ THỐNG LÚC 2H SÁNG..."
                            style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', fontWeight: 600, color: '#555', marginBottom: '8px' }}>Nội dung chi tiết</label>
                        <textarea 
                            value={message} 
                            onChange={e => setMessage(e.target.value)} 
                            placeholder="Nhập nội dung bạn muốn gửi tới mọi người..."
                            rows={4}
                            style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box', resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                        <button type="button" onClick={onClose} style={{
                            padding: '10px 20px', background: '#f5f5f5', border: 'none', color: '#555', borderRadius: '4px', cursor: 'pointer', fontWeight: 600
                        }}>Hủy bỏ</button>
                        
                        <button type="submit" disabled={isSending} style={{
                            padding: '10px 20px', background: '#ee4d2d', border: 'none', color: '#fff', borderRadius: '4px', cursor: isSending ? 'not-allowed' : 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <FaBullhorn /> {isSending ? 'Đang phát sóng...' : 'Phát sóng ngay'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminBroadcastModal;