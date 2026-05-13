import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import Register from './pages/Register/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Login from './pages/Auth/Login';
import VerifyEmail from './pages/Auth/VerifyEmail'; 
import OAuth2RedirectHandler from './pages/Auth/OAuth2RedirectHandler';
import NotFound from './pages/NotFound/NotFound'; 
import ChatBubble from './components/ChatBubble/ChatBubble';
import TitleManager from './components/TitleManager'; 
import ContentPage from './pages/Content/ContentPage';
import SellerShippingSettings from './pages/Seller/SellerShippingSettings';
import OrderDetail from './pages/User/OrderDetail';

// Context Providers
import { ChatProvider, useChat } from './context/ChatContext'; 
import { NotificationProvider } from './context/NotificationContext';

// Services & Global Components
import { getUserProfile } from './services/authService';
import LoadingOverlay from './components/LoadingOverlay/LoadingOverlay';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'; 
import FinancialSecurityGate from './components/ProtectedRoute/FinancialSecurityGate';

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

// WALLET PAGES
import WalletPage from './pages/User/WalletPage';
import VoucherWallet from './pages/User/VoucherWallet';
import CoinWallet from './pages/User/CoinWallet';

// Shop Components
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';
import MockPaymentGateway from './pages/Checkout/MockPaymentGateway'; // 🚀 ĐÃ THÊM IMPORT CỔNG THANH TOÁN
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
import SellerVouchers from './pages/Seller/SellerVouchers'; 

// Admin Components
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminChat from './pages/Admin/AdminChat'; 
import ShippingManagement from './pages/Admin/ShippingManagement'; 
import SystemContentManagement from './pages/Admin/SystemContentManagement';
import FooterMenuManagement from './pages/Admin/FooterMenuManagement';
import HelpHierarchyManagement from './pages/Admin/HelpHierarchyManagement';
import AdminWithdrawals from './pages/Admin/AdminWithdrawals'; 
import AdminOrders from './pages/Admin/AdminOrders'; 

// MIGRATED ADMIN PAGES
import AdminUsers from './pages/Admin/AdminUsers'; 
import AdminStoreManager from './pages/Admin/AdminStoreManager'; 
import AdminModeration from './pages/Admin/AdminModeration'; 
import SellerModeration from './pages/Admin/SellerModeration'; 
import ProductModeration from './pages/Admin/ProductModeration';
import AdminAuditLogs from './pages/Admin/AdminAuditLogs';
import AdminVouchers from './pages/Admin/AdminVouchers'; 
import AdminCoins from './pages/Admin/AdminCoins';

import './App.css';

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
                <Route path="/" element={<Home />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
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

                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                
                {/* 🚀 ĐÃ THÊM ROUTE CỔNG THANH TOÁN GIẢ LẬP VÀO ĐÂY */}
                <Route path="/payment/sandbox" element={<MockPaymentGateway />} />

                <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                  <Route path="/user/notifications" element={<NotificationPage />} />
                  <Route path="/user/profile" element={<Profile />} />
                  <Route path="/user/password" element={<ChangePassword />} />
                  <Route path="/user/bank" element={<FinancialSecurityGate><Bank /></FinancialSecurityGate>} />
                  <Route path="/user/address" element={<Address />} />
                  <Route path="/user/purchase" element={<Purchase />} />
                  <Route path="/seller/register" element={<SellerRegister />} />
                  
                  {/* WALLET ROUTES */}
                  <Route path="/user/wallet" element={<FinancialSecurityGate><WalletPage /></FinancialSecurityGate>} />
                  <Route path="/user/vouchers" element={<VoucherWallet />} />
                  <Route path="/user/coins" element={<CoinWallet />} />

                  <Route path="/seller/dashboard" element={<ProtectedRoute allowedRoles={['SELLER']}><SellerDashboard /></ProtectedRoute>} />
                  <Route path="/seller/products" element={<ProtectedRoute allowedRoles={['SELLER']}><MyProducts /></ProtectedRoute>} />
                  <Route path="/seller/add-product" element={<ProtectedRoute allowedRoles={['SELLER']}><AddProduct /></ProtectedRoute>} />
                  <Route path="/seller/add" element={<ProtectedRoute allowedRoles={['SELLER']}><AddProduct /></ProtectedRoute>} />
                  <Route path="/seller/edit-product/:id" element={<ProtectedRoute allowedRoles={['SELLER']}><EditProduct /></ProtectedRoute>} />
                  <Route path="/seller/edit/:id" element={<ProtectedRoute allowedRoles={['SELLER']}><EditProduct /></ProtectedRoute>} />
                  <Route path="/seller/orders" element={<ProtectedRoute allowedRoles={['SELLER']}><SellerOrders /></ProtectedRoute>} />
                  <Route path="/seller/settings" element={<ProtectedRoute allowedRoles={['SELLER']}><SellerSettings /></ProtectedRoute>} />
                  <Route path="/seller/vouchers" element={<ProtectedRoute allowedRoles={['SELLER']}><SellerVouchers /></ProtectedRoute>} />
                  <Route path="/seller/withdrawal" element={<ProtectedRoute allowedRoles={['SELLER']}><FinancialSecurityGate><Withdrawal /></FinancialSecurityGate></ProtectedRoute>} />
                  <Route path="/seller/balance" element={<ProtectedRoute allowedRoles={['SELLER']}><FinancialSecurityGate><Withdrawal /></FinancialSecurityGate></ProtectedRoute>} />
                  <Route path="/seller/revenue" element={<ProtectedRoute allowedRoles={['SELLER']}><SellerDashboard /></ProtectedRoute>} />

                  {/* --- Admin Routes --- */}
                  <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminOrders /></ProtectedRoute>} />
                  <Route path="/admin/orders/:id" element={<ProtectedRoute allowedRoles={['ADMIN']}><OrderDetail /></ProtectedRoute>} />
                  <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminUsers /></ProtectedRoute>} />
                  <Route path="/admin/stores" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminStoreManager /></ProtectedRoute>} />
                  <Route path="/admin/moderation" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminModeration /></ProtectedRoute>} />
                  
                  {/* ADMIN MARKETING & FINANCE ROUTES */}
                  <Route path="/admin/vouchers" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminVouchers /></ProtectedRoute>} />
                  <Route path="/admin/coins" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminCoins /></ProtectedRoute>} />

                  {/* Specific Admin Standalone Pages */}
                  <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminAuditLogs /></ProtectedRoute>} />
                  <Route path="/admin/withdrawals" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminWithdrawals /></ProtectedRoute>} />
                  <Route path="/admin/chat" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminChat /></ProtectedRoute>} />
                  <Route path="/admin/chat/:recipientId" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminChat /></ProtectedRoute>} />
                  <Route path="/admin/shipping" element={<ProtectedRoute allowedRoles={['ADMIN']}><ShippingManagement /></ProtectedRoute>} />
                  <Route path="/admin/footer-menus" element={<ProtectedRoute allowedRoles={['ADMIN']}><FooterMenuManagement /></ProtectedRoute>} />
                  <Route path="/admin/help-hierarchy" element={<ProtectedRoute allowedRoles={['ADMIN']}><HelpHierarchyManagement /></ProtectedRoute>} />
                  
                  <Route path="/admin/articles" element={<ProtectedRoute allowedRoles={['ADMIN']}><SystemContentManagement /></ProtectedRoute>} />
                  <Route path="/admin/content/:category" element={<ProtectedRoute allowedRoles={['ADMIN']}><SystemContentManagement /></ProtectedRoute>} />
                  <Route path="/admin/content" element={<ProtectedRoute allowedRoles={['ADMIN']}><SystemContentManagement /></ProtectedRoute>} />
                  <Route path="/seller/settings/shipping" element={<SellerShippingSettings />} />
                  <Route path="/user/order/:id" element={<OrderDetail />} />
                  
                  {/* --- Seller Chat Routes --- */}
                  <Route path="/seller/chat" element={<ProtectedRoute allowedRoles={['SELLER']}><AdminChat /></ProtectedRoute>} />
                  <Route path="/seller/chat/:recipientId" element={<ProtectedRoute allowedRoles={['SELLER']}><AdminChat /></ProtectedRoute>} />
                </Route>

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
