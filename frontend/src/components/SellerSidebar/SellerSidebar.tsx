import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaClipboardList, FaBoxOpen, FaBullhorn, FaHeadset, 
  FaWallet, FaChartBar, FaStore, FaChevronDown, FaChevronUp, FaArrowLeft
} from 'react-icons/fa';
import './SellerSidebar.css';

const SellerSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    orders: path.includes('/seller/order') || path.includes('/seller/settings/shipping'),
    products: path.includes('/seller/product') || path.includes('/seller/add'),
    // 🚀 BỔ SUNG: Nhận diện URL /seller/vouchers để giữ menu Marketing mở
    marketing: path.includes('/seller/marketing') || path.includes('/seller/vouchers'),
    cskh: path.includes('/seller/chat') || path.includes('/seller/review'),
    finance: path.includes('/seller/revenue') || path.includes('/seller/balance') || path.includes('/seller/bank'),
    data: path.includes('/seller/data'),
    shop: path.includes('/seller/settings') && !path.includes('/settings/shipping')
  });

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <aside className="seller-sidebar-wrapper">
      <div className="seller-sidebar-header">
        <div className="back-to-buyer" onClick={() => navigate('/')}>
          <FaArrowLeft /> <span>Trở về AiNetsoft</span>
        </div>
        <div className="seller-logo-area">
          <h2>Kênh Người Bán</h2>
        </div>
      </div>

      <nav className="seller-nav-menu">
        
        {/* NÚT ĐIỀU HƯỚNG VỀ TỔNG QUAN SELLER */}
        <div className="seller-nav-group">
          <div 
             className="seller-group-title" 
             onClick={() => navigate('/seller/dashboard')}
             style={{ 
                 backgroundColor: path === '/seller/dashboard' ? '#fff5f2' : 'transparent', 
                 color: path === '/seller/dashboard' ? '#ee4d2d' : 'inherit' 
             }}
          >
            <span className="title-left"><FaChartBar style={{marginRight: '12px'}} /> Tổng Quan</span>
          </div>
        </div>

        {/* 1. QUẢN LÝ ĐƠN HÀNG */}
        <div className="seller-nav-group">
          <div className="seller-group-title" onClick={() => toggleGroup('orders')}>
            <span className="title-left">Quản Lý Đơn Hàng</span>
            {openGroups.orders ? <FaChevronUp className="chevron" /> : <FaChevronDown className="chevron" />}
          </div>
          <div className={`seller-sub-menu ${openGroups.orders ? 'open' : ''}`}>
            <NavLink to="/seller/orders" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Tất cả</NavLink>
            <NavLink to="/seller/orders/mass" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Giao Hàng Loạt</NavLink>
            <NavLink to="/seller/orders/handover" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Bàn Giao Đơn Hàng</NavLink>
            <NavLink to="/seller/orders/returns" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Đơn Trả hàng/Hoàn tiền</NavLink>
            <NavLink to="/seller/settings/shipping" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Cài Đặt Vận Chuyển</NavLink>
          </div>
        </div>

        {/* 2. QUẢN LÝ SẢN PHẨM */}
        <div className="seller-nav-group">
          <div className="seller-group-title" onClick={() => toggleGroup('products')}>
            <span className="title-left">Quản Lý Sản Phẩm</span>
            {openGroups.products ? <FaChevronUp className="chevron" /> : <FaChevronDown className="chevron" />}
          </div>
          <div className={`seller-sub-menu ${openGroups.products ? 'open' : ''}`}>
            <NavLink to="/seller/products" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Tất Cả Sản Phẩm</NavLink>
            <NavLink to="/seller/add-product" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Thêm Sản Phẩm</NavLink>
            <NavLink to="/seller/products/ai" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Công cụ Tối ưu AI</NavLink>
          </div>
        </div>

        {/* 3. KÊNH MARKETING */}
        <div className="seller-nav-group">
          <div className="seller-group-title" onClick={() => toggleGroup('marketing')}>
            <span className="title-left">Kênh Marketing</span>
            {openGroups.marketing ? <FaChevronUp className="chevron" /> : <FaChevronDown className="chevron" />}
          </div>
          {/* 🚀 BỔ SUNG: Menu Quản lý Voucher */}
          <div className={`seller-sub-menu ${openGroups.marketing ? 'open' : ''}`}>
            <NavLink to="/seller/vouchers" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Quản Lý Voucher</NavLink>
          </div>
        </div>

        {/* 4. CHĂM SÓC KHÁCH HÀNG */}
        <div className="seller-nav-group">
          <div className="seller-group-title" onClick={() => toggleGroup('cskh')}>
            <span className="title-left">Chăm sóc khách hàng</span>
            {openGroups.cskh ? <FaChevronUp className="chevron" /> : <FaChevronDown className="chevron" />}
          </div>
          <div className={`seller-sub-menu ${openGroups.cskh ? 'open' : ''}`}>
            <NavLink to="/seller/chat" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Quản Lý Tin Nhắn</NavLink>
          </div>
        </div>

        {/* 5. TÀI CHÍNH */}
        <div className="seller-nav-group">
          <div className="seller-group-title" onClick={() => toggleGroup('finance')}>
            <span className="title-left">Tài Chính</span>
            {openGroups.finance ? <FaChevronUp className="chevron" /> : <FaChevronDown className="chevron" />}
          </div>
          <div className={`seller-sub-menu ${openGroups.finance ? 'open' : ''}`}>
            <NavLink to="/seller/revenue" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Doanh Thu</NavLink>
            <NavLink to="/seller/balance" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Số dư TK AiNetsoft</NavLink>
            <NavLink to="/user/bank" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Tài Khoản Ngân Hàng</NavLink>
          </div>
        </div>

        {/* 6. DỮ LIỆU */}
        <div className="seller-nav-group">
          <div className="seller-group-title" onClick={() => toggleGroup('data')}>
            <span className="title-left">Dữ Liệu</span>
            {openGroups.data ? <FaChevronUp className="chevron" /> : <FaChevronDown className="chevron" />}
          </div>
          <div className={`seller-sub-menu ${openGroups.data ? 'open' : ''}`}>
            <NavLink to="/seller/data/analytics" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Phân Tích Bán Hàng</NavLink>
            <NavLink to="/seller/data/performance" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Hiệu Quả Hoạt Động</NavLink>
          </div>
        </div>

        {/* 7. QUẢN LÝ SHOP */}
        <div className="seller-nav-group">
          <div className="seller-group-title" onClick={() => toggleGroup('shop')}>
            <span className="title-left">Quản Lý Shop</span>
            {openGroups.shop ? <FaChevronUp className="chevron" /> : <FaChevronDown className="chevron" />}
          </div>
          <div className={`seller-sub-menu ${openGroups.shop ? 'open' : ''}`}>
            <NavLink to="/seller/settings/profile" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Hồ Sơ Shop</NavLink>
            <NavLink to="/seller/settings/decoration" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Trang Trí Shop</NavLink>
            <NavLink to="/seller/settings" className={({isActive}) => isActive ? "sub-item active" : "sub-item"}>Thiết Lập Shop</NavLink>
          </div>
        </div>

      </nav>
    </aside>
  );
};

export default SellerSidebar;