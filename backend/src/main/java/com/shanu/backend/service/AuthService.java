package com.shanu.backend.service;

import com.shanu.backend.model.User;
import com.shanu.backend.model.AuthResponse;
import com.shanu.backend.repository.UserRepository;
import com.shanu.backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private JavaMailSender mailSender;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // Register User with Email Verification
    public User register(User user) {
        logger.info("Registering user with email: {}", user.getEmail());
        
        if(userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("User already exists");
        }
        
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole("USER");
        user.setCreatedAt(new Date());
        user.setUpdatedAt(new Date());
        user.setEmailVerified(false);
        
        // Generate verification token
        String verificationToken = UUID.randomUUID().toString();
        user.setVerificationToken(verificationToken);
        
        // Save user to database
        User savedUser = userRepository.save(user);
        logger.info("User saved with ID: {}", savedUser.getId());
        
        // Send verification email
        try {
            sendVerificationEmail(savedUser);
            logger.info("Verification email sent to: {}", user.getEmail());
        } catch (Exception e) {
            logger.error("Failed to send verification email to {}: ", user.getEmail(), e);
            // Don't fail the registration if email fails, but log it
        }
        
        return savedUser;
    }

    // Login User
    public AuthResponse login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        // Check if email is verified
        if (!user.isEmailVerified()) {
            throw new RuntimeException("Please verify your email before logging in");
        }

        if (passwordEncoder.matches(password, user.getPassword())) {
            String token = jwtUtil.generateToken(email);
            user.setPassword(null); // do not send back password
            return new AuthResponse(token, user);
        } else {
            throw new RuntimeException("Invalid credentials");
        }
    }

    public User getUserFromToken(String token) {
        if (token == null) {
            throw new RuntimeException("Missing token");
        }
        // allow passing either raw token or "Bearer <token>"
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        try {
            String email = jwtUtil.extractEmail(token);
            return userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found for token"));
        } catch (Exception e) {
            throw new RuntimeException("Invalid or expired token", e);
        }
    }

    // Verify Email
    public User verifyEmail(String token) {
        logger.info("Verifying email with token: {}", token);
        
        Optional<User> userOpt = userRepository.findByVerificationToken(token);
        
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Invalid or expired verification token");
        }
        
        User user = userOpt.get();
        user.setEmailVerified(true);
        user.setVerificationToken(null);
        userRepository.save(user);
        
        logger.info("Email verified for user: {}", user.getEmail());
        return user;
    }

    private void sendVerificationEmail(User user) {
        try {
            String verifyUrl = "http://localhost:5173/verify-email?token=" + user.getVerificationToken();

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
            logger.error("Error sending verification email to {}: ", user.getEmail(), e);
            throw new RuntimeException("Failed to send verification email: " + e.getMessage());
        }
    }
}
