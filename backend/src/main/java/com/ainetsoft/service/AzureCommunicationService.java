package com.ainetsoft.service;

import com.azure.communication.email.*;
import com.azure.communication.email.models.*;
import com.azure.core.util.polling.SyncPoller;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AzureCommunicationService {

    @Value("${azure.communication.connection-string}")
    private String connectionString;

    @Value("${azure.communication.email-from-address}")
    private String fromEmail;

    /**
     * Preserved OTP logic for password recovery.
     */
    public void sendResetEmail(String targetEmail, String otpCode) {
        String subject = "[AiNetSoft] Mã khôi phục mật khẩu của bạn";
        String body = "<html><body style='font-family: Arial, sans-serif;'>" +
                      "<h3>Chào bạn,</h3>" +
                      "<p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn.</p>" +
                      "<p>Mã OTP xác thực là: <span style='font-size: 20px; font-weight: bold; color: #ee4d2d;'>" + otpCode + "</span></p>" +
                      "<p>Mã này có hiệu lực trong 10 phút. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>" +
                      "<br><p>Trân trọng,<br>Đội ngũ AiNetsoft</p>" +
                      "</body></html>";
        sendEmail(targetEmail, subject, body);
    }

    /**
     * 🛠️ UPDATED: Professional Seller Approval/Rejection with dynamic subjects.
     */
    public void sendSellerStatusEmail(String targetEmail, String fullName, boolean approved, String reason) {
        String subject = approved 
            ? "[AiNetSoft] Chúc mừng! Hồ sơ Người bán của bạn đã được phê duyệt"
            : "[AiNetSoft] Thông báo về kết quả thẩm định hồ sơ Người bán";

        String statusHeader = approved 
            ? "<h2 style='color: #2ecc71;'>CHÚC MỪNG! HỒ SƠ ĐÃ ĐƯỢC PHÊ DUYỆT</h2>" 
            : "<h2 style='color: #e74c3c;'>THÔNG BÁO KẾT QUẢ THẨM ĐỊNH HỒ SƠ</h2>";

        String body = "<html><body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>" +
                      statusHeader +
                      "<p>Xin chào <strong>" + fullName + "</strong>,</p>" +
                      (approved ? 
                        "<p>Chúng tôi rất vui mừng thông báo rằng yêu cầu đăng ký Người bán của bạn tại <b>AiNetSoft</b> đã được chấp thuận.</p>" +
                        "<p>Bây giờ bạn có thể truy cập Kênh Người Bán để đăng tải sản phẩm và bắt đầu kinh doanh ngay lập tức.</p>" : 
                        "<p>Cảm ơn bạn đã quan tâm đến việc kinh doanh trên hệ thống AiNetSoft.</p>" +
                        "<p>Sau khi xem xét kỹ lưỡng hồ sơ của bạn, rất tiếc chúng tôi chưa thể phê duyệt yêu cầu này vào lúc này.</p>" +
                        "<p><strong>Lý do từ chối:</strong> <span style='color: #d63031;'>" + reason + "</span></p>" +
                        "<p>Vui lòng điều chỉnh thông tin theo yêu cầu và gửi lại hồ sơ để chúng tôi thẩm định lại.</p>") +
                      "<hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;'>" +
                      "<p style='font-size: 13px; color: #888;'>Đây là email tự động từ hệ thống AiNetSoft. Vui lòng không phản hồi email này.</p>" +
                      "</body></html>";

        sendEmail(targetEmail, subject, body);
    }

    /**
     * 🛠️ UPDATED: Professional Product Approval with dynamic subjects.
     */
    public void sendProductStatusEmail(String targetEmail, String fullName, String productName, boolean approved, String reason) {
        String subject = approved
            ? "[AiNetSoft] Sản phẩm của bạn đã được phê duyệt và niêm yết thành công"
            : "[AiNetSoft] Thông báo từ chối phê duyệt nội dung sản phẩm";

        String body = "<html><body style='font-family: Arial, sans-serif; line-height: 1.6;'>" +
                      "<h3>Xin chào " + fullName + ",</h3>" +
                      "<p>Thông báo về trạng thái sản phẩm: <strong>" + productName + "</strong></p>" +
                      (approved ? 
                        "<p style='color: #2ecc71; font-weight: bold;'>Sản phẩm đã được duyệt thành công!</p>" +
                        "<p>Nội dung của bạn hiện đã hiển thị công khai và sẵn sàng để khách hàng đặt mua.</p>" : 
                        "<p style='color: #e74c3c; font-weight: bold;'>Yêu cầu niêm yết sản phẩm bị từ chối.</p>" +
                        "<p><strong>Lý do:</strong> <i>" + reason + "</i></p>" +
                        "<p>Vui lòng chỉnh sửa nội dung sản phẩm tuân thủ quy định của sàn và gửi duyệt lại.</p>") +
                      "<br><p>Trân trọng,<br>Ban quản trị AiNetsoft</p>" +
                      "</body></html>";

        sendEmail(targetEmail, subject, body);
    }

    // --- PRIVATE CORE ENGINE (PRESERVED) ---
    private void sendEmail(String targetEmail, String subject, String htmlContent) {
        try {
            EmailClient emailClient = new EmailClientBuilder()
                .connectionString(connectionString)
                .buildClient();

            EmailMessage emailMessage = new EmailMessage()
                .setSenderAddress(fromEmail)
                .setToRecipients(new EmailAddress(targetEmail))
                .setSubject(subject)
                .setBodyHtml(htmlContent);

            SyncPoller<EmailSendResult, EmailSendResult> poller = emailClient.beginSend(emailMessage, null);
            poller.waitForCompletion();
            System.out.println("Azure Email Sent: " + poller.getFinalResult().getId());
        } catch (Exception e) {
            System.err.println("Azure SDK Error: " + e.getMessage());
            throw new RuntimeException("Lỗi gửi email: " + e.getMessage());
        }
    }
}