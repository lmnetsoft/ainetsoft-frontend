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
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
            <Route path="/regulations" element={<ContentPage type="regulations" />} />
            <Route path="/contact" element={<ContentPage type="contact" />} />            
          </Routes>
        </main>
        
        <Footer />
        <ChatBubble />
      </div>
    </Router>
  );
}

export default App;