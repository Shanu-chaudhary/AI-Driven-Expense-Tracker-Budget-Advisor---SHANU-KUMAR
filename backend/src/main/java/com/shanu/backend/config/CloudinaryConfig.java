package com.shanu.backend.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", "di6ndbemp",
                "api_key", "292473461215249",
                "api_secret", "oEjDr8oZHhOmkt9LH_uOU6k01As",
                "secure", true
        ));
    }
}
