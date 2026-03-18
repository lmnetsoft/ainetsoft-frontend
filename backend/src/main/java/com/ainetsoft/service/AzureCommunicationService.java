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

    public void sendResetEmail(String targetEmail, String otpCode) {
        String body = "<html><body>" +
                      "<h3>Chào bạn,</h3>" +
                      "<p>Mã OTP của bạn là: <span style='font-size: 20px; font-weight: bold; color: #ee4d2d;'>" + otpCode + "</span></p>" +
                      "<p>Mã này có hiệu lực trong 10 phút.</p>" +
                      "</body></html>";
        sendEmail(targetEmail, "Mã khôi phục mật khẩu - AiNetsoft", body);
    }

    // 🛠️ NEW: Professional Seller Approval/Rejection Email
    public void sendSellerStatusEmail(String targetEmail, String fullName, boolean approved, String reason) {
        String statusText = approved ? "ĐÃ ĐƯỢC PHÊ DUYỆT" : "KHÔNG ĐƯỢC PHÊ DUYỆT";
        String color = approved ? "#2ecc71" : "#e74c3c";
        
        String body = "<html><body style='font-family: Arial, sans-serif; line-height: 1.6;'>" +
                      "<h2>Xin chào " + fullName + ",</h2>" +
                      "<p>Yêu cầu đăng ký Người bán của bạn <strong style='color: " + color + ";'>" + statusText + "</strong>.</p>" +
                      (approved ? 
                        "<p>Chúc mừng! Bạn hiện đã có thể đăng tải sản phẩm và bắt đầu kinh doanh trên AiNetsoft.</p>" : 
                        "<p>Lý do: <i>" + reason + "</i>. Vui lòng cập nhật hồ sơ và gửi lại yêu cầu.</p>") +
                      "<br><p>Trân trọng,<br>Ban quản trị AiNetsoft</p>" +
                      "</body></html>";

        sendEmail(targetEmail, "Thông báo kết quả duyệt Người bán - AiNetsoft", body);
    }

    // 🛠️ NEW: Professional Product Approval Email
    public void sendProductStatusEmail(String targetEmail, String fullName, String productName, boolean approved, String reason) {
        String body = "<html><body>" +
                      "<h3>Chào " + fullName + ",</h3>" +
                      "<p>Sản phẩm <strong>" + productName + "</strong> của bạn " + (approved ? "đã được duyệt thành công!" : "bị từ chối hiển thị.") + "</p>" +
                      (!approved ? "<p>Lý do: <i>" + reason + "</i></p>" : "<p>Sản phẩm hiện đã hiển thị công khai trên hệ thống.</p>") +
                      "</body></html>";
        sendEmail(targetEmail, "Thông báo trạng thái sản phẩm - AiNetsoft", body);
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