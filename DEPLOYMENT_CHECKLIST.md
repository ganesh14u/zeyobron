# ✅ Zeyobron Deployment Checklist

Use this checklist to deploy your Zeyobron platform step-by-step.

---

## 🎯 Part 1: Backend Deployment (Render)

### Prerequisites
- [ ] MongoDB Atlas is set up and running
- [ ] GitHub account created
- [ ] Render account created (free)

### Step 1: Prepare Backend (5 minutes)
- [ ] Navigate to backend folder: `cd backend`
- [ ] Verify files exist:
  - [ ] `package.json` ✓
  - [ ] `server.js` ✓
  - [ ] `render.yaml` ✓ (newly created)
- [ ] Environment variables ready:
  - [ ] `MONGO_URI` - Your MongoDB connection string
  - [ ] `JWT_SECRET` - Your secret key
  - [ ] `CLIENT_URL` - Will update after frontend deploy

### Step 2: Push to GitHub (3 minutes)
- [ ] Initialize git: `git init`
- [ ] Add files: `git add .`
- [ ] Commit: `git commit -m "Initial commit"`
- [ ] Create repository on GitHub named `zeyobron-backend`
- [ ] Add remote: `git remote add origin https://github.com/YOUR_USERNAME/zeyobron-backend.git`
- [ ] Push: `git push -u origin main`

### Step 3: Deploy on Render (5 minutes)
- [ ] Go to [render.com](https://dashboard.render.com)
- [ ] Click **"New +"** → **"Blueprint"** (important!)
- [ ] Connect `zeyobron-backend` repository
- [ ] Render detects `render.yaml` automatically
- [ ] Add 3 environment variables:
  - [ ] `MONGO_URI`
  - [ ] `JWT_SECRET`
  - [ ] `CLIENT_URL` (use `http://localhost:5173` for now)
- [ ] Click **"Apply"**
- [ ] Wait for deployment ⏳ (5-10 minutes)

### Step 4: Verify Backend Works
- [ ] Status shows 🟢 **Live**
- [ ] Copy backend URL (e.g., `https://zeyobron-backend.onrender.com`)
- [ ] Test health endpoint: `https://YOUR_URL/api/health`
- [ ] Should return: `{"status":"OK",...}`
- [ ] Check logs show: `Server running on port 3001`

**✅ Backend Deployed!** Copy your backend URL: `________________________`

---

## 🎨 Part 2: Frontend Deployment (Netlify)

### Step 1: Update Frontend Environment (2 minutes)
- [ ] Open `frontend/.env.production`
- [ ] Update with your backend URL:
  ```
  VITE_API_URL=https://YOUR_BACKEND_URL/api
  ```
- [ ] Save file

### Step 2: Push Frontend to GitHub (3 minutes)
- [ ] Navigate to frontend: `cd ../frontend`
- [ ] Initialize git: `git init`
- [ ] Add files: `git add .`
- [ ] Commit: `git commit -m "Initial commit"`
- [ ] Create repository on GitHub named `zeyobron-frontend`
- [ ] Add remote: `git remote add origin https://github.com/YOUR_USERNAME/zeyobron-frontend.git`
- [ ] Push: `git push -u origin main`

### Step 3: Deploy on Netlify (5 minutes)
- [ ] Go to [netlify.com](https://app.netlify.com)
- [ ] Click **"Add new site"** → **"Import an existing project"**
- [ ] Choose **"Deploy with GitHub"**
- [ ] Select `zeyobron-frontend` repository
- [ ] Configure build settings:
  - [ ] Build command: `npm run build`
  - [ ] Publish directory: `dist`
- [ ] Add environment variable:
  - [ ] Key: `VITE_API_URL`
  - [ ] Value: `https://YOUR_BACKEND_URL/api`
- [ ] Click **"Deploy site"**
- [ ] Wait for deployment ⏳ (3-5 minutes)

### Step 4: Verify Frontend Works
- [ ] Status shows **Published**
- [ ] Copy frontend URL (e.g., `https://zeyobron.netlify.app`)
- [ ] Visit the URL
- [ ] Homepage loads ✓
- [ ] Videos are visible ✓

**✅ Frontend Deployed!** Copy your frontend URL: `________________________`

---

## 🔗 Part 3: Connect Frontend & Backend

### Update Backend CORS (2 minutes)
- [ ] Go to Render dashboard → Your backend service
- [ ] Click **"Environment"** tab
- [ ] Update `CLIENT_URL` to your Netlify URL
- [ ] Example: `https://zeyobron.netlify.app`
- [ ] Click **"Save Changes"**
- [ ] Service will auto-redeploy ⏳ (2-3 minutes)

### Update MongoDB Access (2 minutes)
- [ ] Go to [MongoDB Atlas](https://cloud.mongodb.com)
- [ ] Click **"Network Access"** (left sidebar)
- [ ] Click **"Add IP Address"**
- [ ] Select **"Allow Access from Anywhere"** (0.0.0.0/0)
- [ ] Click **"Confirm"**

---

## 🧪 Part 4: Testing

### Test Complete Flow
- [ ] Visit your Netlify URL
- [ ] Sign up with a new account
- [ ] Default category "Big Data Free" is assigned ✓
- [ ] Browse videos
- [ ] Click on a video to play
- [ ] Video plays successfully ✓

### Test Admin Panel
- [ ] Login as admin:
  - Email: `admin@netflix.com`
  - Password: `admin123`
- [ ] Go to Admin panel
- [ ] View users ✓
- [ ] View videos ✓
- [ ] Try adding a new video ✓
- [ ] Try managing user subscription ✓

### Test Authentication
- [ ] Logout
- [ ] Login again
- [ ] Token persists ✓
- [ ] Profile page shows correct info ✓

**✅ All Tests Passed!**

---

## 🎉 Deployment Complete!

Your Zeyobron platform is now live!

### Your URLs:
- **Frontend**: `________________________`
- **Backend**: `________________________`
- **Admin Login**: Email: `admin@netflix.com`, Password: `admin123`

### Share With Users:
```
🎬 Zeyobron Video Platform
URL: https://your-frontend.netlify.app

Free Account Access:
- Browse all videos
- Watch "Big Data Free" category

Premium Features:
- Access to all categories
- Multiple category subscriptions
```

---

## 📊 Post-Deployment

### Optional: Prevent Backend Sleep (Free Tier)
- [ ] Go to [cron-job.org](https://cron-job.org)
- [ ] Create free account
- [ ] Create new cron job:
  - [ ] Title: "Keep Zeyobron Backend Awake"
  - [ ] URL: `https://YOUR_BACKEND_URL/api/health`
  - [ ] Schedule: Every 10 minutes
  - [ ] Save

### Optional: Custom Domain (Netlify)
- [ ] Buy domain (e.g., from Namecheap)
- [ ] In Netlify: Site settings → Domain management
- [ ] Add custom domain
- [ ] Update DNS records
- [ ] SSL certificate auto-generates

### Optional: Change Admin Password
- [ ] Login as admin
- [ ] Go to Profile
- [ ] Change password from default `admin123`
- [ ] Use strong password

---

## 🔧 Maintenance

### Update Backend:
```bash
cd backend
# Make changes
git add .
git commit -m "Update backend"
git push
```
Render auto-deploys on push ✓

### Update Frontend:
```bash
cd frontend
# Make changes
git add .
git commit -m "Update frontend"
git push
```
Netlify auto-deploys on push ✓

### View Logs:
- **Render**: Dashboard → Logs tab
- **Netlify**: Site → Deploys → Deploy log
- **MongoDB**: Atlas → Metrics

---

## 🆘 Troubleshooting

If something doesn't work:

1. **Backend Issues**:
   - [ ] Check Render logs for errors
   - [ ] Verify all environment variables are set
   - [ ] Test `/api/health` endpoint

2. **Frontend Issues**:
   - [ ] Check browser console for errors
   - [ ] Verify `VITE_API_URL` is correct
   - [ ] Test API calls in Network tab

3. **CORS Errors**:
   - [ ] Verify `CLIENT_URL` matches Netlify URL exactly
   - [ ] No trailing slashes in URLs
   - [ ] Redeploy backend after changing `CLIENT_URL`

4. **MongoDB Errors**:
   - [ ] Check network access allows `0.0.0.0/0`
   - [ ] Verify connection string is correct
   - [ ] Test connection locally first

**See [RENDER_TROUBLESHOOTING.md](./RENDER_TROUBLESHOOTING.md) for detailed solutions**

---

## 📈 Cost Summary

- ✅ Netlify: **$0/month** (Free tier: 100GB bandwidth)
- ✅ Render: **$0/month** (Free tier: 750 hours, sleeps after 15 min)
- ✅ MongoDB Atlas: **$0/month** (Free tier: 512MB storage)

**Total**: **$0/month** for free tier 🎉

### Upgrade Options (Optional):
- Netlify Pro: $19/month (better performance, analytics)
- Render Starter: $7/month (no sleeping, better resources)
- MongoDB M10: $9/month (more storage, backups)

---

**Congratulations! Your streaming platform is live! 🚀**
