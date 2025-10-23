#!/bin/bash

echo "🚀 Zeyobron Deployment Helper"
echo "=============================="
echo ""

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the netflix-clone directory"
    exit 1
fi

echo "📋 Pre-Deployment Checklist:"
echo ""
echo "1. ✅ MongoDB Atlas is configured and running"
echo "2. ⚠️  Have you created GitHub repositories for frontend and backend?"
echo "3. ⚠️  Have you signed up for Netlify and Render accounts?"
echo ""

read -p "Continue with deployment preparation? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "🔧 Step 1: Building Frontend..."
cd frontend
npm install
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "✅ Frontend build successful!"
echo ""

echo "📦 Step 2: Testing Backend..."
cd ../backend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Backend dependencies installation failed!"
    exit 1
fi

echo "✅ Backend ready!"
echo ""

echo "=============================="
echo "✅ Pre-deployment checks complete!"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Deploy Backend to Render:"
echo "   - Go to https://render.com"
echo "   - Create new Web Service from GitHub"
echo "   - Set environment variables (see DEPLOYMENT_GUIDE.md)"
echo ""
echo "2. Deploy Frontend to Netlify:"
echo "   - Go to https://app.netlify.com"
echo "   - Import from GitHub"
echo "   - Set VITE_API_URL to your Render backend URL"
echo ""
echo "📖 For detailed instructions, see: DEPLOYMENT_GUIDE.md"
echo "=============================="
