# 🎬 Netflix Clone - Setup Guide

This guide will walk you through setting up and running the Netflix Clone application step by step.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Manual Setup](#manual-setup)
4. [MongoDB Setup Options](#mongodb-setup-options)
5. [Testing the Application](#testing-the-application)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

1. **Node.js** (v16 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **MongoDB** (Choose one option):
   - **Option A**: Local MongoDB
     - macOS: `brew install mongodb-community`
     - Windows: Download from https://www.mongodb.com/try/download/community
     - Linux: Follow official docs
   - **Option B**: MongoDB Atlas (Cloud - Free)
     - Sign up at: https://www.mongodb.com/cloud/atlas

### Optional Software
- **Git** - For version control
- **Postman** - For API testing

## Quick Start

### Option 1: Using Setup Script (Recommended)

```bash
# Navigate to project directory
cd netflix-clone

# Run the setup script
./setup.sh

# Start backend (Terminal 1)
cd backend
npm run dev

# Start frontend (Terminal 2)
cd frontend
npm run dev
```

### Option 2: Manual Setup

Follow the [Manual Setup](#manual-setup) section below.

## Manual Setup

### Step 1: Backend Setup

```bash
# Navigate to backend directory
cd netflix-clone/backend

# Install dependencies
npm install
```

### Step 2: Configure Environment Variables

The `.env` file is already created. Verify it contains:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/netflix-clone
JWT_SECRET=your_super_secret_jwt_key_change_in_production_12345
CLIENT_URL=http://localhost:5173
```

**Important Configuration Notes:**

- **MONGO_URI**: 
  - Local MongoDB: `mongodb://localhost:27017/netflix-clone`
  - MongoDB Atlas: `mongodb+srv://username:password@cluster.xxxxx.mongodb.net/netflix-clone`
  
- **JWT_SECRET**: Change this to a random string in production

### Step 3: Start MongoDB (if using local)

```bash
# macOS/Linux
mongod

# Windows
mongod.exe

# Or if installed via Homebrew (macOS)
brew services start mongodb-community
```

### Step 4: Seed the Database

```bash
# Still in backend directory
npm run seed
```

**Expected Output:**
```
Connected to MongoDB
Seed data created successfully!

Login credentials:
Admin - email: admin@netflix.com, password: admin123
User - email: user@netflix.com, password: user123
```

### Step 5: Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

**Expected Output:**
```
Server running on port 5000
MongoDB connected
```

### Step 6: Frontend Setup

Open a **new terminal window**:

```bash
# Navigate to frontend directory
cd netflix-clone/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 7: Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## MongoDB Setup Options

### Option A: Local MongoDB

1. **Install MongoDB:**
   ```bash
   # macOS
   brew tap mongodb/brew
   brew install mongodb-community
   
   # Ubuntu
   sudo apt-get install mongodb
   
   # Windows - Download installer from mongodb.com
   ```

2. **Start MongoDB:**
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows
   net start MongoDB
   ```

3. **Verify MongoDB is running:**
   ```bash
   # Should connect without errors
   mongosh
   ```

### Option B: MongoDB Atlas (Cloud)

1. **Create Account:**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free

2. **Create Cluster:**
   - Click "Build a Database"
   - Choose "FREE" tier
   - Select cloud provider and region
   - Click "Create"

3. **Configure Access:**
   - **Database Access**: Create a user with password
   - **Network Access**: Add your IP (or 0.0.0.0/0 for development)

4. **Get Connection String:**
   - Click "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database user password

5. **Update backend/.env:**
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/netflix-clone?retryWrites=true&w=majority
   ```

## Testing the Application

### 1. Test Login

**Admin Login:**
- Email: `admin@netflix.com`
- Password: `admin123`

**Regular User Login:**
- Email: `user@netflix.com`
- Password: `user123`

### 2. Test Features

#### Home Page
- [ ] View featured movies
- [ ] Browse by category
- [ ] Click on movie cards

#### Movie Page
- [ ] View movie details
- [ ] Play video (sample videos should load)
- [ ] Navigate back to home

#### Admin Dashboard (admin only)
- [ ] View movies list
- [ ] Add new movie
- [ ] Edit existing movie
- [ ] Delete movie
- [ ] View users list

### 3. Test API Endpoints (using curl or Postman)

```bash
# Get all movies
curl http://localhost:5000/api/movies

# Get featured movies
curl http://localhost:5000/api/movies?featured=true

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@netflix.com","password":"admin123"}'
```

## Troubleshooting

### MongoDB Connection Issues

**Error**: `MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`

**Solutions:**
1. Ensure MongoDB is running:
   ```bash
   # Check if mongod is running
   ps aux | grep mongod
   
   # Start MongoDB
   brew services start mongodb-community  # macOS
   sudo systemctl start mongod            # Linux
   ```

2. Check MongoDB URI in `.env`
3. For Atlas: Verify IP whitelist and credentials

### Port Already in Use

**Error**: `Port 5000 is already in use`

**Solution:**
```bash
# Find process using port
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change port in backend/.env
PORT=5001
```

### CORS Errors

**Error**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution:**
- Verify `CLIENT_URL` in `backend/.env` matches frontend URL
- Ensure both servers are running
- Clear browser cache

### Frontend Build Issues

**Error**: `Could not resolve "react"`

**Solution:**
```bash
# Delete node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Video Not Playing

**Possible Issues:**
1. **Invalid Video URL**: Ensure video URL is accessible
2. **Browser Compatibility**: Try different browser (Chrome recommended)
3. **CORS**: Video server must allow cross-origin requests

**Solution**: Use the sample videos provided in seed data (Google Cloud sample videos)

### JWT Authentication Errors

**Error**: `Token invalid` or `Not authorized`

**Solution:**
1. Check if `JWT_SECRET` is set in `backend/.env`
2. Clear localStorage in browser DevTools
3. Login again to get fresh token

### Database Seed Errors

**Error**: `E11000 duplicate key error`

**Solution:**
```bash
# Clear database and reseed
mongosh netflix-clone --eval "db.dropDatabase()"
npm run seed
```

## Advanced Configuration

### Using Custom MongoDB Database Name

In `backend/.env`:
```env
MONGO_URI=mongodb://localhost:27017/my-custom-db-name
```

### Changing Frontend Port

In `frontend/vite.config.js`:
```js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000  // Change to desired port
  }
});
```

Update `backend/.env`:
```env
CLIENT_URL=http://localhost:3000
```

### Production Deployment

1. **Backend:**
   - Set production MongoDB URI
   - Change `JWT_SECRET` to strong random string
   - Set `NODE_ENV=production`

2. **Frontend:**
   ```bash
   npm run build
   # Deploy dist/ folder to hosting service
   ```

## Next Steps

1. **Customize the app:**
   - Add your own movies
   - Change styling and branding
   - Add more features

2. **Enhance security:**
   - Implement password reset
   - Add email verification
   - Rate limiting

3. **Add features:**
   - User profiles
   - Watch history
   - Favorites/Watchlist
   - Movie ratings and reviews
   - Search functionality

## Getting Help

If you encounter issues not covered here:

1. Check the main [README.md](README.md)
2. Review error messages carefully
3. Check browser console (F12) for frontend errors
4. Check terminal output for backend errors

## Useful Commands Reference

```bash
# Backend
cd backend
npm install          # Install dependencies
npm run dev          # Start with auto-reload
npm start           # Start production server
npm run seed        # Seed database

# Frontend
cd frontend
npm install          # Install dependencies
npm run dev         # Start dev server
npm run build       # Build for production
npm run preview     # Preview production build

# MongoDB
mongod              # Start MongoDB server
mongosh             # MongoDB shell
brew services start mongodb-community  # macOS start service
```

---

**Happy Coding! 🎉**
