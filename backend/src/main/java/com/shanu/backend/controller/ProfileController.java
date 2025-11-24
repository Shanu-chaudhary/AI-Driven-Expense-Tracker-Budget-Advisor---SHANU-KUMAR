package com.shanu.backend.controller;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.shanu.backend.model.UserProfile;
import com.shanu.backend.model.User;
import com.shanu.backend.service.ProfileService;
import com.shanu.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:5173")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    @Autowired
    private AuthService authService;

    @PostMapping("/create")
    public ResponseEntity<?> createProfile(@RequestHeader("Authorization") String token,
                                      @RequestBody UserProfile profileData) {
        try {
            String cleanToken = token != null && token.startsWith("Bearer ") 
                ? token.substring(7) : token;
                
            User user = authService.getUserFromToken(cleanToken);
            UserProfile savedProfile = profileService.saveProfile(user.getId(), profileData);
            return ResponseEntity.ok(savedProfile);
        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("Failed to create profile: " + e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(@RequestHeader("Authorization") String token) {
        try {
            String cleanToken = token != null && token.startsWith("Bearer ") 
                ? token.substring(7) : token;
                
            User user = authService.getUserFromToken(cleanToken);
            UserProfile profile = profileService.getProfileByUser(user.getId());
            
            if (profile == null) {
                return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Profile not found"));
            }
            
            return ResponseEntity.ok(profile);
        } catch (RuntimeException e) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("Failed to fetch profile: " + e.getMessage()));
        }
    }


    @PutMapping("/update")
public ResponseEntity<?> updateProfile(
        @RequestHeader("Authorization") String token,
        @RequestPart(value = "profileData", required = false) String profileDataStr,
        @RequestPart(value = "file", required = false) MultipartFile file
) {
    try {
        String cleanToken = token != null && token.startsWith("Bearer ") ? token.substring(7) : token;
        User user = authService.getUserFromToken(cleanToken);
        UserProfile profile;

        if (profileDataStr != null && !profileDataStr.isEmpty()) {
            ObjectMapper mapper = new ObjectMapper();
            // support Java 8+ date/time types
            mapper.registerModule(new JavaTimeModule());
            // ignore unknown fields (e.g. nested user.enabled) to avoid failing on extra client-side props
            mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            UserProfile profileData = mapper.readValue(profileDataStr, UserProfile.class);
            profile = profileService.saveProfile(user.getId(), profileData);
        } else {
            profile = profileService.getProfileByUser(user.getId());
        }

        if (file != null && !file.isEmpty()) {
            profile = profileService.uploadProfileImage(user.getId(), file);
        }

        return ResponseEntity.ok(profile);
    } catch(Exception e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("Failed to update profile: " + e.getMessage()));
    }
}

    
    private static class ErrorResponse {
        private final String message;
        
        public ErrorResponse(String message) {
            this.message = message;
        }
        
        @JsonProperty("message")
        public String getMessage() {
            return message;
        }
    }
}
