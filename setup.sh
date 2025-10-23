#!/bin/bash

echo "🎬 Netflix Clone - Quick Setup Script"
echo "======================================"
echo ""

# Check if MongoDB is running
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not found. Please ensure MongoDB is installed and running."
    echo "   You can also use MongoDB Atlas (cloud) instead."
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Backend setup
echo "📦 Setting up Backend..."
cd backend
npm install
echo "✅ Backend dependencies installed"
echo ""

echo "🌱 Seeding database with sample data..."
npm run seed
echo "✅ Database seeded"
echo ""

# Frontend setup
echo "📦 Setting up Frontend..."
cd ../frontend
npm install
echo "✅ Frontend dependencies installed"
echo ""

echo "✨ Setup Complete!"
echo ""
echo "🚀 To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend && npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend && npm run dev"
echo ""
echo "📝 Default Login Credentials:"
echo "  Admin: admin@netflix.com / admin123"
echo "  User:  user@netflix.com / user123"
echo ""
echo "🌐 URLs:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:5000"
echo ""
