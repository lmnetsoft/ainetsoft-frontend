import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import Register from './pages/Register/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Login from './pages/Auth/Login';
import NotFound from './pages/NotFound/NotFound'; 
import ChatBubble from './components/ChatBubble/ChatBubble';
import TitleManager from './components/TitleManager'; 
import ContentPage from './pages/Content/ContentPage';

// User Account Components - Pointing directly to the files
import Profile from './pages/User/Profile';
import ChangePassword from './pages/User/ChangePassword';
import Bank from './pages/User/Bank';
import Address from './pages/User/Address';
import Purchase from './pages/User/Purchase';
import SellerRegister from './pages/User/SellerRegister'; // NEW: Import for Seller Enrollment

// Shop Components - Corrected to match your folder structure
import Cart from './pages/Cart/Cart';

import './App.css';

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <TitleManager />
        <Header />
        
        <main className="content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Shopping Routes */}
            <Route path="/cart" element={<Cart />} />
            
            {/* User Account Routes */}
            <Route path="/user/profile" element={<Profile />} />
            <Route path="/user/password" element={<ChangePassword />} /> 
            <Route path="/user/bank" element={<Bank />} /> 
            <Route path="/user/address" element={<Address />} />
            <Route path="/user/purchase" element={<Purchase />} />

            {/* Seller Enrollment Routes */}
            <Route path="/seller/register" element={<SellerRegister />} /> {/* NEW: Route added */}

            {/* Static Content Routes */}
            <Route path="/regulations" element={<ContentPage type="regulations" />} />
            <Route path="/contact" element={<ContentPage type="contact" />} />
            
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