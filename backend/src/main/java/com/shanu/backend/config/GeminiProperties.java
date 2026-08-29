package com.shanu.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * GeminiProperties - Configuration properties for Gemini API integration.
 * 
 * Maps properties from application.properties:
 * - gemini.api.key
 * - gemini.api.url
 * - gemini.model
 */
@ConfigurationProperties(prefix = "gemini.api")
public class GeminiProperties {
  private String key;
  private String url;
  private String model;

  public String getKey() {
    return key;
  }

  public void setKey(String key) {
    this.key = key;
  }

  public String getUrl() {
    return url;
  }

  public void setUrl(String url) {
    this.url = url;
  }

  public String getModel() {
    return model;
  }

  public void setModel(String model) {
    this.model = model;
  }
}
