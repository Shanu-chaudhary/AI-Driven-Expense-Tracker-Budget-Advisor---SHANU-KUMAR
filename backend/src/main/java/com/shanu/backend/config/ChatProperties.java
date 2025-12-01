package com.shanu.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * ChatProperties - Configuration properties for Chat functionality.
 * 
 * Maps properties from application.properties:
 * - chat.system-prompt
 * - chat.rate-limit.per-sec (note: hyphen converted to camelCase)
 */
@ConfigurationProperties(prefix = "chat")
public class ChatProperties {
  private String systemPrompt;
  private RateLimit rateLimit;

  public static class RateLimit {
    private int perSec;

    public int getPerSec() {
      return perSec;
    }

    public void setPerSec(int perSec) {
      this.perSec = perSec;
    }
  }

  public String getSystemPrompt() {
    return systemPrompt;
  }

  public void setSystemPrompt(String systemPrompt) {
    this.systemPrompt = systemPrompt;
  }

  public RateLimit getRateLimit() {
    if (rateLimit == null) {
      rateLimit = new RateLimit();
    }
    return rateLimit;
  }

  public void setRateLimit(RateLimit rateLimit) {
    this.rateLimit = rateLimit;
  }
}
