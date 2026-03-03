import { useState, useEffect } from 'react'; // Added hooks
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
import { getUserProfile } from './services/authService'; // To check session on startup
import LoadingOverlay from './components/LoadingOverlay/LoadingOverlay'; // NEW: Global loader
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'; 

// User Account Components
import Profile from './pages/User/Profile';
import ChangePassword from './pages/User/ChangePassword';
import Bank from './pages/User/Bank';
import Address from './pages/User/Address';
import Purchase from './pages/User/Purchase';
import SellerRegister from './pages/User/SellerRegister';

// Shop Components
import Cart from './pages/Cart/Cart';

import './App.css';

function App() {
  const [appLoading, setAppLoading] = useState(true);

  /**
   * INITIALIZATION: Checks if a session (Cookie) exists on the backend
   * before allowing the app to render. This syncs LocalStorage immediately.
   */
  useEffect(() => {
    const initApp = async () => {
      try {
        // This will sync localStorage if a JSESSIONID cookie exists
        await getUserProfile();
      } catch (err) {
        console.log("No active session found on startup.");
      } finally {
        // Hide the loading screen regardless of login status
        setAppLoading(false);
      }
    };

    initApp();
  }, []);

  // Show the overlay while checking the session
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
            <Route path="/regulations" element={<ContentPage type="regulations" />} />
            <Route path="/contact" element={<ContentPage type="contact" />} />

            {/* --- PROTECTED USER ROUTES --- */}
            <Route path="/user/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
            <Route path="/user/password" element={
              <ProtectedRoute><ChangePassword /></ProtectedRoute>
            } /> 
            <Route path="/user/bank" element={
              <ProtectedRoute><Bank /></ProtectedRoute>
            } /> 
            <Route path="/user/address" element={
              <ProtectedRoute><Address /></ProtectedRoute>
            } />
            <Route path="/user/purchase" element={
              <ProtectedRoute><Purchase /></ProtectedRoute>
            } />

            {/* --- PROTECTED SELLER ROUTES --- */}
            <Route path="/seller/register" element={
              <ProtectedRoute><SellerRegister /></ProtectedRoute>
            } />

            {/* Catch-all route for 404 (MUST BE LAST) */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        
        <Footer />
        <ChatBubble />
      </div>
    </Router>
  );
}

export default App;