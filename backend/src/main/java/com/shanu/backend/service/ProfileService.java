package com.shanu.backend.service;

import com.shanu.backend.model.User;
import com.shanu.backend.model.UserProfile;
import com.shanu.backend.repository.UserProfileRepository;
import com.shanu.backend.repository.UserRepository;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.Optional;

@Service
public class ProfileService {

    @Autowired
    private UserProfileRepository profileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private Cloudinary cloudinary;

    public UserProfile saveProfile(String userId, UserProfile profileData) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<UserProfile> existingProfile = profileRepository.findByUser(user);
        UserProfile savedProfile;

        if (existingProfile.isPresent()) {
            UserProfile profile = existingProfile.get();
            profile.setFullName(profileData.getFullName());
            profile.setDisplayName(profileData.getDisplayName());
            profile.setGender(profileData.getGender());
            profile.setCountry(profileData.getCountry());
            profile.setState(profileData.getState());
            profile.setCity(profileData.getCity());
            profile.setTimeZone(profileData.getTimeZone());
            profile.setCurrency(profileData.getCurrency());
            profile.setLanguage(profileData.getLanguage());
            profile.setPhoneNumber(profileData.getPhoneNumber());
            profile.setProfileCompleted(true);
            savedProfile = profileRepository.save(profile);
        } else {
            profileData.setUser(user);
            profileData.setProfileCompleted(true);
            savedProfile = profileRepository.save(profileData);
        }

        user.setProfileComplete(true);
        userRepository.save(user);

        return savedProfile;
    }

    public UserProfile getProfileByUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return profileRepository.findByUser(user).orElse(null);
    }

    public UserProfile uploadProfileImage(String userId, MultipartFile file) {
        try {
            UserProfile profile = getProfileByUser(userId);
            if (profile == null) throw new RuntimeException("Profile not found");

            Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap("folder", "profile_images", "overwrite", true));

            profile.setProfileImageUrl(uploadResult.get("secure_url").toString());
            return profileRepository.save(profile);
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload image: " + e.getMessage());
        }
    }
}
