import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaStore, FaBox, FaClock } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import adminService from '../../services/admin.service';
import SellerModeration from './SellerModeration';
import ProductModeration from './ProductModeration';
import ProductTable from './ProductTable';
import { toast } from 'react-hot-toast';
import './AdminDashboard.css';

const AdminStoreManager: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const topRef = useRef<HTMLDivElement>(null);
  
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'sellers';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [tabLoading, setTabLoading] = useState(false);

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [productPage, setProductPage] = useState(0);
  const [productPageSize, setProductPageSize] = useState(10);
  const [productTotalPages, setProductTotalPages] = useState(0);
  const [productTotalElements, setProductTotalElements] = useState(0);

  useEffect(() => {
    const currentTab = queryParams.get('tab') || 'sellers';
    setActiveTab(currentTab);
  }, [location.search]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/admin/stores?tab=${tab}`, { replace: true });
  };

  const fetchProducts = useCallback(async () => {
    try {
      setTabLoading(true);
      
      // 🚀 Chờ lấy Summary TRƯỚC để đảm bảo có data fallback an toàn
      const summary = await adminService.getDashboardSummary().catch(() => null);
      const res = await adminService.getAllProducts(productPage, productPageSize);
      
      const payload = res?.data || res;
      const content = payload?.content || (Array.isArray(payload) ? payload : []);
      
      // Bóc tách cẩn thận tổng số elements (Đã fix lỗi undef)
      let totalElems = payload?.totalElements;
      if (totalElems === undefined) totalElems = payload?.totalItems;
      if (totalElems === undefined || totalElems === null) {
          totalElems = summary?.totalProducts || content.length;
      }

      const calculatedPages = Math.ceil(totalElems / productPageSize) || 1;
      const totalPgs = payload?.totalPages !== undefined ? payload.totalPages : calculatedPages;

      setAllProducts(content);
      setProductTotalElements(totalElems);
      setProductTotalPages(totalPgs);
    } catch (err) {
      toast.error("Không thể tải danh sách sản phẩm.");
      setAllProducts([]);
    } finally {
      setTabLoading(false);
    }
  }, [productPage, productPageSize]);

  // 🚀 LOGIC TỰ ĐỘNG CUỘN TRANG (SMOOTH SCROLL)
  const handlePageChange = (newPage: number) => {
    setProductPage(newPage);
    setTimeout(() => {
      if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const handlePageSizeChange = (newSize: number) => {
    setProductPageSize(newSize);
    setProductPage(0);
    setTimeout(() => {
      if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Xóa vĩnh viễn sản phẩm này?")) return;
    try {
      await adminService.deleteProduct(id);
      toast.success("Đã xóa sản phẩm.");
      fetchProducts();
    } catch (err) { toast.error("Lỗi xóa sản phẩm."); }
  };

  useEffect(() => {
    if (activeTab === 'products') fetchProducts();
  }, [activeTab, fetchProducts]);

  return (
    <div className="admin-dashboard-wrapper" ref={topRef}>
      <header className="admin-page-header">
        <div className="header-left">
          <h1><FaStore style={{ marginRight: '10px' }} /> Quản lý Gian hàng & Sản phẩm</h1>
          <p style={{ color: '#64748b', marginTop: '10px', fontWeight: 500, fontSize: '14.5px' }}>
            Kiểm duyệt người bán mới và quản lý toàn bộ sản phẩm trên hệ thống.
          </p>
        </div>
      </header>

      <nav className="content-tabs">
        <button className={activeTab === 'sellers' ? 'active' : ''} onClick={() => handleTabChange('sellers')}><FaStore size={14} style={{ marginRight: '6px' }} /> Duyệt Shop</button>
        <button className={activeTab === 'products_mod' ? 'active' : ''} onClick={() => handleTabChange('products_mod')}><FaClock size={14} style={{ marginRight: '6px' }} /> Duyệt Sản phẩm</button>
        <button className={activeTab === 'products' ? 'active' : ''} onClick={() => handleTabChange('products')}><FaBox size={14} style={{ marginRight: '6px' }} /> Tất cả sản phẩm</button>
      </nav>

      <section className="dynamic-view-area" style={{ marginTop: '20px' }}>
        {tabLoading && activeTab === 'products' && (
          <div className="tab-loading-spinner">Đang tải dữ liệu...</div>
        )}
        
        <div style={{ opacity: tabLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          {activeTab === 'sellers' && <SellerModeration />}
          {activeTab === 'products_mod' && <ProductModeration />}
          {activeTab === 'products' && !tabLoading && (
            <ProductTable 
              products={allProducts} 
              onDelete={handleDeleteProduct} 
              currentPage={productPage}
              pageSize={productPageSize}
              totalElements={productTotalElements}
              totalPages={productTotalPages}
              onPageChange={handlePageChange} 
              onPageSizeChange={handlePageSizeChange} 
            />
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminStoreManager;
