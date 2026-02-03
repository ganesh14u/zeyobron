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
import { API_URL } from './config';

export default function App() {
  const location = useLocation();
  const [isBackendLive, setIsBackendLive] = useState(true);
  const [isDetected, setIsDetected] = useState(false);

  // Check backend health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await axios.get(`${API_URL}/health`);
        setIsBackendLive(true);
      } catch (err) {
        setIsBackendLive(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // 1. Disable Right-Click
    const handleContextMenu = (e) => { e.preventDefault(); return false; };

    // 2. Disable Keyboard Shortcuts (F12, Ctrl+Shift+I, etc)
    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.metaKey && e.altKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        ((e.ctrlKey || e.metaKey) && ['U', 'S', 'P'].includes(e.key.toUpperCase()))
      ) {
        setIsDetected(true);
        e.preventDefault();
        return false;
      }
    };

    // 3. Detect DevTools via Window Resize
    const handleResize = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > threshold || heightDiff > threshold) {
        setIsDetected(true);
      }
    };

    // 4. Debugger Loop (The ultimate "Kill Switch")
    const antiInspect = setInterval(() => {
      const start = new Date();
      debugger; // This pauses execution if DevTools is open
      const end = new Date();
      if (end - start > 100) {
        setIsDetected(true);
        console.clear();
      }
    }, 1000);

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    document.addEventListener('dragstart', (e) => e.target.tagName === 'IMG' && e.preventDefault());

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      clearInterval(antiInspect);
    };
  }, []);

  if (isDetected) {
    return (
      <div className="fixed inset-0 bg-[#050505] z-[999999] flex items-center justify-center p-6 text-center select-none overflow-hidden">
        <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
          <div className="w-60 h-80 bg-red-600/20 border border-red-600/20 rounded-full flex items-center justify-center text-8xl mx-auto mb-8 shadow-[0_0_100px_rgba(220,38,38,0.3)] border-dashed border-spacing-4 animate-pulse">👨🏻‍💻</div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic mb-4">Security Protocol Actived</h2>
          <p className="text-red-600 text-sm font-black leading-relaxed max-w-xs mx-auto uppercase tracking-widest bg-red-600/5 py-4 rounded-xl border border-red-600/10">
            Inspection tools are disabled to protect copyright content. Please close developer tools to resume.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-10 px-12 py-4 bg-green-600 text-white font-black text-[12px] uppercase tracking-[0.3em] rounded-2xl hover:bg-green-700 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-green-900/40"
          >
            Reset Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      {!isBackendLive && (
        <div className="fixed top-0 left-0 right-0 z-[99999] bg-red-600 text-white text-center py-2 px-4 font-bold uppercase tracking-widest text-xs shadow-xl animate-pulse">
          ⚠️ Backend Not Connected — Check Server Connection
        </div>
      )}
      <Navbar />
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
