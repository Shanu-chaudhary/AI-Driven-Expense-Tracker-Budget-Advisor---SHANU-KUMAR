package com.shanu.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * JwtProperties - Configuration properties for JWT authentication.
 * 
 * Maps properties from application.properties:
 * - jwt.secret
 * - jwt.expiration
 */
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
