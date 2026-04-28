import React, { useState, useEffect } from 'react';
import { FaShieldAlt, FaFlag, FaStar, FaTags, FaSync } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import adminService from '../../services/admin.service';
import ReportTable from './ReportTable';
import ReviewTable from './ReviewTable';
import ReasonManagement from './ReasonManagement';
import { toast } from 'react-hot-toast';
import './AdminDashboard.css';

const AdminModeration: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'reports';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [tabLoading, setTabLoading] = useState(false);

  // States
  const [reports, setReports] = useState<any[]>([]); 
  const [allReviews, setAllReviews] = useState<any[]>([]); 
  const [reasons, setReasons] = useState<any[]>([]); 
  const [newReasonName, setNewReasonName] = useState("");

  const [reportPage, setReportPage] = useState(0);
  const [reportPageSize, setReportPageSize] = useState(10);
  const [reviewPage, setReviewPage] = useState(0);
  const [reviewPageSize, setReviewPageSize] = useState(10);

  useEffect(() => {
    setActiveTab(queryParams.get('tab') || 'reports');
  }, [location.search]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/admin/moderation?tab=${tab}`, { replace: true });
  };

  // --- FETCHERS ---
  const fetchReports = async () => {
    try {
      setTabLoading(true);
      const response = await adminService.getAllReports();
      const data = Array.isArray(response) ? response : (response?.content || []);
      setReports(data);
    } catch (err) { console.error("Reports Fetch Error:", err); } 
    finally { setTabLoading(false); }
  };

  const fetchReviews = async () => {
    try {
      setTabLoading(true);
      const response = await adminService.getAllReviews();
      const data = Array.isArray(response) ? response : (response?.content || []);
      setAllReviews(data);
    } catch (err) { console.error("Reviews Fetch Error:", err); } 
    finally { setTabLoading(false); }
  };

  const fetchReasons = async () => {
    try {
      setTabLoading(true);
      const response = await adminService.getViolationReasons();
      const data = response.data || response;
      const mainList = data.filter((r: any) => r.name !== "Lý do khác...");
      const otherItem = data.filter((r: any) => r.name === "Lý do khác...");
      setReasons([...mainList, ...otherItem]);
    } catch (err) { console.error("Reasons Fetch Error:", err); } 
    finally { setTabLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'reviews') fetchReviews();
    if (activeTab === 'reasons') fetchReasons();
  }, [activeTab, reportPage, reportPageSize, reviewPage, reviewPageSize]);

  // --- HANDLERS ---
  const handleResolveReport = async (reportId: string, action: 'RESOLVED' | 'DISMISSED') => {
    try {
      await adminService.resolveReport(reportId, action);
      toast.success(action === 'RESOLVED' ? "Đã xác nhận vi phạm" : "Đã bác bỏ");
      fetchReports();
    } catch (err) { toast.error("Thao tác thất bại."); }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm("Xóa vĩnh viễn báo cáo này?")) return;
    try {
      await adminService.deleteReport(reportId);
      toast.success("Đã xóa.");
      fetchReports();
    } catch (err) { toast.error("Thất bại."); }
  };

  const handleBatchResolveReports = async (ids: string[], action: string) => {
    try {
      setTabLoading(true);
      const msg = await adminService.batchResolveReports(ids, action);
      toast.success(msg);
      fetchReports();
    } catch (err: any) {
      toast.error(err.message || "Lỗi xử lý hàng loạt.");
    } finally {
      setTabLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Xác nhận xóa đánh giá?")) return;
    try {
      await adminService.deleteReview(reviewId);
      toast.success("Đã xóa.");
      fetchReviews();
    } catch (err) { toast.error("Thất bại."); }
  };

  const handleAddReason = async () => {
    if (!newReasonName.trim()) { toast.error("Nhập tên lý do"); return; }
    try {
      setTabLoading(true);
      await adminService.saveViolationReason({ name: newReasonName.trim(), active: true });
      setNewReasonName("");
      toast.success("Đã thêm!");
      fetchReasons(); 
    } catch (err) { toast.error("Lỗi thêm."); } 
    finally { setTabLoading(false); }
  };

  const handleDeleteReason = async (id: string) => {
    if (!window.confirm("Xóa danh mục?")) return;
    try {
      await adminService.deleteViolationReason(id);
      toast.success("Đã xóa");
      fetchReasons();
    } catch (err) { toast.error("Thất bại"); }
  };

  return (
    <div className="admin-dashboard-wrapper">
      <header className="admin-page-header">
        <div className="header-left">
          <h1><FaShieldAlt style={{ marginRight: '10px' }} /> Kiểm duyệt & Vi phạm</h1>
          <p style={{ color: '#64748b', marginTop: '10px', fontWeight: 500, fontSize: '14.5px' }}>
            Xử lý các báo cáo vi phạm, quản lý đánh giá và thiết lập danh mục cảnh báo.
          </p>
        </div>
      </header>

      <nav className="content-tabs">
        <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => handleTabChange('reports')}>
          <FaFlag size={14} style={{ marginRight: '6px' }} /> Báo cáo vi phạm
        </button>
        <button className={activeTab === 'reviews' ? 'active' : ''} onClick={() => handleTabChange('reviews')}>
          <FaStar size={14} style={{ marginRight: '6px' }} /> Quản lý đánh giá
        </button>
        <button className={activeTab === 'reasons' ? 'active' : ''} onClick={() => handleTabChange('reasons')}>
          <FaTags size={14} style={{ marginRight: '6px' }} /> Danh mục báo cáo
        </button>
      </nav>

      <section className="dynamic-view-area" style={{ marginTop: '20px' }}>
        {tabLoading ? <div className="tab-loading-spinner">Đang tải dữ liệu...</div> : (
          <div style={{ opacity: tabLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
            {activeTab === 'reports' && (
              <ReportTable 
                reports={reports} 
                handleResolveReport={handleResolveReport} 
                handleDeleteReport={handleDeleteReport}
                onBatchResolve={handleBatchResolveReports}
                currentPage={reportPage}
                pageSize={reportPageSize}
                onPageChange={setReportPage}
                onPageSizeChange={(newSize) => { setReportPageSize(newSize); setReportPage(0); }}
              />
            )}
            {activeTab === 'reviews' && (
              <ReviewTable 
                allReviews={allReviews} 
                handleDeleteReview={handleDeleteReview} 
                currentPage={reviewPage}
                pageSize={reviewPageSize}
                onPageChange={setReviewPage}
                onPageSizeChange={(newSize) => { setReviewPageSize(newSize); setReviewPage(0); }}
              />
            )}
            {activeTab === 'reasons' && (
              <ReasonManagement 
                reasons={reasons} 
                newReasonName={newReasonName} 
                setNewReasonName={setNewReasonName} 
                handleAddReason={handleAddReason} 
                handleDeleteReason={handleDeleteReason} 
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminModeration;
