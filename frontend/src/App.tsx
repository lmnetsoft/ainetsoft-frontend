import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import Register from './pages/Register/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Login from './pages/Auth/Login';
import ChatBubble from './components/ChatBubble/ChatBubble';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <Header />
        
        <main className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Routes>
        </main>
        
        <Footer />

        {/* Floating Bubble integrated globally with new offset */}
        <ChatBubble />
      </div>
    </Router>
  );
}

export default App;