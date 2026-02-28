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

// User Account Components
import Profile from './pages/User/Profile';
import ChangePassword from './pages/User/ChangePassword'; // Added this import

import './App.css';

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        {/* Automatically handles tab titles for every route */}
        <TitleManager />
        
        <Header />
        
        <main className="content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* User Account Routes (Tài khoản của tôi) */}
            <Route path="/user/profile" element={<Profile />} />
            <Route path="/user/password" element={<ChangePassword />} /> {/* Updated from Profile to ChangePassword */}
            
            {/* Remaining Placeholder routes */}
            <Route path="/user/bank" element={<Profile />} /> 
            <Route path="/user/address" element={<Profile />} />
            <Route path="/user/purchase" element={<Profile />} />

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