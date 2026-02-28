import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TitleManager = () => {
  const location = useLocation();

  useEffect(() => {
    const titleMap: { [key: string]: string } = {
      '/': 'AiNetsoft - Kết nối công nghệ',
      '/login': 'Đăng Nhập | AiNetsoft',
      '/register': 'Đăng Ký Tài Khoản | AiNetsoft',
      '/forgot-password': 'Khôi Phục Mật Khẩu | AiNetsoft',
      '/my-shop': 'Gian Hàng Của Tôi | AiNetsoft',
      '/chat': 'Trò Chuyện | AiNetsoft',
      '/regulations': 'Quy Định & Chính Sách | AiNetsoft', 
      '/contact': 'Liên Hệ | AiNetsoft',              
    };

    // Use the map or a default title if the route isn't listed
    const currentTitle = titleMap[location.pathname] || 'AiNetsoft';
    document.title = currentTitle;
  }, [location]);

  return null; // This component doesn't render anything UI-wise
};

export default TitleManager;