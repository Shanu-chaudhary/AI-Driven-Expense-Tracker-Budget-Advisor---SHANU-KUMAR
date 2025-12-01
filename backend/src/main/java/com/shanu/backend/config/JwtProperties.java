package com.shanu.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * JwtProperties - Configuration properties for JWT authentication.
 * 
 * Maps properties from application.properties:
 * - jwt.secret
 * - jwt.expiration
 */
@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {
  private String secret;
  private long expiration;

  public String getSecret() {
    return secret;
  }

  public void setSecret(String secret) {
    this.secret = secret;
  }

  public long getExpiration() {
    return expiration;
  }

  public void setExpiration(long expiration) {
    this.expiration = expiration;
  }
}
