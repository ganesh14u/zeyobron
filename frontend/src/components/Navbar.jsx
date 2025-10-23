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
        // Token expired or invalid
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
      // Fetch fresh data on mount
      fetchUserData();
    }

    // Listen for user data updates
    const handleUserUpdate = () => {
      fetchUserData();
    };

    window.addEventListener('userDataUpdated', handleUserUpdate);

    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      if (localStorage.getItem('token')) {
        fetchUserData();
      }
    }, 10000);

    return () => {
      window.removeEventListener('userDataUpdated', handleUserUpdate);
      clearInterval(interval);
    };
  }, []);

  // Search functionality
  useEffect(() => {
    const searchMovies = async () => {
      if (searchQuery.trim().length < 1) { // Changed from 2 to 1 to allow searching with numbers
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const config = token ? {
          headers: { Authorization: `Bearer ${token}` }
        } : {};
        
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/movies?q=${encodeURIComponent(searchQuery)}`,
          config
        );
        
        setSearchResults(response.data.slice(0, 5)); // Limit to 5 suggestions
        setShowSearchResults(true);
      } catch (error) {
        console.error('Error searching movies:', error);
        setSearchResults([]);
      }
    };

    const debounceTimer = setTimeout(() => {
      searchMovies();
    }, 300); // Debounce search

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

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.search-container')) {
        setShowSearchResults(false);
      }
      if (!e.target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="px-6 py-4 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-4">
        <div className="text-2xl font-bold cursor-pointer text-red-600" onClick={() => navigate('/')}>
          ZEYOBRON
        </div>
        <Link to="/" className="hover:text-gray-300">Home</Link>
        {user?.role === 'admin' && (
          <Link to="/admin" className="hover:text-gray-300">Admin</Link>
        )}
      </div>
      
      {/* Search Bar */}
      <div className="flex-1 max-w-md mx-8 relative search-container">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim().length >= 1 && setShowSearchResults(true)}
            placeholder="Search videos..."
            className="w-full px-4 py-2 pl-10 bg-gray-800/80 border border-gray-700 rounded-full focus:outline-none focus:border-red-600 focus:bg-gray-800 transition-colors"
          />
          <svg 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSearchResults(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
        
        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute top-full mt-2 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-50">
            {searchResults.map((movie) => (
              <button
                key={movie._id}
                onClick={() => handleSearchResultClick(movie._id)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-800 transition-colors text-left border-b border-gray-800 last:border-b-0"
              >
                <img 
                  src={movie.poster} 
                  alt={movie.title}
                  className="w-12 h-16 object-cover rounded"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/48x64?text=No+Image';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{movie.title}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-2">
                    {movie.category?.slice(0, 2).join(', ')}
                    {movie.duration && (
                      <>
                        <span>•</span>
                        <span>{movie.duration}</span>
                      </>
                    )}
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}
        
        {/* No Results Message */}
        {showSearchResults && searchQuery.trim().length >= 1 && searchResults.length === 0 && (
          <div className="absolute top-full mt-2 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-4 text-center text-gray-400 z-50">
            No videos found for "{searchQuery}"
          </div>
        )}
      </div>
      
      <div>
        {user ? (
          <div className="flex items-center gap-4 relative">
            <div className="text-sm">
              <div>Hello, {user.name}</div>
              {user.subscription && (
                <div className={`text-xs ${
                  user.subscription === 'premium' ? 'text-yellow-400' : 'text-gray-400'
                }`}>
                  {user.subscription === 'premium' ? '⭐ Premium' : '📌 Free'}
                  {user.subscribedCategories?.length > 0 && (
                    <span className="text-green-400 ml-1">
                      ({user.subscribedCategories.length} categories)
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Profile Dropdown */}
            <div className="relative profile-menu-container">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center font-bold"
              >
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </button>
              
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-2 z-50">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 hover:bg-gray-700"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    👤 My Profile
                  </Link>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 text-red-400"
                  >
                    🚪 Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button onClick={() => navigate('/login')} className="px-4 py-2 rounded bg-red-600 hover:bg-red-700">
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
