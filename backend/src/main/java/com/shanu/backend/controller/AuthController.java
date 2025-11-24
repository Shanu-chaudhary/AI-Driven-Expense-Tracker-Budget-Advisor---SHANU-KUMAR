// package com.shanu.backend.controller;

// import com.shanu.backend.model.User;
// import com.shanu.backend.model.AuthResponse;
// import com.shanu.backend.repository.UserRepository;
// import com.shanu.backend.security.JwtUtil;
// import com.shanu.backend.service.AuthService;

// import jakarta.servlet.http.HttpServletRequest;
// import java.util.Map;
// import org.springframework.http.HttpStatus;

// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;

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

//     // Register Endpoint
//     @PostMapping("/register")
//     public ResponseEntity<?> registerUser(@RequestBody User user) {
//         String result = authService.register(user);
//         if (result.equals("User already exists")) {
//             return ResponseEntity.badRequest().body(result);
//         }
//         return ResponseEntity.ok(result);
//     }

//     // Login Endpoint
//     @PostMapping("/login")
//     public ResponseEntity<?> loginUser(@RequestBody User user) {
//         AuthResponse response = authService.login(user.getEmail(), user.getPassword());
//         if (response == null) {
//             return ResponseEntity.status(401).body("Invalid credentials");
//         }
//         return ResponseEntity.ok(response);
//     }


//     // Logout endpoint
// @PostMapping("/logout")
// public ResponseEntity<?> logoutUser(@RequestHeader(value = "Authorization", required = false) String authHeader) {
//     try {
//         if (authHeader == null || !authHeader.startsWith("Bearer ")) {
//             // still succeed on client side but do nothing server-side
//             return ResponseEntity.ok(Map.of("message", "Logged out"));
//         }
//         String token = authHeader.substring(7);
//         jwtUtil.invalidateToken(token);
//         return ResponseEntity.ok(Map.of("message", "Logged out"));
//     } catch (Exception e) {
//         return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                 .body(Map.of("message", "Failed to logout: " + e.getMessage()));
//     }
// }


//     // Get current user
//     @GetMapping("/me")
//     public User getCurrentUser(HttpServletRequest request) {
//         String authHeader = request.getHeader("Authorization");

//         if(authHeader == null || !authHeader.startsWith("Bearer ")) {
//             return null; // or throw exception
//         }

//         String token = authHeader.substring(7); // Remove "Bearer "
//         String email = jwtUtil.extractEmail(token);
        
//         return userRepository.findByEmail(email).orElse(null);
//     }

// //     @GetMapping("/verify-email")
// // public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
// //     Optional<User> userOpt = userRepository.findByVerificationToken(token);

// //     if (userOpt.isEmpty()) {
// //         return ResponseEntity.badRequest().body("Invalid or expired token");
// //     }

// //     User user = userOpt.get();
// //     user.setEmailVerified(true);
// //     user.setVerificationToken(null);
// //     userRepository.save(user);

// //     return ResponseEntity.ok("Email verified successfully!");
// // }
    
// }



package com.shanu.backend.controller;

import com.shanu.backend.model.User;
import com.shanu.backend.model.AuthResponse;
import com.shanu.backend.repository.UserRepository;
import com.shanu.backend.security.JwtUtil;
import com.shanu.backend.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*")
public class AuthController {

    private final UserRepository userRepository;
    private final AuthService authService;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepository, AuthService authService, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.authService = authService;
        this.jwtUtil = jwtUtil;
    }

    // ✅ Register
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        String message = authService.register(user);
        if (message.equals("User already exists")) {
            return ResponseEntity.badRequest().body(Map.of("message", message));
        }
        return ResponseEntity.ok(Map.of("message", message));
    }

    // ✅ Email Verification
    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
        String result = authService.verifyEmail(token);
        if (result.contains("successfully")) {
            return ResponseEntity.ok(Map.of("message", result));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", result));
    }

    // ✅ Login (only verified users)
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody User user) {
        try {
            AuthResponse response = authService.login(user.getEmail(), user.getPassword());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // ✅ Logout
    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    // ✅ Current User
    @GetMapping("/me")
    public User getCurrentUser(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authHeader.substring(7);
        String email = jwtUtil.extractEmail(token);
        return userRepository.findByEmail(email).orElse(null);
    }
}
