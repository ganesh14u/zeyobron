import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
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
import Search from './pages/Search';
import Navbar from './components/Navbar';
import Notification, { useNotification } from './components/Notification';
import ConfirmDialog from './components/ConfirmDialog';
import { API_URL } from './config';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const notify = useNotification();
  const [isBackendLive, setIsBackendLive] = useState(true);
  const [isDetected, setIsDetected] = useState(false);

  // Inactivity / Multi-device detection logic
  useEffect(() => {
    let idleTimer;
    let sessionCheckTimer;

    const logout = async (reason) => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Notify server to clear session so other devices can log in immediately
          await axios.post(`${API_URL}/auth/logout`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      } catch (err) {
        console.error('Auto-logout server notification failed:', err);
      } finally {
        notify(reason, 'warning');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('userDataUpdated'));
        window.location.href = `/login?reason=${encodeURIComponent(reason)}`;
      }
    };

    // 1. Inactivity Timer (1 Minute)
    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (localStorage.getItem('token')) {
        idleTimer = setTimeout(() => {
          logout('Session expired due to inactivity');
        }, 86400000); // 24 hours
      }
    };

    // 2. Periodic Session Validation (Every 20s) - Handles multi-device logout
    const validateSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        if (err.response?.status === 401 && err.response?.data?.message === 'SESSION_EXPIRED') {
          logout('Logged out: Active session detected on another device');
        } else if (err.response?.status === 401) {
          logout('Session invalid');
        }
      }
    };

    // Monitor activity
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    if (localStorage.getItem('token')) {
      activityEvents.forEach(evt => document.addEventListener(evt, resetIdleTimer));
      resetIdleTimer();
      sessionCheckTimer = setInterval(validateSession, 15000); // 15s Heartbeat
    }

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (sessionCheckTimer) clearInterval(sessionCheckTimer);
      activityEvents.forEach(evt => document.removeEventListener(evt, resetIdleTimer));
    };
  }, [location.pathname]); // Re-run when switching pages

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
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // 1. Disable Right-Click
    const handleContextMenu = (e) => { e.preventDefault(); return false; };

    // 2. Disable Keyboard Shortcuts
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

    // 3. Resize detection
    const handleResize = () => {
      const threshold = 160;
      if (window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) {
        setIsDetected(true);
      }
    };

    // 4. Debugger Trap
    const antiInspect = setInterval(() => {
      const start = new Date();
      debugger;
      const end = new Date();
      if (end - start > 100) {
        setIsDetected(true);
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
            className="mt-10 px-12 py-4 bg-green-600 text-white font-black text-[12px] uppercase tracking-[0.3em] rounded-2xl hover:bg-green-700 active:scale-95 transition-all shadow-2xl shadow-green-900/40"
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
          ⚠️ Backend Not Connected
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
        <Route path="/search" element={<Search />} />
        <Route path="/category/:categoryName" element={<Category />} />
        <Route path="/movie/:id" element={<Movie />} />
        <Route path="/admin/*" element={<Admin />} />
      </Routes>
    </div>
  );
}
