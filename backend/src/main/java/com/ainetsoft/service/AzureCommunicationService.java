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
        try {
            // 1. Initialize the client using your connection string
            EmailClient emailClient = new EmailClientBuilder()
                .connectionString(connectionString)
                .buildClient();

            // 2. Define the recipient
            EmailAddress toAddress = new EmailAddress(targetEmail);

            // 3. Build the message using the Fluent API from the Portal snippet
            // This places the Subject and Body exactly where the SDK expects them
            EmailMessage emailMessage = new EmailMessage()
                .setSenderAddress(fromEmail)
                .setToRecipients(toAddress)
                .setSubject("Mã khôi phục mật khẩu - AiNetsoft")
                .setBodyHtml("<html><body>" +
                             "<h3>Chào bạn,</h3>" +
                             "<p>Mã OTP của bạn là: <span style='font-size: 20px; font-weight: bold; color: #5b67f1;'>" + otpCode + "</span></p>" +
                             "<p>Mã này có hiệu lực trong 10 phút.</p>" +
                             "</body></html>");

            // 4. Send the message
            // Note: We pass 'null' for the Context as seen in the Portal snippet
            SyncPoller<EmailSendResult, EmailSendResult> poller = emailClient.beginSend(emailMessage, null);
            
            // Wait for completion to ensure it actually sent
            poller.waitForCompletion();
            
            System.out.println("Email sent successfully! ID: " + poller.getFinalResult().getId());

        } catch (Exception e) {
            System.err.println("Azure SDK Error: " + e.getMessage());
            throw new RuntimeException("Lỗi hệ thống khi gửi email: " + e.getMessage());
        }
    }
}