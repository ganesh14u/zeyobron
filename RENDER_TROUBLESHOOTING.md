# Render Deployment Troubleshooting

## Common Issues and Solutions

### ❌ Error: ENOENT: no such file or directory, open '/opt/render/project/src/package.json'

**Problem**: Render is looking for package.json in the wrong directory

**Root Cause**: Render defaults to looking in a `src/` folder when the project structure isn't clear

**Solutions**:

#### Solution 1: Use render.yaml (Recommended)
The `render.yaml` file is already created in your backend folder. This tells Render exactly how to build and deploy your app.

1. Make sure `render.yaml` is committed to your Git repository
2. When creating service on Render, use **"Blueprint"** instead of **"Web Service"**
3. Render will automatically read the configuration

#### Solution 2: Specify Root Directory Manually
When creating the Web Service on Render:

1. In the service configuration, find **"Root Directory"** field
2. Leave it **empty** or set to `.` (dot)
3. This tells Render to use the repository root

#### Solution 3: Verify package.json Location
Make sure your `package.json` is in the **root** of your backend repository, not in a subdirectory.

```
backend/              ← Git repository root
├── package.json      ← Must be here!
├── server.js
├── models/
└── routes/
```

---

### ❌ Error: Build failed

**Problem**: Dependencies installation fails

**Solution**:
1. Check Render logs for specific error
2. Verify Node.js version is set to 18:
   - Add environment variable: `NODE_VERSION=18`
3. Ensure `package.json` has correct dependencies
4. Try clearing cache and redeploying

---

### ❌ Error: Application failed to start

**Problem**: Server starts but crashes immediately

**Common Causes**:

1. **Missing Environment Variables**
   - Verify all required env vars are set:
     - `MONGO_URI`
     - `JWT_SECRET`
     - `CLIENT_URL`
     - `PORT`

2. **MongoDB Connection Failed**
   - Check MongoDB Atlas connection string
   - Verify IP whitelist includes `0.0.0.0/0` (allow all)
   - Test connection string locally first

3. **Wrong Start Command**
   - Should be: `npm start`
   - Check `package.json` scripts section has:
     ```json
     "scripts": {
       "start": "node server.js"
     }
     ```

---

### ❌ Error: Port already in use

**Problem**: Another process using the port

**Solution**:
Render automatically assigns a port. Your code should use:
```javascript
const PORT = process.env.PORT || 3001;
```

This is already implemented in your `server.js`.

---

### ⚠️ Warning: Service is slow to respond

**Problem**: Free tier services sleep after 15 minutes of inactivity

**Solutions**:

1. **Accept the limitation** (it's free!)
   - First request after sleep takes ~30 seconds
   - Subsequent requests are fast

2. **Keep service awake** (Free option)
   - Use [cron-job.org](https://cron-job.org)
   - Create job to ping your backend every 10 minutes
   - URL: `https://your-backend.onrender.com/api/health`

3. **Upgrade to paid plan** ($7/month)
   - No sleeping
   - Better performance
   - More resources

---

### ❌ Error: CORS issues after deployment

**Problem**: Frontend can't connect to backend

**Solutions**:

1. **Check CLIENT_URL in backend**
   ```
   CLIENT_URL=https://your-frontend.netlify.app
   ```
   - Must match your Netlify URL exactly
   - No trailing slash

2. **Check VITE_API_URL in frontend**
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   ```
   - Must include `/api` at the end
   - No trailing slash after `/api`

3. **Verify CORS is enabled** (Already done in your code)
   ```javascript
   app.use(cors({ origin: process.env.CLIENT_URL }));
   ```

---

## Deployment Checklist

Before deploying to Render:

- [ ] `package.json` is in repository root
- [ ] `render.yaml` is committed to Git
- [ ] All code is pushed to GitHub
- [ ] MongoDB Atlas network access allows all IPs (0.0.0.0/0)
- [ ] Environment variables are prepared:
  - [ ] `NODE_VERSION=18`
  - [ ] `PORT=3001`
  - [ ] `MONGO_URI=your_connection_string`
  - [ ] `JWT_SECRET=your_secret`
  - [ ] `CLIENT_URL=https://your-frontend.netlify.app`

---

## Step-by-Step Fix for Current Error

### What You Need to Do Right Now:

1. **Make sure backend folder is the Git repository root**
   ```bash
   cd /Users/saiganesh/Desktop/Qoder/netflix-clone/backend
   
   # If not already initialized
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Verify render.yaml exists**
   ```bash
   ls -la render.yaml
   ```
   Should show: `render.yaml`

3. **Push to GitHub**
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/zeyobron-backend.git
   git push -u origin main
   ```

4. **Deploy on Render using Blueprint**
   - Go to Render Dashboard
   - Click **"New +"** → **"Blueprint"**
   - Select your repository
   - Render will detect `render.yaml` automatically
   - Add environment variables
   - Deploy!

---

## Alternative: Deploy Backend to Railway

If Render continues to give issues, try Railway.app:

1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select `zeyobron-backend`
5. Railway auto-detects Node.js
6. Add environment variables in Settings
7. Deploy automatically starts

**Advantages**:
- Simpler configuration
- No sleeping on free tier (500 hours/month)
- Better free tier performance

---

## Need More Help?

1. **Check Render Logs**
   - Go to your service on Render
   - Click "Logs" tab
   - Look for specific error messages

2. **Test Locally First**
   ```bash
   cd backend
   npm install
   npm start
   ```
   If it works locally, it should work on Render.

3. **Verify Environment Variables**
   - Print them in logs (don't commit this!)
   ```javascript
   console.log('Environment check:', {
     hasMongoUri: !!process.env.MONGO_URI,
     hasJwtSecret: !!process.env.JWT_SECRET,
     port: process.env.PORT
   });
   ```

---

## Success Indicators

You'll know deployment worked when:

✅ Build completes without errors  
✅ Service shows "Live" status (green)  
✅ Visiting your backend URL shows a response  
✅ Logs show "Server running on port..."  
✅ Frontend can make API calls successfully  

---

**Remember**: The free tier has limitations, but it's perfect for testing and small projects!
