# Netflix Clone - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                          │
│                     http://localhost:5173                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/HTTPS
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      REACT FRONTEND                             │
│                     (Vite + Tailwind)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │    Home      │  │    Movie     │  │    Admin     │         │
│  │    Page      │  │    Page      │  │  Dashboard   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │   Navbar     │  │  MovieCard   │                           │
│  └──────────────┘  └──────────────┘                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Axios API Calls
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    EXPRESS BACKEND                              │
│                  http://localhost:5000                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    API Routes                           │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐          │   │
│  │  │   /auth   │  │  /movies  │  │  /admin   │          │   │
│  │  │           │  │           │  │           │          │   │
│  │  │ - signup  │  │ - GET all │  │ - POST    │          │   │
│  │  │ - login   │  │ - GET :id │  │ - PUT     │          │   │
│  │  │           │  │ - filter  │  │ - DELETE  │          │   │
│  │  └───────────┘  └───────────┘  └───────────┘          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│  ┌─────────────────────────▼───────────────────────────────┐   │
│  │              Middleware                                 │   │
│  │  ┌───────────┐  ┌───────────┐                          │   │
│  │  │  protect  │  │ adminOnly │                          │   │
│  │  │  (JWT)    │  │  (Role)   │                          │   │
│  │  └───────────┘  └───────────┘                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Mongoose ODM
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      MongoDB DATABASE                           │
│                 mongodb://localhost:27017                       │
│                                                                 │
│  ┌─────────────────────┐      ┌─────────────────────┐         │
│  │   Users Collection  │      │  Movies Collection  │         │
│  ├─────────────────────┤      ├─────────────────────┤         │
│  │ - _id               │      │ - _id               │         │
│  │ - name              │      │ - title             │         │
│  │ - email (unique)    │      │ - description       │         │
│  │ - password (hash)   │      │ - poster            │         │
│  │ - role (user/admin) │      │ - videoUrl          │         │
│  │ - createdAt         │      │ - category[]        │         │
│  │                     │      │ - year              │         │
│  │                     │      │ - duration          │         │
│  │                     │      │ - featured          │         │
│  │                     │      │ - createdAt         │         │
│  └─────────────────────┘      └─────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flow

### 1. Public Movie Request
```
Browser → GET /api/movies → Express → MongoDB → Response
```

### 2. Login Flow
```
Browser → POST /api/auth/login 
        ↓
     Express validates credentials
        ↓
     Generate JWT token
        ↓
     Return token + user data
        ↓
     Browser stores in localStorage
```

### 3. Protected Admin Request
```
Browser → POST /api/admin/movie + JWT token
        ↓
     Express → protect middleware
        ↓
     Verify JWT token
        ↓
     Load user from DB
        ↓
     adminOnly middleware
        ↓
     Check user role === 'admin'
        ↓
     Process request → MongoDB
        ↓
     Return response
```

## Component Hierarchy

```
App
├── Navbar
│   └── Login/Logout buttons
│
├── Routes
    ├── Home
    │   └── MovieCard (multiple)
    │
    ├── Movie
    │   └── Video Player
    │
    └── Admin
        ├── Movie Form
        ├── Movies Table
        └── Users Table
```

## Data Flow

### Frontend State Management
```
Component State (useState)
        ↓
     API Call (axios)
        ↓
     Update State
        ↓
     Re-render UI
```

### Authentication State
```
localStorage
    ↓
  { token, user }
    ↓
  axios interceptor
    ↓
  Authorization header
```

## File Dependencies

### Backend Dependencies
```
server.js
    ├── config/db.js (MongoDB connection)
    ├── routes/auth.js
    │   └── models/User.js
    ├── routes/movies.js
    │   └── models/Movie.js
    └── routes/admin.js
        ├── models/Movie.js
        ├── models/User.js
        └── middleware/auth.js
```

### Frontend Dependencies
```
main.jsx
    └── App.jsx
        ├── components/Navbar.jsx
        ├── components/MovieCard.jsx
        ├── pages/Home.jsx
        │   └── components/MovieCard.jsx
        ├── pages/Movie.jsx
        └── pages/Admin.jsx
```

## Security Layers

```
┌─────────────────────────────────────┐
│   1. Password Hashing (bcrypt)      │
└─────────────────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│   2. JWT Token Generation           │
└─────────────────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│   3. Token Verification (middleware)│
└─────────────────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│   4. Role-Based Access Control      │
└─────────────────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│   5. CORS Policy                    │
└─────────────────────────────────────┘
```

## API Endpoint Map

```
/api
├── /auth
│   ├── POST /signup
│   └── POST /login
│
├── /movies (public)
│   ├── GET /
│   ├── GET /:id
│   ├── GET /?featured=true
│   └── GET /?category=Action
│
└── /admin (protected)
    ├── POST /movie
    ├── PUT /movie/:id
    ├── DELETE /movie/:id
    └── GET /users
```

## Technology Stack Visual

```
┌─────────────────────────────────────────┐
│           FRONTEND LAYER                │
├─────────────────────────────────────────┤
│  React 18  │  Vite  │  Tailwind CSS    │
│  React Router  │  Axios  │  jwt-decode │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│           BACKEND LAYER                 │
├─────────────────────────────────────────┤
│  Node.js  │  Express  │  JWT           │
│  bcryptjs │  cors  │  dotenv          │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│          DATABASE LAYER                 │
├─────────────────────────────────────────┤
│       MongoDB  │  Mongoose              │
└─────────────────────────────────────────┘
```

## Development vs Production

### Development
```
Frontend: localhost:5173 (Vite Dev Server)
Backend:  localhost:5000 (nodemon)
Database: localhost:27017 (Local MongoDB)
```

### Production
```
Frontend: Vercel/Netlify (Static Build)
Backend:  Heroku/Railway/Render
Database: MongoDB Atlas (Cloud)
```

## Key Features Map

```
Netflix Clone
├── Authentication
│   ├── User Registration
│   ├── User Login
│   └── JWT Sessions
│
├── Movie Browsing
│   ├── Featured Section
│   ├── Category Filtering
│   └── Movie Details
│
├── Video Playback
│   ├── HTML5 Player
│   └── HLS/MP4 Support
│
└── Admin Dashboard
    ├── Movie CRUD
    ├── User Management
    └── Role-Based Access
```
