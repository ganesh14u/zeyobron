# 🚀 Deploy Frontend to Render

Since you're deploying both frontend and backend on Render, follow this guide.

## ✅ Fixed Issues

1. **Moved Vite to dependencies** - Now installs in production
2. **Created render.yaml** - Proper static site configuration

---

## 📋 Deployment Steps

### Step 1: Verify Files (Already Done!)

The following files are now ready:
- ✅ `frontend/package.json` - Vite moved to dependencies
- ✅ `frontend/render.yaml` - Render configuration
- ✅ `frontend/netlify.toml` - Alternative Netlify config

### Step 2: Push Frontend to GitHub

```bash
cd /Users/saiganesh/Desktop/Qoder/netflix-clone/frontend

# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Add Render deployment configuration"

# Create repository on GitHub named 'zeyobron-frontend'
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/zeyobron-frontend.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Render

#### Option A: Static Site (Recommended for Frontend)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Static Site"**
3. Connect your repository `zeyobron-frontend`
4. Render will auto-detect the configuration
5. Configure:
   - **Name**: `zeyobron-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
6. Add Environment Variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend.onrender.com/api`
7. Click **"Create Static Site"**
8. Wait for deployment (3-5 minutes)

#### Option B: Using Blueprint

1. Click **"New +"** → **"Blueprint"**
2. Connect repository
3. Render detects `render.yaml`
4. Add `VITE_API_URL` environment variable
5. Deploy

### Step 4: Update Backend CORS

Once frontend deploys, copy the URL (e.g., `https://zeyobron-frontend.onrender.com`)

1. Go to backend service on Render
2. Go to **Environment** tab
3. Find or add `CLIENT_URL`
4. Set value to your frontend URL
5. Save and redeploy backend

---

## 🎯 Important Notes

### Environment Variable

Make sure to set on Render:
```
VITE_API_URL=https://your-backend.onrender.com/api
```

Replace with your actual backend URL from the backend deployment.

### Build Output

Vite builds to `dist/` folder, which is already configured in `render.yaml`.

### Routing

The `render.yaml` includes SPA routing:
```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

This ensures React Router works correctly.

---

## 🔄 Alternative: Use Netlify Instead

If you prefer Netlify for frontend (easier for static sites):

### Why Netlify for Frontend?
- ✅ Better for static sites (React)
- ✅ Faster deployment
- ✅ Better CDN
- ✅ More generous free tier for static sites
- ✅ Automatic HTTPS

### Deploy to Netlify:

```bash
cd frontend
npm install -g netlify-cli
netlify login
netlify init
# Follow prompts
netlify deploy --prod
```

Or use the Netlify UI:
1. Go to [app.netlify.com](https://app.netlify.com)
2. Drag and drop the `dist` folder after running `npm run build`
3. Or connect GitHub repository

---

## 🧪 Testing After Deployment

### Test Frontend:
1. Visit your Render/Netlify URL
2. Homepage should load
3. Check browser console for errors
4. Try logging in

### Test API Connection:
1. Open browser DevTools → Network tab
2. Login or browse videos
3. Check API calls go to correct backend URL
4. Verify no CORS errors

### Test Admin Panel:
1. Login as admin: `admin@netflix.com` / `admin123`
2. Go to `/admin`
3. Verify all features work

---

## 🐛 Troubleshooting

### Error: "vite: not found"
**Solution**: Already fixed! Vite is now in `dependencies`, not `devDependencies`.

### Error: Build fails with "Cannot find module"
**Solution**: 
```bash
# Delete node_modules and reinstall locally to test
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
# If it works locally, commit and push
```

### Error: "Blank page after deployment"
**Solution**:
1. Check browser console for errors
2. Verify `VITE_API_URL` is set correctly
3. Check Network tab for failed API calls
4. Ensure backend URL is correct

### Error: CORS issues
**Solution**:
1. Backend `CLIENT_URL` must match frontend URL exactly
2. No trailing slashes
3. Must be HTTPS (Render provides this automatically)

---

## 📊 Deployment Summary

### Your Setup:
- **Backend**: Render Web Service (Node.js)
- **Frontend**: Render Static Site (React) OR Netlify
- **Database**: MongoDB Atlas

### URLs After Deployment:
- **Frontend**: `https://zeyobron-frontend.onrender.com` or `https://zeyobron.netlify.app`
- **Backend**: `https://hansitha-web-storefront.onrender.com`
- **API**: `https://hansitha-web-storefront.onrender.com/api`

---

## ✅ Checklist

- [ ] Frontend package.json updated (Vite in dependencies)
- [ ] Frontend pushed to GitHub
- [ ] Render Static Site created
- [ ] `VITE_API_URL` environment variable set
- [ ] Frontend deploys successfully
- [ ] Backend `CLIENT_URL` updated with frontend URL
- [ ] Backend redeployed
- [ ] Test login works
- [ ] Test video playback works
- [ ] Test admin panel works

---

## 🎉 Success!

Once deployed:
1. Visit your frontend URL
2. Everything should work!
3. Share with users

**Cost**: Still $0/month on free tier! 🎊

---

## 💡 Pro Tips

### Keep Services Awake (Free):
Use [cron-job.org](https://cron-job.org) to ping both services every 10 minutes:
- Backend: `https://your-backend.onrender.com/api/health`
- Frontend: `https://your-frontend.onrender.com`

### Auto Deploy on Push:
Both services auto-deploy when you push to GitHub main branch.

### View Logs:
- Render Dashboard → Your service → Logs tab
- See build and runtime logs

---

**Questions?** Check the main DEPLOYMENT_GUIDE.md or RENDER_TROUBLESHOOTING.md
