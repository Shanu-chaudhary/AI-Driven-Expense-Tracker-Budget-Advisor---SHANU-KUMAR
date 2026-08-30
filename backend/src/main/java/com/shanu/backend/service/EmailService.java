package com.shanu.backend.service;

import com.shanu.backend.model.User;
import jakarta.annotation.PostConstruct;
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

    @Value("${frontend.url:}")
    private String frontendUrl;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @PostConstruct
    public void validateMailConfiguration() {
        if (mailUsername == null || mailUsername.isBlank()) {
            logger.warn("MAIL_USERNAME is not configured. Email verification will fail until it is set.");
        }
        if (frontendUrl == null || frontendUrl.isBlank()) {
            logger.warn("FRONTEND_URL is not configured. Verification emails will contain an invalid link.");
        }
    }

    @Async
    public void sendVerificationEmailAsync(User user) {
        try {
            if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
                logger.error("Cannot send verification email because user email is empty.");
                return;
            }
            if (user.getVerificationToken() == null || user.getVerificationToken().isBlank()) {
                logger.error("Cannot send verification email because verification token is missing for user {}.", user.getEmail());
                return;
            }
            if (frontendUrl == null || frontendUrl.isBlank()) {
                throw new IllegalStateException("FRONTEND_URL is not configured");
            }
            if (mailUsername == null || mailUsername.isBlank()) {
                throw new IllegalStateException("MAIL_USERNAME is not configured");
            }

            String verifyUrl = frontendUrl + "/verify-email?token=" + user.getVerificationToken();

            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setFrom(mailUsername);
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
            logger.error("Error sending verification email to {}: {}", user != null ? user.getEmail() : "unknown", e.getMessage(), e);
        }
    }
}
