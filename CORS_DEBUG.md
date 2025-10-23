# 🐛 CORS Error Debug Guide

## Your Error:
```
Access to XMLHttpRequest at 'https://hansitha-web-storefront.onrender.com/api/movies' 
from origin 'https://zeyobron.netlify.app' has been blocked by CORS policy
```

## 🔍 Issue Analysis:

Two problems detected:
1. **CORS Error** - Backend not allowing requests from Netlify
2. **404 Not Found** - API endpoint might not exist or backend is down

---

## ✅ Immediate Fixes

### Step 1: Verify Backend is Running

**Test Backend Health:**
```bash
curl https://hansitha-web-storefront.onrender.com/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "Zeyobron Backend is running",
  "timestamp": "2025-10-23T..."
}
```

**If you get 404 or no response:**
- Backend might be sleeping (free tier)
- Backend might not be deployed yet
- URL might be wrong

### Step 2: Check Backend Logs

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Find your backend service
3. Click **"Logs"** tab
4. Look for:
   - `🚀 Server running on port...`
   - `MongoDB Connected`
   - `❌ CORS blocked for origin: https://zeyobron.netlify.app`

### Step 3: Verify Allowed Origins in Backend

The backend should show this in logs when request comes:
```
✅ CORS allowed for origin: https://zeyobron.netlify.app
```

If you see:
```
❌ CORS blocked for origin: https://zeyobron.netlify.app
```

Then the origin isn't in the allowed list.

---

## 🔧 Solution Steps

### Fix 1: Update Backend CORS (Already Done in server.js)

The backend now includes:
```javascript
const allowedOrigins = [
  "https://zeyobron.netlify.app",  // ✅ Your Netlify frontend
  // ... other origins
];
```

### Fix 2: Push Backend Changes and Redeploy

```bash
cd /Users/saiganesh/Desktop/Qoder/netflix-clone/backend

# Check current changes
git status

# Commit CORS updates
git add server.js
git commit -m "Fix CORS: Add better logging and expose headers"
git push

# Render will auto-redeploy (takes 2-3 minutes)
```

### Fix 3: Verify Environment Variables on Render

1. Go to Render → Your backend service
2. Click **"Environment"** tab
3. Verify these exist:
   - `MONGO_URI` = `mongodb+srv://videostream:GANESH1436u@videostream.siwr7mx.mongodb.net/...`
   - `JWT_SECRET` = `Ganesh1436`
   - `CLIENT_URL` = `https://zeyobron.netlify.app`
   - `PORT` = `3001` (or leave empty for Render's default)

4. If `CLIENT_URL` is missing or wrong, add/update it
5. Click **"Save Changes"**
6. Backend will auto-redeploy

---

## 🧪 Test After Deploy

### Test 1: Health Check
```bash
curl https://hansitha-web-storefront.onrender.com/api/health
```

Should return JSON with `"status": "OK"`

### Test 2: Movies Endpoint
```bash
curl https://hansitha-web-storefront.onrender.com/api/movies
```

Should return array of movies (may be empty but should return 200, not 404)

### Test 3: CORS Headers
```bash
curl -H "Origin: https://zeyobron.netlify.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     -v \
     https://hansitha-web-storefront.onrender.com/api/movies
```

Should see in response headers:
```
Access-Control-Allow-Origin: https://zeyobron.netlify.app
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

---

## 🔍 Common Issues & Solutions

### Issue 1: Backend Returns 404 for All Routes

**Cause**: Backend might not be deployed or URL is wrong

**Solution**:
1. Check if backend service exists on Render
2. Verify the URL is correct
3. Check if backend is "Live" (green status)
4. If service is sleeping, make a request to wake it up

### Issue 2: CORS Error Persists After Update

**Cause**: Browser cache or backend not redeployed

**Solution**:
1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Open DevTools → Network tab → Disable cache
3. Verify backend redeployed successfully on Render
4. Check Render logs for CORS messages

### Issue 3: Works Locally but Not on Netlify

**Cause**: Environment variable mismatch

**Solution**:
1. On Netlify → Site settings → Environment variables
2. Verify `VITE_API_URL` = `https://hansitha-web-storefront.onrender.com/api`
3. **Important**: Must end with `/api` (no trailing slash)
4. Redeploy Netlify site after changing env vars

### Issue 4: MongoDB Connection Error

**Cause**: MongoDB Atlas network access

**Solution**:
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Network Access → Add IP Address
3. Select **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click Confirm
5. Wait 1-2 minutes for update
6. Redeploy backend on Render

---

## 📋 Complete Checklist

### Backend (Render):
- [ ] Service is deployed and shows "Live" status
- [ ] Logs show `🚀 Server running on port...`
- [ ] Logs show `MongoDB Connected`
- [ ] `/api/health` endpoint returns 200 OK
- [ ] `/api/movies` endpoint returns 200 (not 404)
- [ ] Environment variables are set correctly:
  - [ ] `MONGO_URI`
  - [ ] `JWT_SECRET`
  - [ ] `CLIENT_URL` = `https://zeyobron.netlify.app`
- [ ] Latest code with CORS fix is pushed
- [ ] Render auto-deployed after push

### Frontend (Netlify):
- [ ] Site is deployed and shows "Published"
- [ ] Environment variable set:
  - [ ] `VITE_API_URL` = `https://hansitha-web-storefront.onrender.com/api`
- [ ] No typos in backend URL
- [ ] URL ends with `/api` (no trailing slash)
- [ ] Redeployed after env var change

### MongoDB Atlas:
- [ ] Network Access allows `0.0.0.0/0`
- [ ] Database user has correct permissions
- [ ] Connection string in backend env is correct

---

## 🚀 Quick Fix Commands

### Check Backend Health:
```bash
curl https://hansitha-web-storefront.onrender.com/api/health
```

### Check Movies Endpoint:
```bash
curl https://hansitha-web-storefront.onrender.com/api/movies
```

### Check CORS:
```bash
curl -I -X OPTIONS \
  -H "Origin: https://zeyobron.netlify.app" \
  https://hansitha-web-storefront.onrender.com/api/movies
```

### Redeploy Backend (if needed):
```bash
cd backend
git add .
git commit -m "Fix CORS"
git push
```

### Trigger Netlify Redeploy:
```bash
cd frontend
git add .
git commit -m "Trigger redeploy" --allow-empty
git push
```

---

## 🎯 Expected Working State

### Request Flow:
1. User visits: `https://zeyobron.netlify.app`
2. React app loads
3. Frontend makes request: `https://hansitha-web-storefront.onrender.com/api/movies`
4. Backend checks origin: `https://zeyobron.netlify.app`
5. Backend finds it in `allowedOrigins` array
6. Backend responds with CORS headers
7. Browser allows the response
8. Data displays on frontend ✅

### Browser Network Tab Should Show:
```
Request URL: https://hansitha-web-storefront.onrender.com/api/movies
Status: 200 OK
Response Headers:
  Access-Control-Allow-Origin: https://zeyobron.netlify.app
  Access-Control-Allow-Credentials: true
  Content-Type: application/json
```

---

## 🆘 Still Not Working?

### Debug Steps:

1. **Check Backend Logs on Render:**
   - Look for CORS blocked messages
   - Check if requests are reaching the backend
   - Verify MongoDB connection

2. **Check Netlify Deploy Logs:**
   - Verify build succeeded
   - Check if env vars were injected

3. **Check Browser Console:**
   - Look for exact error message
   - Check Network tab for request details
   - See if request even reaches the backend

4. **Test with Postman:**
   - Send GET request to `https://hansitha-web-storefront.onrender.com/api/movies`
   - If works in Postman but not browser = CORS issue
   - If fails in Postman = backend issue

---

## 💡 Pro Tips

### Prevent Backend Sleep:
Use [cron-job.org](https://cron-job.org) to ping backend every 10 minutes:
- URL: `https://hansitha-web-storefront.onrender.com/api/health`
- Prevents free tier from sleeping

### Debug Mode:
Temporarily add to frontend (for debugging):
```javascript
// In Home.jsx or wherever API calls are made
console.log('API URL:', import.meta.env.VITE_API_URL);
```

Then check browser console to verify the URL is correct.

### Fast Redeploy:
On Render dashboard → Manual Deploy → "Clear build cache & deploy"

---

## ✅ Success Checklist

When everything works:
- [ ] No CORS errors in browser console
- [ ] Movies load on homepage
- [ ] Can login/signup
- [ ] Admin panel accessible
- [ ] Videos play correctly
- [ ] No 404 errors

---

**After following this guide, your CORS issue should be resolved!** 🎉

**Quick Summary:**
1. Push backend CORS fix
2. Verify `CLIENT_URL` on Render = `https://zeyobron.netlify.app`
3. Verify `VITE_API_URL` on Netlify = `https://hansitha-web-storefront.onrender.com/api`
4. Wait for both to redeploy
5. Clear browser cache
6. Test!
