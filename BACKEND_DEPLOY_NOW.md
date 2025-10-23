# 🚨 CRITICAL: Deploy Backend Separately

## Problem Identified:
`https://hansitha-web-storefront.onrender.com` is serving your **FRONTEND**, not backend!

That's why you get 404 for `/api/` routes - there is no backend API running.

---

## ✅ Solution: Deploy Backend as Separate Service

### Step 1: Create Backend GitHub Repository (5 minutes)

```bash
cd /Users/saiganesh/Desktop/Qoder/netflix-clone/backend

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial backend deployment"

# Create repo on GitHub
# Go to github.com → New repository → Name: "zeyobron-backend"
# Then run:
git remote add origin https://github.com/YOUR_USERNAME/zeyobron-backend.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Backend on Render (5 minutes)

1. **Go to Render Dashboard**: https://dashboard.render.com

2. **Click "New +"** → **"Web Service"**

3. **Connect Repository**: Select `zeyobron-backend`

4. **Configure Service**:
   - **Name**: `zeyobron-backend` (IMPORTANT: Different from frontend!)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

5. **Add Environment Variables**:
   ```
   MONGO_URI=mongodb+srv://videostream:GANESH1436u@videostream.siwr7mx.mongodb.net/?retryWrites=true&w=majority&appName=VideoStream
   JWT_SECRET=Ganesh1436
   CLIENT_URL=https://zeyobron.netlify.app
   NODE_ENV=production
   ```

6. **Click "Create Web Service"**

7. **Wait for Deployment** (~5 minutes)

8. **Copy Backend URL** (e.g., `https://zeyobron-backend.onrender.com`)

---

### Step 3: Update Frontend to Use New Backend URL

1. **On Netlify**:
   - Go to Site settings → Environment variables
   - Update `VITE_API_URL`:
     ```
     VITE_API_URL=https://zeyobron-backend.onrender.com/api
     ```
   - Save changes
   - Trigger redeploy

2. **Or Update Local .env.production**:
   ```bash
   cd /Users/saiganesh/Desktop/Qoder/netflix-clone/frontend
   ```
   
   Edit `.env.production`:
   ```
   VITE_API_URL=https://zeyobron-backend.onrender.com/api
   ```
   
   Then push:
   ```bash
   git add .env.production
   git commit -m "Update backend URL"
   git push
   ```

---

### Step 4: Update Backend CORS

Once backend deploys, update CORS in backend:

1. Go to Render → Backend service → Environment
2. Update `CLIENT_URL`:
   ```
   CLIENT_URL=https://zeyobron.netlify.app
   ```
3. Save and redeploy

---

## 🧪 Verify Backend Works

After backend deploys, test:

```bash
# Replace with YOUR backend URL from Render
curl https://zeyobron-backend.onrender.com/api/health
```

**Should return:**
```json
{
  "status": "OK",
  "message": "Zeyobron Backend is running",
  ...
}
```

---

## 📊 Your Services Setup

After completing above:

| Service | Platform | URL | Purpose |
|---------|----------|-----|---------|
| **Backend API** | Render Web Service | `https://zeyobron-backend.onrender.com` | Node.js + Express API |
| **Frontend** | Netlify (or Render Static) | `https://zeyobron.netlify.app` | React App |
| **Database** | MongoDB Atlas | Cloud | MongoDB Database |

---

## ⚠️ Current Wrong Setup

What you have now:
- `https://hansitha-web-storefront.onrender.com` → **Frontend React app**
- NO backend deployed ❌

What you need:
- `https://zeyobron-backend.onrender.com` → **Backend API** ✅
- `https://zeyobron.netlify.app` → **Frontend React app** ✅

---

## 🚀 Quick Commands

```bash
# 1. Deploy backend
cd /Users/saiganesh/Desktop/Qoder/netflix-clone/backend
git init
git add .
git commit -m "Deploy backend"
# Create GitHub repo, then:
git remote add origin https://github.com/YOUR_USERNAME/zeyobron-backend.git
git push -u origin main

# 2. On Render: Create Web Service from this repo

# 3. Test backend (replace with your URL)
curl https://YOUR-BACKEND-URL.onrender.com/api/health

# 4. Update frontend env var on Netlify with new backend URL
```

---

## ✅ Success Checklist

- [ ] Backend code pushed to GitHub (separate repo)
- [ ] Backend deployed on Render as Web Service
- [ ] Backend shows "Live" status
- [ ] `/api/health` returns 200 OK (not 404)
- [ ] Frontend `VITE_API_URL` updated to new backend URL
- [ ] Frontend redeployed on Netlify
- [ ] Backend `CLIENT_URL` set to frontend URL
- [ ] Test: Movies load on Netlify frontend

---

## 💡 Why This Happened

You deployed the frontend to `hansitha-web-storefront.onrender.com` but never deployed the backend!

The backend needs to be a **separate Render service** (Web Service, not Static Site) because:
- Backend runs Node.js/Express server
- Frontend is static HTML/CSS/JS files
- They require different deployment types

---

## 🎯 Timeline

- **Now**: Push backend to GitHub (5 min)
- **+5 min**: Create Render Web Service for backend
- **+10 min**: Backend deploys successfully
- **+11 min**: Update Netlify env var
- **+14 min**: Frontend redeploys
- **+15 min**: ✅ **EVERYTHING WORKS!**

---

**START NOW**: Create the backend GitHub repo and deploy to Render as a Web Service!
