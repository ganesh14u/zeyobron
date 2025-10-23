# Zeyobron Deployment Guide

This guide will help you deploy the Zeyobron video streaming platform to production.

## Architecture Overview

- **Frontend**: React + Vite → Deploy to **Netlify**
- **Backend**: Node.js + Express → Deploy to **Render** (recommended) or Railway/Heroku
- **Database**: MongoDB Atlas (already configured)

---

## Part 1: Deploy Backend to Render

### Step 1: Prepare Backend for Deployment

✅ Already done:
- `.gitignore` created
- `.env.example` created
- MongoDB Atlas is configured

### Step 2: Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository named `zeyobron-backend`
2. Initialize git in backend folder:

```bash
cd backend
git init
git add .
git commit -m "Initial commit - Zeyobron backend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/zeyobron-backend.git
git push -u origin main
```

### Step 3: Deploy on Render

1. Go to [Render.com](https://render.com) and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository `zeyobron-backend`
4. Configure the service:
   - **Name**: `zeyobron-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Add Environment Variables (click "Advanced"):
   ```
   PORT=3001
   MONGO_URI=mongodb+srv://videostream:GANESH1436u@videostream.siwr7mx.mongodb.net/?retryWrites=true&w=majority&appName=VideoStream
   JWT_SECRET=Ganesh1436
   CLIENT_URL=https://your-frontend.netlify.app
   ```
   
   ⚠️ **Important**: You'll update `CLIENT_URL` after deploying frontend

6. Click **"Create Web Service"**

7. Wait for deployment to complete (5-10 minutes)

8. Copy your backend URL (e.g., `https://zeyobron-backend.onrender.com`)

---

## Part 2: Deploy Frontend to Netlify

### Step 1: Update Frontend Environment Variable

1. Create/update `frontend/.env.production`:

```bash
VITE_API_URL=https://zeyobron-backend.onrender.com/api
```

Replace with your actual Render backend URL from Part 1, Step 8.

### Step 2: Create GitHub Repository for Frontend

```bash
cd frontend
git init
git add .
git commit -m "Initial commit - Zeyobron frontend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/zeyobron-frontend.git
git push -u origin main
```

### Step 3: Deploy on Netlify

#### Option A: Via GitHub (Recommended)

1. Go to [Netlify](https://app.netlify.com) and sign up/login
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"Deploy with GitHub"**
4. Select `zeyobron-frontend` repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Environment variables**: 
     - `VITE_API_URL` = `https://zeyobron-backend.onrender.com/api`

6. Click **"Deploy site"**

#### Option B: Via Netlify CLI (Alternative)

```bash
cd frontend
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### Step 4: Update Backend CORS Settings

Once your frontend is deployed, copy the Netlify URL (e.g., `https://zeyobron.netlify.app`)

1. Go back to **Render Dashboard** → Your backend service
2. Update environment variable:
   - `CLIENT_URL` = `https://zeyobron.netlify.app`
3. Save and redeploy

---

## Part 3: Post-Deployment Configuration

### Update MongoDB Network Access

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Navigate to **Network Access**
3. Click **"Add IP Address"**
4. Select **"Allow Access from Anywhere"** (0.0.0.0/0)
5. Click **"Confirm"**

⚠️ **Security Note**: For production, consider restricting to specific IP addresses.

### Test Your Deployment

1. Visit your Netlify URL: `https://zeyobron.netlify.app`
2. Try signing in with:
   - Email: `admin@netflix.com`
   - Password: `admin123`
3. Test video playback, admin panel, and user management

---

## Troubleshooting

### Frontend can't connect to backend

**Problem**: CORS errors or 404 on API calls

**Solution**:
1. Verify `VITE_API_URL` in Netlify environment variables
2. Check `CLIENT_URL` in Render environment variables
3. Ensure both URLs don't have trailing slashes

### Backend deployment fails

**Problem**: Build or start command errors

**Solution**:
1. Check Render logs for specific errors
2. Verify `package.json` has correct start script
3. Ensure MongoDB connection string is correct

### Videos not playing

**Problem**: YouTube videos show errors

**Solution**:
1. Verify video URLs are accessible
2. Check browser console for specific errors
3. Ensure JWT tokens are being sent correctly

---

## Environment Variables Summary

### Backend (Render)
```
PORT=3001
MONGO_URI=mongodb+srv://videostream:GANESH1436u@videostream.siwr7mx.mongodb.net/?retryWrites=true&w=majority&appName=VideoStream
JWT_SECRET=Ganesh1436
CLIENT_URL=https://your-frontend.netlify.app
```

### Frontend (Netlify)
```
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## Alternative Backend Hosting Options

### Railway.app
- Similar to Render
- Better performance on free tier
- Deployment: Connect GitHub → Deploy

### Heroku
- Requires credit card for free tier
- More complex setup
- Good documentation

### Vercel (with Serverless Functions)
- Can host both frontend and backend
- Requires adapting Express to serverless
- More complex but single platform

---

## Maintenance

### Updating Your App

**Frontend**:
```bash
cd frontend
git add .
git commit -m "Update frontend"
git push
```
Netlify will auto-deploy on push.

**Backend**:
```bash
cd backend
git add .
git commit -m "Update backend"
git push
```
Render will auto-deploy on push.

### Monitoring

- **Netlify**: Check Analytics and Deploy logs
- **Render**: Check Metrics and Logs tabs
- **MongoDB Atlas**: Monitor database performance in Charts

---

## Security Recommendations

1. ✅ Change default admin password
2. ✅ Use strong JWT_SECRET (random 64-character string)
3. ✅ Enable HTTPS (automatic on Netlify/Render)
4. ✅ Restrict MongoDB network access
5. ⚠️ Consider adding rate limiting to backend
6. ⚠️ Implement proper error logging (e.g., Sentry)

---

## Cost Estimate

- **Netlify**: Free tier (100GB bandwidth/month)
- **Render**: Free tier (750 hours/month, sleeps after inactivity)
- **MongoDB Atlas**: Free tier (512MB storage)

**Total**: $0/month for free tier 🎉

**Note**: Render free tier services sleep after 15 minutes of inactivity. First request after sleep takes ~30 seconds.

---

## Need Help?

Common issues and solutions:
- Backend sleeping: Upgrade to paid plan or use cron-job.org to ping every 10 minutes
- Slow performance: Consider upgrading to paid tiers
- CORS issues: Double-check environment variable URLs

---

**Congratulations!** 🎉 Your Zeyobron platform is now live!
