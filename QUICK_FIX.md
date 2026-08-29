# ⚡ QUICK FIX - Run These Commands Now

## 1️⃣ GET YOUR API KEY

Open this link in browser:
```
https://aistudio.google.com/app/apikeys
```

Click "Create API Key" and **copy your key**

---

## 2️⃣ SET ENVIRONMENT VARIABLE (Choose One)

### Windows PowerShell (Recommended)
```powershell
# Replace with your actual API key from step 1
$env:GEMINI_API_KEY = "AIzaSy...YOUR_KEY_HERE..."
$env:GEMINI_MODEL = "gemini-1.5-pro"

# Verify it's set:
echo $env:GEMINI_API_KEY
```

### Windows Command Prompt
```cmd
set GEMINI_API_KEY=AIzaSy...YOUR_KEY_HERE...
set GEMINI_MODEL=gemini-1.5-pro

# Verify:
echo %GEMINI_API_KEY%
```

### Linux/Mac Terminal
```bash
export GEMINI_API_KEY="AIzaSy...YOUR_KEY_HERE..."
export GEMINI_MODEL="gemini-1.5-pro"

# Verify:
echo $GEMINI_API_KEY
```

---

## 3️⃣ RESTART BACKEND

Kill any running backend process, then:

```bash
cd backend
mvn clean compile
mvn spring-boot:run
```

Or if using IDE:
1. Stop the backend server
2. Wait 5 seconds
3. Start it again

---

## 4️⃣ WATCH FOR SUCCESS MESSAGE

In backend console, look for:
```
========== GEMINI API CALL ==========
API Key configured: YES ✓
API URL: https://generativelanguage.googleapis.com/v1beta/models
Model: gemini-1.5-pro
```

**If you see `API Key configured: NO ✗`** - Environment variable not set, go back to step 2

---

## 5️⃣ TEST IN FRONTEND

1. Open http://localhost:5173
2. Go to Dashboard
3. Click chat widget
4. Select: Category → Type → Period
5. Click "Send Query"
6. **Wait** 2-3 seconds for Gemini to respond
7. Should see real AI analysis (not mock text like "Analysis Complete!")

---

## ✅ SUCCESS INDICATORS

Backend console will show:
```
🔄 Calling Gemini API...
✓ Gemini API response received: 892 chars
✓ Extracted text: Based on your financial data...
========== GEMINI API SUCCESS ==========
```

Chatbot will show:
```
📊 **Analysis Complete!**

**Summary:**
- Total: $1,250 across 15 transactions
- Average: $83.33 per transaction

[Real analysis specific to USER'S data]
```

---

## ❌ IF IT'S STILL NOT WORKING

### Check 1: Is env variable really set?
```powershell
# PowerShell
$env:GEMINI_API_KEY
# Should output your key, NOT empty

# If empty, run step 2 again in SAME PowerShell window
```

### Check 2: Is backend actually restarted?
```
Close all backend processes completely
Wait 5 seconds
Start fresh: mvn spring-boot:run
```

### Check 3: Does backend show correct model?
```
Backend console should show: Model: gemini-1.5-pro
NOT: Model: Default Gemini API Key
```

### Check 4: Test API key directly
```bash
# Replace YOUR_API_KEY
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'

# If invalid key, response will say "Invalid API Key"
# If valid, response will have content
```

### Check 5: Look at ALL backend console output
```
Don't just check the end - scroll up for error messages
Look for: "❌ Gemini API call FAILED"
Error message will tell you what's wrong
```

---

## 🎯 THAT'S IT!

After setting the environment variable and restarting backend, chatbot should work with real Gemini responses.

**No mock responses, no defaults - real AI!**

If issues persist, check the logs - they're now very detailed.

