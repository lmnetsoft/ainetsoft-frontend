import React from 'react';
import LegalPage from './LegalPage';

const TermsOfUse = () => {
  return (
    <LegalPage title="Điều Khoản Sử Dụng">
      <section>
        <h3>1. Nghĩa vụ của Người bán</h3>
        <p>Khi đăng ký nâng cấp Shop, bạn cam kết cung cấp thông tin chính xác 100%. Mọi hành vi gian lận thông tin định danh sẽ bị khóa tài khoản vĩnh viễn.</p>
      </section>

      <section>
        <h3>2. Quy định về Email và Liên lạc</h3>
        <p>Hệ thống tự động gửi thông báo qua Email. Nếu người dùng sử dụng <strong>Email ảo hoặc không tồn tại</strong>, hồ sơ sẽ bị hệ thống tự động đánh dấu "Vi phạm" và yêu cầu thực hiện lại từ đầu.</p>
      </section>

      <section>
        <h3>3. Quản lý kho hàng và GPS</h3>
        <p>Tọa độ GPS cung cấp trong hồ sơ phải trùng khớp với địa chỉ thực tế để Shipper có thể đối soát qua QR Code dẫn đường.</p>
      </section>

      <section>
        <h3>4. Điều khoản chấm dứt</h3>
        <p>AiNetsoft có quyền từ chối hoặc thu hồi quyền Người bán nếu phát hiện thông tin đăng ký không còn tính xác thực trong quá trình vận hành.</p>
      </section>
    </LegalPage>
  );
};

export default TermsOfUse;