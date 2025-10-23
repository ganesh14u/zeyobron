import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import Movie from './pages/Movie';
import Category from './pages/Category';
import Admin from './pages/Admin';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import Notification from './components/Notification';
import ConfirmDialog from './components/ConfirmDialog';

export default function App() {
  const isLoginPage = window.location.pathname === '/login' || window.location.pathname.startsWith('/reset-password');
  
  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Disable keyboard shortcuts for inspect/developer tools
    const handleKeyDown = (e) => {
      // Prevent F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      
      // Windows/Linux shortcuts
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        return false;
      }
      if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return false;
      }
      
      // Mac shortcuts: Cmd+Option+I/J/C (DevTools)
      if (e.metaKey && e.altKey && (e.key === 'i' || e.key === 'I' || e.key === 'j' || e.key === 'J' || e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        return false;
      }
      
      // Mac shortcuts: Cmd+Shift+I/J/C
      if (e.metaKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        return false;
      }
      
      // Mac: Cmd+U (View Source)
      if (e.metaKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        return false;
      }
      
      // Mac: Cmd+S (Save)
      if (e.metaKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return false;
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-[#141414] text-white">
      {!isLoginPage && <Navbar />}
      <Notification />
      <ConfirmDialog />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/category/:categoryName" element={<Category />} />
        <Route path="/movie/:id" element={<Movie />} />
        <Route path="/admin/*" element={<Admin />} />
      </Routes>
    </div>
  );
}
