package com.shanu.backend.controller;

import com.shanu.backend.model.User;
import com.shanu.backend.model.AuthResponse;
import com.shanu.backend.repository.UserRepository;
import com.shanu.backend.security.JwtUtil;
import com.shanu.backend.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    private final UserRepository userRepository;
    private final AuthService authService;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepository, AuthService authService, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.authService = authService;
        this.jwtUtil = jwtUtil;
    }

    // Health Check Endpoint
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "OK", "message", "Auth service is running"));
    }

    // Register Endpoint
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            logger.info("Register attempt for email: {}", user.getEmail());
            
            // Validate input
            if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                logger.warn("Registration failed: email is empty");
                return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
            }
            if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                logger.warn("Registration failed: password is empty");
                return ResponseEntity.badRequest().body(Map.of("message", "Password is required"));
            }
            if (user.getName() == null || user.getName().trim().isEmpty()) {
                logger.warn("Registration failed: name is empty");
                return ResponseEntity.badRequest().body(Map.of("message", "Name is required"));
            }
            
            User registeredUser = authService.register(user);
            logger.info("User registered successfully. Verification email sent to: {}", user.getEmail());
            
            return ResponseEntity.ok(Map.of(
                "message", "Registration successful! Please verify your email to proceed.",
                "email", registeredUser.getEmail(),
                "emailVerified", false
            ));
        } catch (RuntimeException e) {
            logger.warn("Registration error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            logger.error("Registration error: ", e);
            return ResponseEntity.badRequest().body(Map.of("message", "Registration failed: " + e.getMessage()));
        }
    }

    // Login Endpoint
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody User user) {
        try {
            if (user.getEmail() == null || user.getEmail().trim().isEmpty() || 
                user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required"));
            }
            
            AuthResponse response = authService.login(user.getEmail(), user.getPassword());
            if (response == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
            }
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            logger.warn("Login error for {}: {}", user.getEmail(), e.getMessage());
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            logger.error("Login failed: ", e);
            return ResponseEntity.status(500).body(Map.of("message", "Login failed: " + e.getMessage()));
        }
    }


    // Logout endpoint
    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                // still succeed on client side but do nothing server-side
                return ResponseEntity.ok(Map.of("message", "Logged out"));
            }
            // Token validation happens via JWT expiration; no need to invalidate
            return ResponseEntity.ok(Map.of("message", "Logged out"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to logout: " + e.getMessage()));
        }
    }


    // Get current user
    @GetMapping("/me")
    public User getCurrentUser(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");

        if(authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null; // or throw exception
        }

        String token = authHeader.substring(7); // Remove "Bearer "
        String email = jwtUtil.extractEmail(token);
        
        return userRepository.findByEmail(email).orElse(null);
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
        try {
            logger.info("Verifying email with token: {}", token);
            User verifiedUser = authService.verifyEmail(token);
            logger.info("Email verified successfully for: {}", verifiedUser.getEmail());
            
            return ResponseEntity.ok(Map.of(
                "message", "Email verified successfully! You can now log in.",
                "email", verifiedUser.getEmail(),
                "emailVerified", true
            ));
        } catch (RuntimeException e) {
            logger.warn("Email verification failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            logger.error("Email verification error: ", e);
            return ResponseEntity.status(500).body(Map.of("message", "Verification failed: " + e.getMessage()));
        }
    }
    
}



// package com.shanu.backend.controller;

// import com.shanu.backend.model.User;
// import com.shanu.backend.model.AuthResponse;
// import com.shanu.backend.repository.UserRepository;
// import com.shanu.backend.security.JwtUtil;
// import com.shanu.backend.service.AuthService;

// import jakarta.servlet.http.HttpServletRequest;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;

// import java.util.Map;

// @RestController
// @RequestMapping("/api/auth")
// @CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*")
// public class AuthController {

//     private final UserRepository userRepository;
//     private final AuthService authService;
//     private final JwtUtil jwtUtil;

//     public AuthController(UserRepository userRepository, AuthService authService, JwtUtil jwtUtil) {
//         this.userRepository = userRepository;
//         this.authService = authService;
//         this.jwtUtil = jwtUtil;
//     }

//     // Register with email verification
//     @PostMapping("/register")
//     public ResponseEntity<?> registerUser(@RequestBody User user) {
//         String message = authService.registerUser(user);
//         if (message.contains("already exists")) {
//             return ResponseEntity.badRequest().body(Map.of("message", message));
//         }
//         return ResponseEntity.ok(Map.of("message", message));
//     }

//     // Email Verification
//     @GetMapping("/verify-email")
//     public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
//         boolean verified = authService.verifyEmailToken(token);
//         if (verified) {
//             return ResponseEntity.ok(Map.of("message", "Email verified successfully!"));
//         }
//         return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Invalid or expired token"));
//     }

//     // Login (only verified users)
//     @PostMapping("/login")
//     public ResponseEntity<?> loginUser(@RequestBody User user) {
//         User dbUser = userRepository.findByEmail(user.getEmail()).orElse(null);
//         if (dbUser == null || !dbUser.isEmailVerified()) {
//             return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
//                     .body(Map.of("message", "Email not verified. Please check your inbox."));
//         }
//         try {
//             AuthResponse response = authService.login(user.getEmail(), user.getPassword());
//             return ResponseEntity.ok(response);
//         } catch (RuntimeException e) {
//             return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
//                     .body(Map.of("message", e.getMessage()));
//         }
//     }

//     // ✅ Logout
//     @PostMapping("/logout")
//     public ResponseEntity<?> logoutUser(@RequestHeader(value = "Authorization", required = false) String authHeader) {
//         return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
//     }

//     // ✅ Current User
//     @GetMapping("/me")
//     public User getCurrentUser(HttpServletRequest request) {
//         String authHeader = request.getHeader("Authorization");
//         if (authHeader == null || !authHeader.startsWith("Bearer ")) {
//             return null;
//         }
//         String token = authHeader.substring(7);
//         String email = jwtUtil.extractEmail(token);
//         return userRepository.findByEmail(email).orElse(null);
//     }
// }
