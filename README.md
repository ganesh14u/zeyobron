# 🎬 Zeyobron - Video Streaming Platform

A modern, full-stack video streaming platform built with the MERN stack (MongoDB, Express, React, Node.js). Features include user authentication, role-based access control, category-based subscriptions, and professional admin management.

![Tech Stack](https://img.shields.io/badge/React-18.2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

### 🎯 Core Features
- **User Authentication**: JWT-based secure login/signup with role-based access (Admin/User)
- **Category-Based Access**: Users subscribe to specific categories, not blanket premium access
- **Video Management**: Full CRUD operations with batch upload via CSV
- **Premium Badges**: Visual indicators for premium content
- **Subscription Types**: Free (1 category) and Premium (2+ categories)
- **Default Category Lock**: "Big Data Free" category is always assigned and locked

### 👤 User Features
- Browse videos by categories
- Watch YouTube and direct video URLs
- Profile management (name, phone, subscription status)
- Category-specific access control
- Premium content visibility with badges
- Live permission updates

### 🔧 Admin Features
- User management (view, edit, delete, toggle status)
- Video CRUD operations
- Bulk CSV upload with sample template download
- Category management
- Subscription management with auto-premium logic
- Search and filter by subscription type
- Professional notifications and confirmation dialogs

---

## 🛠️ Tech Stack

### Frontend
- **React 18.2** - UI library
- **Vite** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework
- **JWT Decode** - Token parsing

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB + Mongoose** - Database and ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **CSV Parser** - Bulk upload functionality

---

## 📁 Project Structure

```
netflix-clone/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── MovieCard.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Notification.jsx
│   │   │   └── ConfirmDialog.jsx
│   │   ├── pages/          # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Admin.jsx
│   │   │   └── MovieDetail.jsx
│   │   └── App.jsx         # Main app component
│   ├── .env                # Environment variables
│   ├── .env.production     # Production environment
│   ├── netlify.toml        # Netlify configuration
│   └── package.json
│
├── backend/                 # Node.js backend
│   ├── models/             # Mongoose models
│   │   ├── User.js
│   │   ├── Movie.js
│   │   └── Category.js
│   ├── routes/             # API routes
│   │   ├── auth.js
│   │   ├── movies.js
│   │   ├── categories.js
│   │   └── admin.js
│   ├── middleware/         # Custom middleware
│   │   └── authMiddleware.js
│   ├── seed/              # Database seeding
│   │   └── seed.js
│   ├── server.js          # Entry point
│   ├── .env               # Environment variables
│   ├── .env.example       # Environment template
│   └── package.json
│
├── DEPLOYMENT_GUIDE.md    # Deployment instructions
├── deploy.sh              # Deployment helper script
└── README.md              # This file
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ ([Download](https://nodejs.org))
- **MongoDB Atlas** account ([Sign up](https://www.mongodb.com/cloud/atlas))
- **Git** ([Download](https://git-scm.com))

### Installation

#### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd netflix-clone
```

#### 2. Setup Backend
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=3001
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
```

#### 3. Setup Frontend
```bash
cd ../frontend
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:3001/api" > .env
```

#### 4. Seed Database (Optional)
```bash
cd ../backend
npm run seed
```

This creates:
- Admin user: `admin@netflix.com` / `admin123`
- Regular user: `user@netflix.com` / `user123`
- Sample categories and videos

---

## 💻 Development

### Run Backend
```bash
cd backend
npm run dev
```
Backend runs on `http://localhost:3001`

### Run Frontend
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173`

### Access the App
1. Open browser to `http://localhost:5173`
2. Login with seeded credentials
3. Admin panel: `http://localhost:5173/admin`

---

## 🌐 Deployment

### Quick Start
```bash
./deploy.sh
```

### Manual Deployment

See **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for detailed instructions.

**Summary**:
1. **Backend** → Deploy to Render/Railway
2. **Frontend** → Deploy to Netlify
3. **Database** → MongoDB Atlas (already configured)

---

## 📊 Database Models

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  phone: String,
  password: String (required, hashed),
  role: String (default: 'user'),
  subscription: String (default: 'free'),
  subscribedCategories: [String] (default: ['Big Data Free']),
  isActive: Boolean (default: true)
}
```

### Movie Model
```javascript
{
  title: String (required),
  description: String,
  poster: String,
  videoUrl: String,
  videoType: String (youtube/direct),
  category: [String],
  batchNo: String,
  duration: String,
  featured: Boolean,
  isPremium: Boolean
}
```

### Category Model
```javascript
{
  name: String (required, unique),
  description: String,
  isPremium: Boolean (default: false)
}
```

---

## 🔐 Authentication & Authorization

### JWT Flow
1. User logs in with email/password
2. Backend validates credentials
3. JWT token generated and sent to client
4. Client stores token in localStorage
5. Token sent in Authorization header for protected routes

### Role-Based Access
- **User Role**: Browse videos, manage profile
- **Admin Role**: Full access to admin panel, user management, content management

### Category-Based Access
- Users are assigned specific categories
- Access is validated based on user's subscribed categories
- "Big Data Free" is the default locked category for all users

---

## 📝 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Movies
- `GET /api/movies` - Get all movies (with filters)
- `GET /api/movies/:id` - Get single movie

### Categories
- `GET /api/categories` - Get all categories (public)

### Admin Routes (Protected)
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/user/:id/subscription` - Update user subscription
- `DELETE /api/admin/user/:id` - Delete user
- `POST /api/admin/movie` - Create movie
- `PUT /api/admin/movie/:id` - Update movie
- `DELETE /api/admin/movie/:id` - Delete movie
- `POST /api/admin/movies/bulk-csv` - Bulk upload via CSV
- `GET /api/admin/movies/sample-csv` - Download sample CSV

---

## 🎨 Key Features Explained

### Auto Subscription Logic
- **1 Category**: Free subscription (dropdown enabled)
- **2+ Categories**: Auto-switches to Premium (dropdown disabled)

### Default Category Lock
- "Big Data Free" is assigned to all new users
- Cannot be removed (always locked with 🔒 icon)
- Ensures every user has at least one category

### Premium Badge System
- Shows 🔒 PREMIUM badge on inaccessible content
- Visible to both signed-out and free users
- Encourages conversion while showcasing catalog

### Professional UI Components
- **Notification Toasts**: Success, error, warning, info messages
- **Confirmation Modals**: Professional confirm dialogs
- **Click-Outside Close**: Dropdowns close when clicking outside

---

## 🐛 Troubleshooting

### Port 5000 Already in Use
**Problem**: macOS Control Center uses port 5000

**Solution**: Backend already configured to use port 3001
```env
PORT=3001
```

### MongoDB Connection Failed
**Problem**: Can't connect to MongoDB Atlas

**Solution**:
1. Check connection string in `.env`
2. Whitelist IP address in MongoDB Atlas Network Access
3. Verify username/password are correct

### Frontend Can't Fetch Data
**Problem**: CORS or 404 errors

**Solution**:
1. Verify backend is running on port 3001
2. Check `VITE_API_URL` in `frontend/.env`
3. Ensure `CLIENT_URL` in `backend/.env` matches frontend URL

---

## 📸 Screenshots

### Home Page
- Featured videos carousel
- Category sections with "Big Data Free" first
- Premium badges on inaccessible content

### Admin Panel
- User management with search and filters
- Video CRUD operations
- Category management
- Bulk CSV upload

### Profile Page
- User information display
- Subscription status
- Accessible categories list
- Edit name and phone

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Sai Ganesh**

---

## 🙏 Acknowledgments

- React team for the amazing library
- MongoDB team for the cloud database
- Tailwind CSS for the utility-first CSS framework
- Netlify and Render for free hosting tiers

---

## 📞 Support

For issues and questions:
1. Check the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. Review troubleshooting section above
3. Open an issue on GitHub

---

**Built with ❤️ using the MERN Stack**
# zeyobron
