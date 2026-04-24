package com.ainetsoft.service;

import com.azure.communication.email.*;
import com.azure.communication.email.models.*;
import com.azure.core.util.polling.SyncPoller;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Slf4j
@Service
public class AzureCommunicationService {

    @Value("${azure.communication.connection-string}")
    private String connectionString;

    @Value("${azure.communication.email-from-address}")
    private String fromAddress;

    /**
     * 1. Account Verification Email
     * Sends a secure link to activate new accounts.
     */
    public void sendVerificationEmail(String targetEmail, String fullName, String verificationLink) {
        String subject = "[AiNetSoft] Xác thực tài khoản của bạn";
        String body = "<html><body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>" +
                      "<div style='max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;'>" +
                      "<h2 style='color: #1890ff; text-align: center;'>Chào mừng bạn đến với AiNetSoft!</h2>" +
                      "<p>Xin chào <strong>" + (fullName != null ? fullName : "Thành viên") + "</strong>,</p>" +
                      "<p>Cảm ơn bạn đã đăng ký tài khoản. Để bắt đầu, vui lòng nhấn nút bên dưới để xác thực email của bạn:</p>" +
                      "<div style='text-align: center; margin: 30px 0;'>" +
                      "<a href='" + verificationLink + "' style='background-color: #1890ff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>" +
                      "KÍCH HOẠT TÀI KHOẢN" +
                      "</a>" +
                      "</div>" +
                      "<p style='font-size: 11px; color: #888;'>Liên kết này sẽ hết hạn sau 24 giờ. Nếu bạn không đăng ký, vui lòng bỏ qua email này.</p>" +
                      "<hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;'>" +
                      "<p style='font-size: 12px; color: #aaa; text-align: center;'>© 2026 AiNetSoft. Tất cả quyền được bảo lưu.</p>" +
                      "</div>" +
                      "</body></html>";

        sendEmail(targetEmail, subject, body);
    }

    /**
     * 2. OTP Logic for Password Recovery
     */
    public void sendResetEmail(String targetEmail, String otpCode) {
        String subject = "[AiNetSoft] Mã khôi phục mật khẩu của bạn";
        String body = "<html><body style='font-family: Arial, sans-serif;'>" +
                      "<h3>Chào bạn,</h3>" +
                      "<p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn.</p>" +
                      "<p>Mã OTP xác thực là: <span style='font-size: 20px; font-weight: bold; color: #ee4d2d;'>" + otpCode + "</span></p>" +
                      "<p>Mã này có hiệu lực trong 10 phút.</p>" +
                      "<br><p>Trân trọng,<br>Đội ngũ AiNetsoft</p>" +
                      "</body></html>";
        sendEmail(targetEmail, subject, body);
    }

    /**
     * 3. Seller Submission Confirmation
     */
    public void sendSellerSubmissionReceivedEmail(String targetEmail, String fullName) {
        String subject = "[AiNetSoft] Xác nhận đã nhận hồ sơ đăng ký Người bán";
        String body = "<html><body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>" +
                      "<h2 style='color: #2980b9;'>XÁC NHẬN TIẾP NHẬN HỒ SƠ</h2>" +
                      "<p>Xin chào <strong>" + fullName + "</strong>,</p>" +
                      "<p>Chúng tôi xác nhận đã nhận được yêu cầu đăng ký kinh doanh của bạn. Đội ngũ kiểm soát đang tiến hành thẩm định hồ sơ.</p>" +
                      "<p>Kết quả chính thức sẽ được phản hồi trong vòng <b>24 giờ làm việc</b>.</p>" +
                      "</body></html>";

        sendEmail(targetEmail, subject, body);
    }

    /**
     * 4. Seller Final Decision (Approve/Reject)
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
                        "<p>Hồ sơ của bạn đã được chấp thuận. Bạn có thể bắt đầu kinh doanh ngay bây giờ.</p>" : 
                        "<p>Rất tiếc hồ sơ của bạn chưa được phê duyệt. Lý do: <span style='color: #d63031;'>" + reason + "</span></p>") +
                      "</body></html>";

        sendEmail(targetEmail, subject, body);
    }

    /**
     * 5. Product Approval Notification
     */
    public void sendProductStatusEmail(String targetEmail, String fullName, String productName, boolean approved, String reason) {
        String subject = approved
            ? "[AiNetSoft] Sản phẩm của bạn đã được phê duyệt thành công"
            : "[AiNetSoft] Thông báo từ chối phê duyệt nội dung sản phẩm";

        String body = "<html><body style='font-family: Arial, sans-serif; line-height: 1.6;'>" +
                      "<h3>Xin chào " + fullName + ",</h3>" +
                      "<p>Thông báo về sản phẩm: <strong>" + productName + "</strong></p>" +
                      (approved ? "<p style='color: #2ecc71;'>Sản phẩm đã được duyệt thành công!</p>" : 
                                 "<p style='color: #e74c3c;'>Bị từ chối. Lý do: " + reason + "</p>") +
                      "</body></html>";

        sendEmail(targetEmail, subject, body);
    }

    /**
     * 6. 🛡️ Security Alert Email
     * Alerts user about account linking or security changes.
     */
    public void sendSecurityAlertEmail(String targetEmail, String alertType, String alertDetails) {
        String subject = "[AiNetSoft] Cảnh báo bảo mật: " + alertType;
        String body = "<html><body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>" +
                      "<div style='max-width: 600px; margin: auto; border: 1px solid #fadb14; padding: 20px; border-radius: 10px; background-color: #fffbe6;'>" +
                      "<h2 style='color: #d48806; text-align: center;'>Thông báo bảo mật</h2>" +
                      "<p>Xin chào,</p>" +
                      "<p>Chúng tôi nhận thấy có sự thay đổi quan trọng đối với tài khoản của bạn:</p>" +
                      "<blockquote style='background: #fff; padding: 15px; border-left: 5px solid #d48806;'>" +
                      "<strong>Loại thông báo:</strong> " + alertType + "<br>" +
                      "<strong>Chi tiết:</strong> " + alertDetails +
                      "</blockquote>" +
                      "<p>Nếu <b>không phải bạn</b> thực hiện thay đổi này, vui lòng truy cập hệ thống để đổi mật khẩu ngay lập tức hoặc liên hệ đội ngũ hỗ trợ.</p>" +
                      "<hr style='border: 0; border-top: 1px solid #ffe58f; margin: 20px 0;'>" +
                      "<p style='font-size: 12px; color: #888; text-align: center;'>Đây là email tự động. © 2026 AiNetSoft.</p>" +
                      "</div>" +
                      "</body></html>";

        sendEmail(targetEmail, subject, body);
    }

    /**
     * 7. 📧 OTP Logic for Email Change (NEW)
     */
    public void sendEmailChangeVerification(String targetEmail, String otpCode) {
        String subject = "[AiNetSoft] Xác thực địa chỉ Email mới";
        String body = "<html><body style='font-family: Arial, sans-serif;'>" +
                      "<h3>Chào bạn,</h3>" +
                      "<p>Chúng tôi nhận được yêu cầu cập nhật địa chỉ Email mới cho tài khoản của bạn.</p>" +
                      "<p>Mã OTP xác thực của bạn là: <span style='font-size: 20px; font-weight: bold; color: #1890ff;'>" + otpCode + "</span></p>" +
                      "<p>Mã này có hiệu lực trong 15 phút.</p>" +
                      "<p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ ngay với bộ phận hỗ trợ.</p>" +
                      "<br><p>Trân trọng,<br>Đội ngũ AiNetsoft</p>" +
                      "</body></html>";
        sendEmail(targetEmail, subject, body);
    }

    /**
     * --- PRIVATE CORE ENGINE ---
     */
    private void sendEmail(String targetEmail, String subject, String htmlContent) {
        try {
            EmailClient emailClient = new EmailClientBuilder()
                .connectionString(connectionString)
                .buildClient();

            EmailMessage emailMessage = new EmailMessage()
                .setSenderAddress(fromAddress)
                .setToRecipients(new EmailAddress(targetEmail))
                .setSubject(subject)
                .setBodyHtml(htmlContent);

            log.info("Attempting to send email to: {}", targetEmail);

            SyncPoller<EmailSendResult, EmailSendResult> poller = emailClient.beginSend(emailMessage, null);
            poller.waitForCompletion(Duration.ofSeconds(10));

            EmailSendResult result = poller.getFinalResult();
            log.info("Azure Email Success. MessageID: {}", result.getId());

        } catch (Exception e) {
            log.error("Azure SDK Error sending to {}: {}", targetEmail, e.getMessage());
            throw new RuntimeException("EMAIL_SERVICE_ERROR: " + e.getMessage());
        }
    }
}