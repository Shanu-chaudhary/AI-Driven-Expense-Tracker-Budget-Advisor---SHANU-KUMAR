// package com.shanu.backend.service;

// import com.shanu.backend.model.User;
// import com.shanu.backend.model.AuthResponse;
// import com.shanu.backend.repository.UserRepository;
// import com.shanu.backend.security.JwtUtil;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
// import org.springframework.stereotype.Service;
// import java.util.UUID;
// import org.springframework.mail.javamail.JavaMailSender;
// import org.springframework.mail.SimpleMailMessage;

// import java.util.Date;

// @Service
// public class AuthService {

//     @Autowired
//     private UserRepository userRepository;

//     @Autowired
//     private JwtUtil jwtUtil;

//     @Autowired
//     private JavaMailSender mailSender;

//     private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

//     // Register User
//     public String register(User user) {
//         if(userRepository.existsByEmail(user.getEmail())) {
//             return "User already exists";
//         }
//         user.setPassword(passwordEncoder.encode(user.getPassword()));
//         user.setRole("USER");  // Set default role
//         user.setCreatedAt(new Date());
//         user.setUpdatedAt(new Date());
//         userRepository.save(user);
//         return "User registered successfully";
//     }

//     // Login User
//     // public AuthResponse login(String email, String password) {
//     //     User user = userRepository.findByEmail(email).orElse(null);
//     //     if(user == null) return null;

//     //     if(passwordEncoder.matches(password, user.getPassword())) {
//     //         String token = jwtUtil.generateToken(email);
//     //         // Do not send back password
//     //         user.setPassword(null);
//     //         return new AuthResponse(token, user);
//     //     }
//     //     return null;
//     // }

    

//     // Login User
// public AuthResponse login(String email, String password) {
//     User user = userRepository.findByEmail(email)
//             .orElseThrow(() -> new RuntimeException("Invalid credentials"));

//     if (passwordEncoder.matches(password, user.getPassword())) {
//         String token = jwtUtil.generateToken(email);
//         user.setPassword(null); // do not send back password
//         return new AuthResponse(token, user);
//     } else {
//         throw new RuntimeException("Invalid credentials");
//     }
// }


//     public User getUserFromToken(String token) {
//     if (token == null) {
//         throw new RuntimeException("Missing token");
//     }
//     // allow passing either raw token or "Bearer <token>"
//     if (token.startsWith("Bearer ")) {
//         token = token.substring(7);
//     }
//     try {
//         String email = jwtUtil.extractEmail(token); // use your JwtUtil
//         return userRepository.findByEmail(email)
//                 .orElseThrow(() -> new RuntimeException("User not found for token"));
//     } catch (Exception e) {
//         throw new RuntimeException("Invalid or expired token", e);
//     }
// }


// public User registerUser(User user) {
//         // save user normally
//         user.setEmailVerified(false);
//         String token = UUID.randomUUID().toString();
//         user.setVerificationToken(token);

//         User savedUser = userRepository.save(user);

//         sendVerificationEmail(savedUser);
//         return savedUser;
//     }


    
// private void sendVerificationEmail(User user) {
//         String verifyUrl = "http://localhost:5173/verify-email?token=" + user.getVerificationToken();

//         SimpleMailMessage mail = new SimpleMailMessage();
//         mail.setTo(user.getEmail());
//         mail.setSubject("Verify your email - BudgetPilot");
//         mail.setText("Welcome to BudgetPilot!\n\nClick below to verify your email:\n" + verifyUrl +
//                      "\n\nIf you didn’t request this, ignore this email.");
//         mailSender.send(mail);
//     }

// }






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

import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private JavaMailSender mailSender;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // ✅ Register User with Email Verification
    public String register(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            return "User already exists";
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole("USER");
        user.setCreatedAt(new Date());
        user.setUpdatedAt(new Date());
        user.setEmailVerified(false);

        // Generate unique verification token
        String token = UUID.randomUUID().toString();
        user.setVerificationToken(token);

        userRepository.save(user);

        // Send verification link
        sendVerificationEmail(user);

        return "User registered successfully. Please check your email for verification link.";
    }

    // ✅ Send Verification Email
    private void sendVerificationEmail(User user) {
        String verifyUrl = "http://localhost:5173/verify-email?token=" + user.getVerificationToken();

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        message.setSubject("Verify your email - BudgetPilot");
        message.setText("Welcome to BudgetPilot!\n\nPlease click the link below to verify your email:\n" +
                verifyUrl + "\n\nIf you didn’t request this, you can safely ignore it.");

        mailSender.send(message);
    }

    // ✅ Verify Email via Token
    public String verifyEmail(String token) {
        Optional<User> userOpt = userRepository.findByVerificationToken(token);
        if (userOpt.isEmpty()) {
            return "Invalid or expired verification token.";
        }

        User user = userOpt.get();
        user.setEmailVerified(true);
        user.setVerificationToken(null);
        userRepository.save(user);

        return "Email verified successfully!";
    }

    // ✅ Login (only for verified users)
    public AuthResponse login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!user.isEmailVerified()) {
            throw new RuntimeException("Please verify your email before logging in.");
        }

        if (passwordEncoder.matches(password, user.getPassword())) {
            String token = jwtUtil.generateToken(email);
            user.setPassword(null);
            return new AuthResponse(token, user);
        } else {
            throw new RuntimeException("Invalid credentials");
        }
    }

    // ✅ Get user from JWT token
    public User getUserFromToken(String token) {
        if (token == null) {
            throw new RuntimeException("Missing token");
        }
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        String email = jwtUtil.extractEmail(token);
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found for token"));
    }
}
