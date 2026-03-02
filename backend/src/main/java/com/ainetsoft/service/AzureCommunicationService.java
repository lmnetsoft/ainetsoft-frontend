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
                      "<p>Mã OTP của bạn là: <span style='font-size: 20px; font-weight: bold; color: #5b67f1;'>" + otpCode + "</span></p>" +
                      "<p>Mã này có hiệu lực trong 10 phút.</p>" +
                      "</body></html>";
        sendEmail(targetEmail, "Mã khôi phục mật khẩu - AiNetsoft", body);
    }

    public void sendWelcomeEmail(String targetEmail, String fullName) {
        String body = "<html><body>" +
                      "<h3>Xin chào " + fullName + ",</h3>" +
                      "<p>Chào mừng bạn đến với <strong>AiNetsoft</strong>!</p>" +
                      "<p>Tài khoản của bạn đã được khởi tạo thành công.</p>" +
                      "</body></html>";
        sendEmail(targetEmail, "Chào mừng bạn đến với AiNetsoft", body);
    }

    private void sendEmail(String targetEmail, String subject, String htmlContent) {
        try {
            EmailClient emailClient = new EmailClientBuilder()
                .connectionString(connectionString)
                .buildClient();

            EmailAddress toAddress = new EmailAddress(targetEmail);

            EmailMessage emailMessage = new EmailMessage()
                .setSenderAddress(fromEmail)
                .setToRecipients(toAddress)
                .setSubject(subject)
                .setBodyHtml(htmlContent);

            SyncPoller<EmailSendResult, EmailSendResult> poller = emailClient.beginSend(emailMessage, null);
            poller.waitForCompletion();
            
            System.out.println("Email sent successfully! ID: " + poller.getFinalResult().getId());

        } catch (Exception e) {
            System.err.println("Azure SDK Error: " + e.getMessage());
            throw new RuntimeException("Lỗi hệ thống khi gửi email: " + e.getMessage());
        }
    }
}