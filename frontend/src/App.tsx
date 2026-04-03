import { useState, useEffect } from 'react';
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

// --- ADMIN COMPONENTS ---
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminChat from './pages/Admin/AdminChat'; 
import ShippingManagement from './pages/Admin/ShippingManagement'; 
import SystemContentManagement from './pages/Admin/SystemContentManagement';
import FooterMenuManagement from './pages/Admin/FooterMenuManagement';
import HelpHierarchyManagement from './pages/Admin/HelpHierarchyManagement';

// 🚀 NEW IMPORTS
import AdminUsers from './pages/Admin/AdminUsers';
import SellerModeration from './pages/Admin/SellerModeration';
import ProductModeration from './pages/Admin/ProductModeration';
import AdminAuditLogs from './pages/Admin/AdminAuditLogs';
import AdminReports from './pages/Admin/AdminReports';
import AdminReviews from './pages/Admin/AdminReviews';
import AdminReportCategories from './pages/Admin/AdminReportCategories'; // 🟢 ADDED THIS

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

  if (appLoading) return <LoadingOverlay />;

  return (
    <Router>
      <NotificationProvider>
        <ChatProvider>
          <div className="app-wrapper">
            <TitleManager />
            <Header />
            
            <main className="content">
              <Routes>
                {/* --- PUBLIC ROUTES --- */}
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

                {/* --- PROTECTED USER ROUTES --- */}
                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="/user/notifications" element={<ProtectedRoute><NotificationPage /></ProtectedRoute>} />
                <Route path="/user/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/user/password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} /> 
                <Route path="/user/bank" element={<ProtectedRoute><Bank /></ProtectedRoute>} /> 
                <Route path="/user/address" element={<ProtectedRoute><Address /></ProtectedRoute>} />
                <Route path="/user/purchase" element={<ProtectedRoute><Purchase /></ProtectedRoute>} />
                <Route path="/seller/register" element={<ProtectedRoute><SellerRegister /></ProtectedRoute>} />
                
                {/* --- PROTECTED SELLER ROUTES --- */}
                <Route path="/seller/dashboard" element={<ProtectedRoute allowedRoles={['SELLER']}><SellerDashboard /></ProtectedRoute>} />
                <Route path="/seller/products" element={<ProtectedRoute allowedRoles={['SELLER']}><MyProducts /></ProtectedRoute>} />
                <Route path="/seller/add-product" element={<ProtectedRoute allowedRoles={['SELLER']}><AddProduct /></ProtectedRoute>} />
                <Route path="/seller/edit-product/:id" element={<ProtectedRoute allowedRoles={['SELLER']}><EditProduct /></ProtectedRoute>} />
                <Route path="/seller/orders" element={<ProtectedRoute allowedRoles={['SELLER']}><SellerOrders /></ProtectedRoute>} />
                <Route path="/seller/settings" element={<ProtectedRoute allowedRoles={['SELLER']}><SellerSettings /></ProtectedRoute>} />

                {/* --- 🚀 PROTECTED ADMIN ROUTES --- */}
                
                <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminUsers /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/sellers" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><SellerModeration /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/products" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><ProductModeration /></AdminLayout></ProtectedRoute>} />
                
                {/* Control & Reporting (FIXED ROUTES) */}
                <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminReports /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/reviews" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminReviews /></AdminLayout></ProtectedRoute>} />
                
                {/* 🟢 FIXED: Points to AdminReportCategories now */}
                <Route path="/admin/report-categories" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminReportCategories /></AdminLayout></ProtectedRoute>} />
                
                <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminAuditLogs /></AdminLayout></ProtectedRoute>} />

                {/* Content & Config */}
                <Route path="/admin/chat" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminChat /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/chat/:recipientId" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><AdminChat /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/shipping" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><ShippingManagement /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/footer-menus" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><FooterMenuManagement /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/help-hierarchy" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><HelpHierarchyManagement /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/articles" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><SystemContentManagement /></AdminLayout></ProtectedRoute>} />
                <Route path="/admin/content/:category" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout><SystemContentManagement /></AdminLayout></ProtectedRoute>} />

                {/* FALLBACKS */}
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