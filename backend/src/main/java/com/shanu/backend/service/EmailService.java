package com.shanu.backend.service;

import com.shanu.backend.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${frontend.url}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendVerificationEmailAsync(User user) {
        try {
            String verifyUrl = frontendUrl + "/verify-email?token=" + user.getVerificationToken();

            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(user.getEmail());
            mail.setSubject("Verify your email - BudgetPilot");
            mail.setText("Welcome to BudgetPilot!\n\n" +
                    "Please click the link below to verify your email:\n" +
                    verifyUrl + "\n\n" +
                    "This link will expire in 24 hours.\n\n" +
                    "If you didn't request this, please ignore this email.\n\n" +
                    "Best regards,\nBudgetPilot Team");

            mailSender.send(mail);
            logger.info("Verification email sent successfully to: {}", user.getEmail());
        } catch (Exception e) {
            logger.error("Error sending verification email to {}: {}", user.getEmail(), e.getMessage(), e);
        }
    }
}
