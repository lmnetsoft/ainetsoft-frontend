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

// Services & Global Components
import { getUserProfile } from './services/authService';
import LoadingOverlay from './components/LoadingOverlay/LoadingOverlay';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'; 

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
import PublicShop from './pages/Shop/PublicShop'; // NEW: Public Storefront component

// Seller Components
import SellerDashboard from './pages/Seller/SellerDashboard';
import AddProduct from './pages/Seller/AddProduct';
import EditProduct from './pages/Seller/EditProduct';
import MyProducts from './pages/Seller/MyProducts';
import SellerOrders from './pages/Seller/SellerOrders';
import SellerSettings from './pages/Seller/SellerSettings';

// Admin Components
import AdminDashboard from './pages/admin/AdminDashboard';

import './App.css';

function App() {
  const [appLoading, setAppLoading] = useState(true);

  /**
   * INITIALIZATION: 
   * Checks for a stored JWT token. If found, it validates the identity 
   * with the backend to sync LocalStorage (Name, Avatar, Roles).
   */
  useEffect(() => {
    const initApp = async () => {
      const token = localStorage.getItem('jwt_token');
      
      if (token) {
        try {
          // Sync profile only if a token exists
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
            <Route path="/regulations" element={<ContentPage type="regulations" />} />
            <Route path="/contact" element={<ContentPage type="contact" />} />
            
            {/* NEW: Public Storefront Routes */}
            <Route path="/shop/:id" element={<PublicShop />} />
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
            <Route 
              path="/seller/dashboard" 
              element={<ProtectedRoute allowedRoles={['SELLER']}><SellerDashboard /></ProtectedRoute>} 
            />
            <Route 
              path="/seller/products" 
              element={<ProtectedRoute allowedRoles={['SELLER']}><MyProducts /></ProtectedRoute>} 
            />
            <Route 
              path="/seller/add-product" 
              element={<ProtectedRoute allowedRoles={['SELLER']}><AddProduct /></ProtectedRoute>} 
            />
            <Route 
              path="/seller/edit-product/:id" 
              element={<ProtectedRoute allowedRoles={['SELLER']}><EditProduct /></ProtectedRoute>} 
            />
            <Route 
              path="/seller/orders" 
              element={<ProtectedRoute allowedRoles={['SELLER']}><SellerOrders /></ProtectedRoute>} 
            />
            <Route 
              path="/seller/settings" 
              element={<ProtectedRoute allowedRoles={['SELLER']}><SellerSettings /></ProtectedRoute>} 
            />

            {/* --- PROTECTED ADMIN ROUTES --- */}
            <Route 
              path="/admin/dashboard" 
              element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} 
            />

            {/* Catch-all route for 404 (MUST BE LAST) */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        
        <footer />
        <ChatBubble />
      </div>
    </Router>
  );
}

export default App;