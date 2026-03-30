import React from 'react';
import LegalPage from './LegalPage';

const PrivacyPolicy = () => {
  return (
    <LegalPage title="Chính Sách Bảo Mật">
      <section>
        <h3>1. Thu thập dữ liệu cá nhân</h3>
        <p>Để đảm bảo an toàn giao dịch, AiNetsoft thu thập các thông tin bao gồm: Họ tên, <strong>Email xác thực</strong>, Số điện thoại và Địa chỉ kho hàng.</p>
      </section>

      <section>
        <h3>2. Mục đích sử dụng thông tin</h3>
        <p>Dữ liệu của bạn được sử dụng để định danh người bán, xử lý vận chuyển qua hệ thống GPS và gửi các thông báo quan trọng về đơn hàng.</p>
      </section>

      <section>
        <h3>3. Cam kết xác thực Email</h3>
        <p>Người dùng có nghĩa vụ cung cấp <strong>Email thật và đang hoạt động</strong>. AiNetsoft sử dụng Email này để khôi phục mật khẩu và gửi biên bản phê duyệt Shop. Chúng tôi không chịu trách nhiệm nếu thông tin bị thất lạc do Email không chính xác.</p>
      </section>

      <section>
        <h3>4. Bảo mật dữ liệu</h3>
        <p>Mọi thông tin định danh (CCCD/Passport) được mã hóa và chỉ sử dụng cho mục đích thẩm định hồ sơ Người bán.</p>
      </section>
    </LegalPage>
  );
};

export default PrivacyPolicy;