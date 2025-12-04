# 🔧 GEMINI API SETUP - DEBUG CHECKLIST

## ❌ PROBLEM: AI Chatbot returning default responses instead of real Gemini responses

---

## ✅ SOLUTION CHECKLIST

### Step 1: Get Your API Key
1. Go to: https://aistudio.google.com/app/apikeys
2. Click "Get API Key" button
3. Create new API key (or copy existing)
4. Copy the key (looks like: `AIzaSy...`)
5. **DO NOT share or commit this key**

### Step 2: Set Environment Variable
**Windows (PowerShell):**
```powershell
$env:GEMINI_API_KEY = "AIzaSy..."  # Your actual key
$env:GEMINI_MODEL = "gemini-1.5-pro"
```

**Windows (CMD):**
```cmd
set GEMINI_API_KEY=AIzaSy...
set GEMINI_MODEL=gemini-1.5-pro
```

**Linux/Mac:**
```bash
export GEMINI_API_KEY="AIzaSy..."
export GEMINI_MODEL="gemini-1.5-pro"
```

**For permanent setup (add to `.env` file in backend):**
```
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-1.5-pro
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models
```

### Step 3: Verify Configuration

#### Check Backend Logs
When you start the backend, look for these lines in console:
```
========== GEMINI API CALL ==========
API Key configured: YES ✓
API URL: https://generativelanguage.googleapis.com/v1beta/models
Model: gemini-1.5-pro
```

If you see `NO ✗`, the API key is NOT set.

#### Test API Key Directly (curl)
```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

Should return JSON with content, not error.

### Step 4: Check application.properties

**Current problematic settings:**
```properties
gemini.api.key=${GEMINI_API_KEY:AIzaSyBvJkQeQ5ecVsyHDLSehbqm7bQgb7eelO0}  # ❌ WRONG - placeholder
gemini.model=${GEMINI_MODEL:Default Gemini API Key}                        # ❌ WRONG - invalid model name
```

**Should be:**
```properties
gemini.api.key=${GEMINI_API_KEY:}                              # ✓ Empty default = MUST set env var
gemini.api.url=${GEMINI_API_URL:https://generativelanguage.googleapis.com/v1beta/models}
gemini.model=${GEMINI_MODEL:gemini-1.5-pro}                    # ✓ Valid model name
chat.system-prompt=${CHAT_SYSTEM_PROMPT:You are BudgetPilot...}
chat.rate-limit.per-sec=${CHAT_RATE_LIMIT_PER_SEC:2}
```

### Step 5: Debug in Browser Console

When chatbot is not working, check browser console for:
```
Error sending query: No token available to fetch transaction data
```

This means backend isn't being called at all (mock mode).

### Step 6: Check Backend Logs for Real API Calls

Look for these success messages:
```
✓ Gemini API response received: 1234 chars
✓ Extracted text: Your analysis shows...
========== GEMINI SUCCESS ==========
```

If you see errors instead, check:
- Is API key valid? (not expired)
- Is API key configured in environment?
- Is internet connection working?
- Is Gemini API service up? (check status.cloud.google.com)

---

## 🔍 COMMON ISSUES & FIXES

### Issue 1: "API key not configured"
**Cause:** GEMINI_API_KEY environment variable not set
**Fix:** 
```powershell
# PowerShell - check if set
$env:GEMINI_API_KEY

# Should output your key. If empty, set it:
$env:GEMINI_API_KEY = "AIzaSy..."

# Then restart backend
mvn spring-boot:run
```

### Issue 2: "Invalid model: Default Gemini API Key"
**Cause:** application.properties has wrong model name
**Fix:** Set `GEMINI_MODEL=gemini-1.5-pro` environment variable
```powershell
$env:GEMINI_MODEL = "gemini-1.5-pro"
```

### Issue 3: Chatbot still showing mock responses
**Cause:** Exception caught, falling back to defaults
**Fix:** Check backend logs for Gemini API error messages
```
❌ Gemini API call FAILED: ...
```

### Issue 4: API returns "Invalid API key"
**Cause:** API key expired or deleted
**Fix:** Generate new key at https://aistudio.google.com/app/apikeys

---

## ✅ VERIFICATION COMMANDS

**Check if env var is set (PowerShell):**
```powershell
echo $env:GEMINI_API_KEY
```

**View application.properties:**
```powershell
Get-Content backend/src/main/resources/application.properties | Select-String "gemini"
```

**Check backend logs for "API Key configured":**
```powershell
# Restart backend and watch for this log
mvn spring-boot:run -f backend/pom.xml
```

---

## 📱 TEST FLOW

1. ✅ Set GEMINI_API_KEY environment variable
2. ✅ Restart backend server
3. ✅ Check backend logs show "API Key configured: YES ✓"
4. ✅ Open chat widget in frontend
5. ✅ Select category, type, period
6. ✅ Click "Send Query"
7. ✅ Backend logs should show "✓ Gemini API response received"
8. ✅ Chatbot displays AI-generated response (not mock)

If any step fails, check logs for error messages.

---

## 🚀 AFTER FIXING

Once Gemini works:
- Chatbot will show real AI responses
- Analysis will be based on user's actual transaction data
- Responses will be personalized to user's categories and spending
- No more default mock messages

