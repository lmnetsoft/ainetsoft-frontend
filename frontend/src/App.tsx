import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import Register from './pages/Register/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Login from './pages/Auth/Login';
import OAuth2RedirectHandler from './pages/Auth/OAuth2RedirectHandler';
import NotFound from './pages/NotFound/NotFound'; 
import ChatBubble from './components/ChatBubble/ChatBubble';
import TitleManager from './components/TitleManager'; 
import ContentPage from './pages/Content/ContentPage';

// Context Providers
import { ChatProvider, useChat } from './context/ChatContext'; 
import { NotificationProvider } from './context/NotificationContext';

// Services & Global Components
import { getUserProfile } from './services/authService';
import LoadingOverlay from './components/LoadingOverlay/LoadingOverlay';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'; 

// Layout for persistent Sidebar
import AdminLayout from './components/Admin/AdminLayout'; 

// User Account Components
import Profile from './pages/User/Profile';
import ChangePassword from './pages/User/ChangePassword';
import Bank from './pages/User/Bank';
import Address from './pages/User/Address';
import Purchase from './pages/User/Purchase';
import SellerRegister from './pages/User/SellerRegister';
import NotificationPage from './pages/User/NotificationPage';

// Shop Components
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';
import ProductDetail from './pages/Product/ProductDetail';
import PublicShop from './pages/Shop/PublicShop';
import ChatPage from './pages/Chat/ChatPage'; 

// Seller Components
import SellerDashboard from './pages/Seller/SellerDashboard';
import AddProduct from './pages/Seller/AddProduct';
import EditProduct from './pages/Seller/EditProduct';
import MyProducts from './pages/Seller/MyProducts';
import SellerOrders from './pages/Seller/SellerOrders';
import SellerSettings from './pages/Seller/SellerSettings';
import Withdrawal from './pages/Seller/Withdrawal'; 

// Admin Components
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminChat from './pages/Admin/AdminChat'; 
import ShippingManagement from './pages/Admin/ShippingManagement'; 
import SystemContentManagement from './pages/Admin/SystemContentManagement';
import FooterMenuManagement from './pages/Admin/FooterMenuManagement';
import HelpHierarchyManagement from './pages/Admin/HelpHierarchyManagement';
import AdminWithdrawals from './pages/Admin/AdminWithdrawals'; // 🚀 NEW: Import for Admin Management

// 🚀 MIGRATED ADMIN PAGES
import AdminUsers from './pages/Admin/AdminUsers'; 
import SellerModeration from './pages/Admin/SellerModeration'; 
import ProductModeration from './pages/Admin/ProductModeration';
import AdminAuditLogs from './pages/Admin/AdminAuditLogs';

import './App.css';

/**
 * INTERNAL COMPONENT: GlobalChatOverlay
 */
const GlobalChatOverlay = () => {
  const { isChatOpen } = useChat();
  return isChatOpen ? <ChatPage /> : null;
};

function App() {
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      const token = localStorage.getItem('jwt_token');
      
      if (token) {
        try {
          await getUserProfile();
        } catch (err) {
          console.warn("Session invalid or expired. Reverting to guest mode.");
          localStorage.clear();
          window.dispatchEvent(new Event('profileUpdate'));
        }
      } else {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRoles');
      }
      
      setAppLoading(false);
    };

    initApp();
  }, []);

  if (appLoading) {
    return <LoadingOverlay />;
  }

  return (
    <Router>
      <NotificationProvider>
        <ChatProvider>
          <div className="app-wrapper">
            <TitleManager />
            <Header />
            
            <main className="content">
              <Routes>
                {/* --- 1. PUBLIC ROUTES --- */}
                <Route path="/" element={<Home />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                
                <Route path="/tro-giup/:slug?" element={<ContentPage />} />
                <Route path="/regulations" element={<ContentPage type="regulations" />} />
                <Route path="/contact" element={<ContentPage type="contact" />} />
                <Route path="/legal/:slug" element={<ContentPage />} />
                
                <Route path="/shop/:identifier" element={<PublicShop />} />
                <Route path="/my-shop" element={<PublicShop />} />

                {/* --- 2. PROTECTED ROUTES WITHOUT SIDEBAR --- */}
                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />

                {/* 🚀 3. THE PERSISTENT LAYOUT ZONE 🚀 */}
                <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>

                  {/* --- User Account Routes --- */}
                  <Route path="/user/notifications" element={<NotificationPage />} />
                  <Route path="/user/profile" element={<Profile />} />
                  <Route path="/user/password" element={<ChangePassword />} />
                  <Route path="/user/bank" element={<Bank />} />
                  <Route path="/user/address" element={<Address />} />
                  <Route path="/user/purchase" element={<Purchase />} />
                  <Route path="/seller/register" element={<SellerRegister />} />

                  {/* --- Seller Routes --- */}
                  <Route path="/seller/dashboard" element={<ProtectedRoute allowedRoles={['SELLER']}><SellerDashboard /></ProtectedRoute>} />
                  <Route path="/seller/products" element={<ProtectedRoute allowedRoles={['SELLER']}><MyProducts /></ProtectedRoute>} />
                  <Route path="/seller/add-product" element={<ProtectedRoute allowedRoles={['SELLER']}><AddProduct /></ProtectedRoute>} />
                  <Route path="/seller/add" element={<ProtectedRoute allowedRoles={['SELLER']}><AddProduct /></ProtectedRoute>} />
                  <Route path="/seller/edit-product/:id" element={<ProtectedRoute allowedRoles={['SELLER']}><EditProduct /></ProtectedRoute>} />
                  <Route path="/seller/edit/:id" element={<ProtectedRoute allowedRoles={['SELLER']}><EditProduct /></ProtectedRoute>} />
                  <Route path="/seller/orders" element={<ProtectedRoute allowedRoles={['SELLER']}><SellerOrders /></ProtectedRoute>} />
                  <Route path="/seller/settings" element={<ProtectedRoute allowedRoles={['SELLER']}><SellerSettings /></ProtectedRoute>} />
                  <Route path="/seller/withdrawal" element={<ProtectedRoute allowedRoles={['SELLER']}><Withdrawal /></ProtectedRoute>} />

                  {/* --- Admin Routes --- */}
                  <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminUsers /></ProtectedRoute>} />
                  <Route path="/admin/seller-moderation" element={<ProtectedRoute allowedRoles={['ADMIN']}><SellerModeration /></ProtectedRoute>} />
                  <Route path="/admin/product-moderation" element={<ProtectedRoute allowedRoles={['ADMIN']}><ProductModeration /></ProtectedRoute>} />
                  <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminAuditLogs /></ProtectedRoute>} />
                  
                  {/* 🚀 NEW: Admin Withdrawal Management Route */}
                  <Route path="/admin/withdrawals" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminWithdrawals /></ProtectedRoute>} />

                  <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['ADMIN']}><div className="admin-dashboard-wrapper"><h2>Trang Báo cáo vi phạm</h2></div></ProtectedRoute>} />
                  <Route path="/admin/reviews" element={<ProtectedRoute allowedRoles={['ADMIN']}><div className="admin-dashboard-wrapper"><h2>Quản lý đánh giá</h2></div></ProtectedRoute>} />

                  <Route path="/admin/chat" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminChat /></ProtectedRoute>} />
                  <Route path="/admin/chat/:recipientId" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminChat /></ProtectedRoute>} />
                  <Route path="/admin/shipping" element={<ProtectedRoute allowedRoles={['ADMIN']}><ShippingManagement /></ProtectedRoute>} />
                  <Route path="/admin/footer-menus" element={<ProtectedRoute allowedRoles={['ADMIN']}><FooterMenuManagement /></ProtectedRoute>} />
                  <Route path="/admin/help-hierarchy" element={<ProtectedRoute allowedRoles={['ADMIN']}><HelpHierarchyManagement /></ProtectedRoute>} />
                  <Route path="/admin/articles" element={<ProtectedRoute allowedRoles={['ADMIN']}><SystemContentManagement /></ProtectedRoute>} />
                  <Route path="/admin/content/:category" element={<ProtectedRoute allowedRoles={['ADMIN']}><SystemContentManagement /></ProtectedRoute>} />
                  <Route path="/admin/content" element={<ProtectedRoute allowedRoles={['ADMIN']}><SystemContentManagement /></ProtectedRoute>} />
                </Route>

                {/* Root Catch for Shop Slugs */}
                <Route path="/:shopSlug" element={<PublicShop />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            
            <Footer />

            <GlobalChatOverlay />
            <ChatBubble />
          </div>
        </ChatProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;