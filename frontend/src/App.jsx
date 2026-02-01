import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Home from './pages/Home';
import Movie from './pages/Movie';
import Category from './pages/Category';
import Admin from './pages/Admin';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import Notification from './components/Notification';
import ConfirmDialog from './components/ConfirmDialog';

export default function App() {
  const location = useLocation();
  const [isBackendLive, setIsBackendLive] = useState(true);

  // Check backend health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/health`);
        setIsBackendLive(true);
      } catch (err) {
        setIsBackendLive(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const isLoginPage = location.pathname === '/login' ||
    location.pathname === '/forgot-password' ||
    location.pathname.startsWith('/reset-password');

  useEffect(() => {
    // Global anti-right click logic
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Global anti-developer tools logic
    const handleKeyDown = (e) => {
      // Prevent F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+Shift+I, J, C (Windows/Linux)
      if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
        e.preventDefault();
        return false;
      }

      // Prevent Cmd+Option+I, J, C (Mac)
      if (e.metaKey && e.altKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
        e.preventDefault();
        return false;
      }

      // Prevent Cmd/Ctrl + U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'u')) {
        e.preventDefault();
        return false;
      }

      // Prevent Cmd/Ctrl + S (Save Page)
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 's')) {
        e.preventDefault();
        return false;
      }

      // Prevent Cmd/Ctrl + P (Print Page)
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        return false;
      }
    };

    // Prevent dragging images
    const handleDragStart = (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      {!isBackendLive && (
        <div className="fixed top-0 left-0 right-0 z-[99999] bg-red-600 text-white text-center py-2 px-4 font-bold uppercase tracking-widest text-xs shadow-xl animate-pulse">
          ⚠️ Backend Not Connected — Check Server Connection
        </div>
      )}
      <Navbar /> {/* Navbar now shown on all pages */}
      <Notification />
      <ConfirmDialog />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/category/:categoryName" element={<Category />} />
        <Route path="/movie/:id" element={<Movie />} />
        <Route path="/admin/*" element={<Admin />} />
      </Routes>
    </div>
  );
}
