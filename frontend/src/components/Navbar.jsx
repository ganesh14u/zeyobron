import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Fetch fresh user data
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const userData = response.data;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      console.error('Error fetching user data:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      fetchUserData();
    }

    // Scroll listener for glassmorphism
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('userDataUpdated', fetchUserData);

    const interval = setInterval(() => {
      if (localStorage.getItem('token')) {
        fetchUserData();
      }
    }, 10000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('userDataUpdated', fetchUserData);
      clearInterval(interval);
    };
  }, []);

  // Search functionality
  useEffect(() => {
    const searchMovies = async () => {
      if (searchQuery.trim().length < 1) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/movies?q=${encodeURIComponent(searchQuery)}`, config);
        setSearchResults(response.data.slice(0, 5));
        setShowSearchResults(true);
      } catch (error) {
        console.error('Error searching movies:', error);
        setSearchResults([]);
      }
    };

    const debounceTimer = setTimeout(searchMovies, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const handleSearchResultClick = (movieId) => {
    setSearchQuery('');
    setShowSearchResults(false);
    navigate(`/movie/${movieId}`);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.search-container')) setShowSearchResults(false);
      if (!e.target.closest('.profile-menu-container')) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-6 py-3 flex items-center justify-between ${isScrolled
        ? 'bg-black/80 backdrop-blur-lg border-b border-white/10 py-2'
        : 'bg-gradient-to-b from-black/90 to-transparent py-4'
        }`}
    >
      {/* Left Section: Logo & Links */}
      <div className="flex items-center gap-8">
        <div
          className="text-2xl font-black cursor-pointer tracking-tighter transition-transform active:scale-95 group"
          onClick={() => navigate('/')}
        >
          <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent group-hover:from-red-500 group-hover:to-red-300 italic uppercase">
            Data Sai
          </span>
        </div>
      </div>

      {/* Center Section: Search Bar (Desktop) */}
      <div className="flex-1 max-w-xl mx-8 relative search-container hidden md:block">
        <div className="relative group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim().length >= 1 && setShowSearchResults(true)}
            placeholder="Search videos, categories, batches..."
            className="w-full px-5 py-2.5 pl-12 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl focus:outline-none focus:border-red-600 focus:bg-white/20 transition-all placeholder:text-gray-500 text-sm"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-600 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSearchResults(false);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Search Results Dropdown (Desktop) */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute top-[calc(100%+10px)] left-0 w-full bg-[#181818] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-gray-500 font-bold bg-white/5 border-b border-white/5">
              Suggestions
            </div>
            {searchResults.map((movie) => (
              <button
                key={movie._id}
                onClick={() => handleSearchResultClick(movie._id)}
                className="w-full px-4 py-3 flex items-center gap-4 hover:bg-white/5 transition-colors text-left group"
              >
                <div className="w-12 h-16 flex-shrink-0 bg-gray-800 rounded-lg overflow-hidden border border-white/5 shadow-lg group-hover:scale-105 transition-transform">
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                    onError={(e) => e.target.src = 'https://via.placeholder.com/48x64?text=No+Image'}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-sm group-hover:text-red-500 transition-colors truncate">{movie.title}</div>
                  <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-white/5">{movie.category?.[0]}</span>
                    <span>•</span>
                    <span>{movie.duration}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Section: User Profile (Desktop) */}
      <div className="hidden md:flex items-center gap-6">
        {user ? (
          <div className="flex items-center gap-4 relative profile-menu-container">
            <div className="hidden lg:block text-right">
              <div className="text-xs font-bold text-white uppercase tracking-tighter">
                {user.name}
              </div>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                {user.subscription === 'premium' ? (
                  <span className="text-[10px] font-black bg-yellow-500 text-black px-1.5 py-0.5 rounded-sm shadow-sm flex items-center gap-1">
                    <span className="text-[8px]">⭐</span> PREMIUM
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-white/10 text-gray-300 px-1.5 py-0.5 rounded-sm">
                    FREE PLAN
                  </span>
                )}
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-black text-white shadow-lg hover:shadow-red-900/40 hover:scale-105 active:scale-95 transition-all border-2 border-white/10"
              >
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-64 bg-[#181818] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] py-3 z-[110] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 mb-2 border-b border-white/5">
                    <div className="font-black text-white">{user.name}</div>
                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                  </div>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/profile');
                    }}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">👤</span>
                      <span className="text-sm font-medium text-gray-300 group-hover:text-white">Profile Settings</span>
                    </div>
                  </button>

                  {user.role === 'admin' && (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/admin');
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🛠️</span>
                        <span className="text-sm font-medium text-gray-300 group-hover:text-white">Admin Dashboard</span>
                      </div>
                    </button>
                  )}

                  <div className="h-px bg-white/5 my-2"></div>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 transition-colors group"
                  >
                    <span className="text-lg">🚪</span>
                    <span className="text-sm font-bold text-red-500">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-black text-white shadow-lg hover:shadow-red-900/40 transition-all hover:scale-105 active:scale-95"
          >
            SIGN IN
          </button>
        )}
      </div>

      {/* Mobile Menu Button - Hamburger */}
      <div className="md:hidden">
        <button
          onClick={() => setShowProfileMenu(prev => !prev)} /* reusing profile menu state for mobile toggle simplicity */
          className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {showProfileMenu && (
        <div className="absolute top-full left-0 w-full bg-[#181818] border-b border-white/10 shadow-2xl p-4 flex flex-col gap-4 md:hidden animate-in slide-in-from-top-2 z-[105]">
          {/* Mobile Search */}
          <div className="relative group w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full px-5 py-3 pl-12 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Mobile Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              {searchResults.map((movie) => (
                <button
                  key={movie._id}
                  onClick={() => {
                    handleSearchResultClick(movie._id);
                    setShowProfileMenu(false); // close menu
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 border-b border-white/5 last:border-0"
                >
                  <img src={movie.poster} className="w-8 h-10 object-cover rounded bg-gray-800" alt="" />
                  <div className="text-left">
                    <div className="text-white font-bold text-xs truncate">{movie.title}</div>
                    <div className="text-[10px] text-gray-500">{movie.category?.[0]}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-white">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-white">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </div>
              <button onClick={() => { navigate('/profile'); setShowProfileMenu(false); }} className="w-full text-left p-3 hover:bg-white/5 rounded-lg text-sm text-gray-300">Profile Settings</button>
              {user.role === 'admin' && (
                <button onClick={() => { navigate('/admin'); setShowProfileMenu(false); }} className="w-full text-left p-3 hover:bg-white/5 rounded-lg text-sm text-gray-300">Admin Dashboard</button>
              )}
              <button onClick={() => { handleLogout(); setShowProfileMenu(false); }} className="w-full text-left p-3 hover:bg-red-500/10 rounded-lg text-sm text-red-500 font-bold">Sign Out</button>
            </div>
          ) : (
            <button
              onClick={() => { navigate('/login'); setShowProfileMenu(false); }}
              className="w-full py-3 bg-red-600 text-white font-black uppercase rounded-xl"
            >
              Sign In
            </button>
          )}
        </div>
      )}
    </nav >
  );
}
