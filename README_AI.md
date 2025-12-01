# 🤖 AI Integration Guide

This document covers the AI-powered financial advisory system built into the Expense Tracker, including Gemini API integration, rule-based advice, forecasting, and anomaly detection.

---

## 📋 Table of Contents

1. [Setup Instructions](#setup-instructions)
2. [Gemini API Configuration](#gemini-api-configuration)
3. [Features Overview](#features-overview)
4. [API Endpoints](#api-endpoints)
5. [Frontend Pages](#frontend-pages)
6. [Security & Rate Limiting](#security--rate-limiting)
7. [Troubleshooting](#troubleshooting)

---

## Setup Instructions

### Step 1: Get a Free Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **"Create API Key"** → Select or create a project
3. Copy your **API Key** (starts with `AIzaSy...`)
4. Keep this secret and never commit it to Git

### Step 2: Set Environment Variables

**Windows PowerShell:**
```powershell
$env:GEMINI_API_KEY = "your-api-key-here"
$env:AI_ENABLED = "true"
$env:AI_RATE_LIMIT = "10"
```

**Linux/Mac:**
```bash
export GEMINI_API_KEY="your-api-key-here"
export AI_ENABLED="true"
export AI_RATE_LIMIT="10"
```

**Or create `backend/application-secret.properties`:**
```properties
GEMINI_API_KEY=your-api-key-here
AI_ENABLED=true
AI_RATE_LIMIT=10
```

### Step 3: Verify Configuration

Check `backend/src/main/resources/application.properties`:
```properties
ai.enabled=${AI_ENABLED:false}
ai.model=gemini-pro
ai.key=${GEMINI_API_KEY:}
ai.baseUrl=https://generativelanguage.googleapis.com/v1beta/models
ai.rateLimit.maxCallsPerHour=${AI_RATE_LIMIT:10}
```

---

## Gemini API Configuration

### Supported Models

- **`gemini-pro`** (default, free tier): Best for text-based financial advice
- Pricing: Free tier includes 60 requests/minute

### Request Limits

- **Per-User Rate Limit**: 10 calls per hour (configurable via `AI_RATE_LIMIT`)
- **Gemini API**: 60 requests/minute (official limit)
- Rate limit violations return **HTTP 429 (Too Many Requests)**

### Cost Estimation

- **Free Tier**: 60 requests/minute = sufficient for ~10-50 active users
- No credit card required for free tier
- See [Gemini Pricing](https://ai.google.dev/pricing) for paid plans

---

## Features Overview

### 1. AI-Generated Advice

**Scope Options:**
- `monthly`: This month's spending trends and quick wins
- `yearly`: Annual financial summary and long-term goals
- `detailed`: Deep analysis with multi-category breakdown

**What Gets Analyzed:**
- Transaction history (last 3-6 months)
- Spending patterns by category
- Income vs. expense trends
- Savings goals and budget progress

**What's NOT Sent to Gemini:**
- Email addresses, phone numbers (sanitized)
- Credit card / bank account numbers
- Passwords or sensitive auth tokens

### 2. Rule-Based Tips (Fallback)

If AI is disabled or fails, the system returns rule-based tips:

| Condition | Tip |
|-----------|-----|
| Food spending > 30% of income | "Try meal planning to reduce food costs by 10-20%" |
| Savings rate < goal | "Redirect 5% of monthly income to savings" |
| Utilities > avg | "Unplug devices and reduce thermostat usage" |
| Entertainment > 15% | "Consider reducing subscriptions" |

### 3. Forecasting (3-Month Outlook)

**Methods Used:**
- Rolling 3-month average for stable categories
- Weighted moving average (recent months weighted higher)
- Linear trend analysis for trending categories

**Output:**
- Predicted expense per category for next month
- Confidence score (0-100%)

### 4. Anomaly Detection

**Detection Methods:**
- Z-score detection: Flags spending >2σ from baseline
- Median Absolute Deviation (MAD): Robust outlier detection

**Triggers:**
- Unexpected spike in category spending
- New spending category detected
- Unusual daily transaction pattern

**Storage:**
- Alerts stored in `alerts` collection
- Can be marked as read/dismissed

---

## API Endpoints

### 1. Generate AI Advice

**POST** `/api/ai/advice`

**Request:**
```json
{
  "scope": "monthly"
}
```

**Response (200):**
```json
{
  "summary": "Your spending is stable, with a 5% increase in entertainment. Consider reducing subscriptions.",
  "actions": [
    "Review and cancel unused subscriptions",
    "Redirect $50/month to emergency fund",
    "Track daily coffee expenses"
  ],
  "estimatedSavingsNextMonth": 2500,
  "confidenceScore": 87,
  "citations": ["Last 3 months data", "Industry benchmarks"]
}
```

**Response (429 - Rate Limited):**
```json
{
  "error": "Rate limit exceeded. Max 10 calls per hour."
}
```

**Scope Details:**
- `monthly`: Current month trends, quick wins (fast response)
- `yearly`: Annual review, goal progress (5-30s response)
- `detailed`: Multi-category deep dive (10-30s response)

---

### 2. Get AI History

**GET** `/api/ai/history?page=0&size=10`

**Response (200):**
```json
{
  "history": [
    {
      "id": "507f1f77bcf86cd799439011",
      "userId": "user123",
      "scope": "monthly",
      "summary": "Your spending is stable...",
      "actions": ["..."],
      "estimatedSavingsNextMonth": 2500,
      "confidenceScore": 87,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "totalCount": 42
}
```

---

### 3. Get Rule-Based Tips

**GET** `/api/tips/recommend`

**Response (200):**
```json
{
  "tips": [
    "Your food spending is 32% of income. Try meal planning.",
    "Entertainment is trending up. Review subscriptions.",
    "Savings rate is 12%. Target 15-20%."
  ]
}
```

---

### 4. Get Spending Forecast

**GET** `/api/analytics/forecast`

**Response (200):**
```json
{
  "forecastByCategory": {
    "Food": 8500,
    "Entertainment": 2100,
    "Utilities": 3200,
    "Transport": 5000
  },
  "confidence": 82
}
```

---

### 5. Get Alerts

**GET** `/api/alerts/list`

**Response (200):**
```json
{
  "alerts": [
    {
      "id": "507f1f77bcf86cd799439012",
      "type": "spending_spike",
      "category": "Entertainment",
      "severity": "warning",
      "message": "Entertainment spending spiked 250% this week",
      "createdAt": "2024-01-15T10:30:00Z",
      "isRead": false
    }
  ]
}
```

---

### 6. Mark Alert as Read

**POST** `/api/alerts/mark-read`

**Request:**
```json
{
  "alertId": "507f1f77bcf86cd799439012"
}
```

**Response (200):**
```json
{
  "success": true
}
```

---

## Frontend Pages

### AI Advisor Page (`/ai-advisor`)

**Features:**
- **Generate Button**: Opens modal to select scope
- **Current Advice Card**: Shows latest advice summary
- **Regenerate Button**: Refresh advice for same scope
- **Right Sidebar**: Rule-based tips (always visible)

**UI Components:**
- `AiAdviceModal`: Scope selector + generate
- `AiHistoryCard`: Display advice summary
- `TipCard`: Show tips list

**Loading States:**
- Modal shows spinner while generating
- Error toast on failure or rate limit
- Toast notification on success

### AI History Page (`/ai-history`)

**Features:**
- **List View (left)**: All AI calls with timestamp and scope
- **Detail View (right)**: Full response, confidence score, actions
- **Click-to-Select**: View details for any past advice

**Data Fetched:**
- GET `/api/ai/history` (all user's AI calls)
- Paginated, sorted by date descending

---

## Security & Rate Limiting

### Rate Limiting

**Per-User Limit:**
- Maximum 10 calls per hour (configurable)
- Tracked by user ID (from JWT token)
- Resets hourly

**Gemini API Limit:**
- 60 requests/minute global
- Shared across all users
- Returns 429 if exceeded

**Handling in Frontend:**
```javascript
// On 429 response:
if (error.response?.status === 429) {
  addToast('Rate limit exceeded. Please wait a moment.', 'error');
}
```

### PII Sanitization

The backend **removes** before sending to Gemini:
- Email addresses (regex: `\S+@\S+\.\S+`)
- Phone numbers (regex: `[\d\-\(\)]{10,}`)
- Account numbers
- Credit card patterns

**Example:**
```
Input:  "User john@example.com spent $50 on groceries"
Output: "User [EMAIL] spent $50 on groceries"
```

### JWT Authentication

All AI endpoints require Bearer token:
```bash
curl -H "Authorization: Bearer <jwt-token>" \
  http://localhost:8080/api/ai/advice
```

---

## Troubleshooting

### Issue: `ai.enabled is false`

**Cause**: Environment variable `AI_ENABLED` not set or false

**Fix:**
```powershell
$env:AI_ENABLED = "true"
```

**Expected Behavior:**
- Returns rule-based tips instead (no error)
- `/api/ai/advice` returns 400 error

### Issue: `Invalid API key`

**Cause**: Gemini API key invalid or expired

**Fix:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Delete old key, create new one
3. Set `GEMINI_API_KEY` environment variable
4. Restart backend

### Issue: `Rate limit exceeded (429)`

**Cause**: User made >10 calls in the last hour

**Fix:**
- Wait 1 hour for rate limit to reset, OR
- Increase `AI_RATE_LIMIT` in environment variables

### Issue: `Empty response from Gemini`

**Cause**: Gemini API timeout (usually >30s response time)

**Fix:**
- Reduce transaction history (fewer data points)
- Use `monthly` scope instead of `detailed`
- Check internet connection
- Verify API key is valid

### Issue: `No tips or advice displayed`

**Cause**: User has no transactions yet

**Fix:**
1. Add at least 3-5 transactions in different categories
2. Wait a few minutes for history to populate
3. Try refreshing the page

### Issue: `CORS error when calling AI endpoints`

**Cause**: Frontend allowed origins not configured

**Fix** (in `application.properties`):
```properties
cors.allowedOrigins=http://localhost:5173,http://localhost:3000
```

### Issue: Alerts not triggering

**Cause**: No spending spike detected (within normal range)

**Fix:**
- Create a transaction 5x larger than usual for a category
- Anomaly detection uses z-score (>2σ) to trigger alerts
- Check backend logs for detection details

---

## Testing Checklist

- [ ] Set Gemini API key and `AI_ENABLED=true`
- [ ] Add 5+ transactions in different categories (last 1-2 months)
- [ ] Navigate to `/ai-advisor` page
- [ ] Click "Generate AI Advice" → Select "Monthly" scope
- [ ] Verify advice appears in 5-15 seconds
- [ ] Click "Regenerate" to test again
- [ ] Verify rate limit: 11th call within 1 hour should return 429
- [ ] Check `/ai-history` shows all past calls
- [ ] Verify tips appear in right sidebar
- [ ] Check dashboard shows latest advice preview

---

## Advanced Configuration

### Custom Gemini Model

Edit `application.properties`:
```properties
ai.model=gemini-pro-vision
```

**Available Models (free tier):**
- `gemini-pro` (text only, recommended)
- `gemini-pro-vision` (text + image)

### Adjust Rate Limit

```powershell
$env:AI_RATE_LIMIT = "20"  # Allow 20 calls per hour per user
```

### Disable AI for Specific Users

Modify `AiController.java`:
```java
if (!userIsAllowedForAi(userId)) {
  return ResponseEntity.status(403).build();
}
```

---

## Related Documentation

- [Gemini API Reference](https://ai.google.dev/docs)
- [Google AI Studio](https://makersuite.google.com)
- [Free API Pricing](https://ai.google.dev/pricing)

---

**Last Updated**: January 2024  
**Version**: 1.0
