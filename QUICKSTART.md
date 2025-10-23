# 🎬 Netflix Clone - Quick Start

Get up and running in 5 minutes!

## Prerequisites Check

```bash
node --version   # Should be v16+
npm --version    # Should be 8+
mongod --version # Should be installed (or use MongoDB Atlas)
```

## Installation

### 1. Backend Setup (2 minutes)

```bash
# Navigate to backend
cd netflix-clone/backend

# Install dependencies
npm install

# The .env file is already configured!
# For MongoDB Atlas, update MONGO_URI in .env

# Seed database with sample data
npm run seed
```

### 2. Frontend Setup (2 minutes)

```bash
# Open new terminal
cd netflix-clone/frontend

# Install dependencies
npm install
```

## Running the Application

### Start Backend (Terminal 1)
```bash
cd backend
npm run dev
```
✅ Backend running at: http://localhost:5000

### Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```
✅ Frontend running at: http://localhost:5173

## Test It Out!

1. **Open browser**: http://localhost:5173

2. **Login as Admin**:
   - Click "Sign in"
   - Email: `admin@netflix.com`
   - Password: `admin123`

3. **Test Features**:
   - Browse movies on home page
   - Click any movie to watch
   - Go to "Admin" dashboard to add/edit movies

## Default Credentials

**Admin Account**:
- Email: `admin@netflix.com`
- Password: `admin123`

**User Account**:
- Email: `user@netflix.com`
- Password: `user123`

## Common Issues

### MongoDB not running?
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Or use MongoDB Atlas (cloud)
```

### Port already in use?
```bash
# Change port in backend/.env
PORT=5001
```

### Can't see movies?
```bash
# Reseed the database
cd backend
npm run seed
```

## Next Steps

- ✅ Browse movies on home page
- ✅ Login as admin to access dashboard
- ✅ Add your own movies via admin panel
- ✅ Customize the design in Tailwind CSS
- ✅ Check [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed setup
- ✅ Check [README.md](README.md) for full documentation

## File Structure at a Glance

```
netflix-clone/
├── backend/           # Node.js + Express API
│   ├── server.js     # Main server
│   ├── routes/       # API endpoints
│   ├── models/       # Database schemas
│   └── seed/         # Sample data
│
├── frontend/          # React + Vite app
│   └── src/
│       ├── pages/    # Home, Movie, Admin
│       └── components/ # Reusable UI
│
└── README.md         # Full documentation
```

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (JSON Web Tokens)

## URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Admin Dashboard**: http://localhost:5173/admin

## Need Help?

- 📖 Read [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions
- 📋 Check [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for architecture details
- 🐛 See Troubleshooting section in SETUP_GUIDE.md

---

**Happy Coding! 🚀**

Made with ❤️ using MERN Stack
