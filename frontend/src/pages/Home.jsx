import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MovieCard from '../components/MovieCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { API_URL } from '../config';

export default function Home() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCategories, setUserCategories] = useState([]);
  const [categoryScrollPositions, setCategoryScrollPositions] = useState({});
  const [featuredScrollPosition, setFeaturedScrollPosition] = useState(0);
  const [activeHeroIdx, setActiveHeroIdx] = useState(0);
  const [categories, setCategories] = useState([]); // Categories from admin panel
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = token ? {
          headers: { Authorization: `Bearer ${token}` }
        } : {};

        const [allMovies, featuredMovies, categoriesData] = await Promise.all([
          axios.get(API_URL + '/movies', config),
          axios.get(API_URL + '/movies?featured=true', config),
          axios.get(API_URL + '/categories') // Public endpoint, no auth needed
        ]);
        // Show ALL video cards to everyone (Access control happens on Watch Page)
        setMovies(allMovies.data);

        // Fallback: If no featured movies, use the latest movie as hero
        if (featuredMovies.data && featuredMovies.data.length > 0) {
          setFeatured(featuredMovies.data);
        } else if (allMovies.data && allMovies.data.length > 0) {
          setFeatured([allMovies.data[0]]);
        } else {
          setFeatured([]);
        }
        setCategories(categoriesData.data);
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setTimeout(() => setLoading(false), 800); // Small delay for smooth transition
      }
    };

    fetchMovies();

    // Listen for user data updates
    const handleUserUpdate = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUserCategories(userData.subscribedCategories || []);
        setCurrentUser(userData);
      } else {
        setCurrentUser(null);
      }
    };

    window.addEventListener('userDataUpdated', handleUserUpdate);

    return () => {
      window.removeEventListener('userDataUpdated', handleUserUpdate);
    };
  }, []);

  // Auto-roll featured hero banner
  useEffect(() => {
    if (featured.length <= 1) return;

    const interval = setInterval(() => {
      setActiveHeroIdx(prev => (prev + 1) % featured.length);
    }, 8000); // Roll Every 8 Seconds

    return () => clearInterval(interval);
  }, [featured]);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Debug: Check if we have movies and categories
  console.log('Movies loaded:', movies.length);
  console.log('User categories:', userCategories);
  console.log('Featured:', featured.length);
  console.log('Categories from database:', categories.map(c => c.name));

  // Handle category scroll
  const scrollCategory = (category, direction) => {
    const currentPosition = categoryScrollPositions[category] || 0;
    const categoryMovies = movies.filter(m => m.category?.includes(category)).slice(0, 10);
    const newPosition = direction === 'left'
      ? Math.max(0, currentPosition - 1)
      : Math.min(categoryMovies.length - 1, currentPosition + 1);

    setCategoryScrollPositions({
      ...categoryScrollPositions,
      [category]: newPosition
    });
  };

  // Handle featured scroll
  const scrollFeatured = (direction) => {
    const maxScroll = Math.min(featured.length, 10) - 1;
    const newPosition = direction === 'left'
      ? Math.max(0, featuredScrollPosition - 1)
      : Math.min(maxScroll, featuredScrollPosition + 1);

    setFeaturedScrollPosition(newPosition);
  };

  return (
    <main className="min-h-screen bg-[#020202] text-white relative overflow-hidden select-none">
      {/* Refined Ambient Background Lighting */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[70vw] h-[70vw] bg-red-600/[0.03] rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-red-900/[0.05] rounded-full blur-[120px] animate-pulse-slow delay-700"></div>
        {/* Subtle Grid Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      </div>

      {/* Cinematic Hero Section */}
      {featured.length > 0 && featured[activeHeroIdx] && (
        <section className="relative h-[85vh] w-full group overflow-hidden z-10">
          <div className="absolute inset-0 transition-all duration-[2000ms] ease-out" key={featured[activeHeroIdx]?._id}>
            <div className="absolute inset-0 scale-100 group-hover:scale-110 transition-transform duration-[10000ms] ease-out">
              <img
                src={featured[activeHeroIdx].poster}
                alt={featured[activeHeroIdx].title}
                className="w-full h-full object-cover opacity-80"
              />
            </div>

            {/* Multi-layered cinematic overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/40 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#020202] via-[#020202]/50 to-transparent"></div>
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>
          </div>

          <div className="absolute inset-0 flex items-center px-6 md:px-20 z-20" key={`content-${featured[activeHeroIdx]?._id}`}>
            <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-left-12 duration-1000">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-full backdrop-blur-xl">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </span>
                <span className="text-[10px] font-black tracking-[0.3em] text-red-500 uppercase">
                  Featured Lesson
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[0.9] uppercase italic">
                  {featured[activeHeroIdx].title}
                </h1>
                <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>Batch {featured[activeHeroIdx].batchNo || '01'}</span>
                  <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                  <span className="text-red-500">Premium Content</span>
                </div>
              </div>

              <p className="text-xl text-gray-300 font-medium leading-relaxed max-w-xl italic line-clamp-2">
                {featured[activeHeroIdx].description}
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-4 relative z-50">
                <button
                  onClick={() => navigate(`/movie/${featured[activeHeroIdx]._id}`)}
                  className="group relative px-10 py-4 bg-white text-black font-black rounded-2xl overflow-hidden transition-all active:scale-95 shadow-2xl shadow-white/5"
                >
                  <div className="absolute inset-0 bg-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <span className="relative z-10 flex items-center gap-3 group-hover:text-white transition-colors uppercase italic tracking-tighter">
                    <span className="text-xl">▶</span> Play Lesson
                  </span>
                </button>

                {(!currentUser || (currentUser.subscription !== 'premium' && currentUser.role !== 'admin')) && (
                  <button
                    onClick={() => navigate('/profile')}
                    className="px-10 py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all active:scale-95 backdrop-blur-xl uppercase italic tracking-tighter text-sm"
                  >
                    Unlock Full Access
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Rolling Indicators */}
          {featured.length > 1 && (
            <div className="absolute bottom-16 left-6 md:left-20 flex gap-3 z-30">
              {featured.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveHeroIdx(idx)}
                  className={`h-1.5 transition-all duration-700 rounded-full ${activeHeroIdx === idx ? 'w-12 bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'w-4 bg-white/20 hover:bg-white/40'}`}
                />
              ))}
            </div>
          )}

          <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-[#020202] to-transparent z-10"></div>
        </section>
      )}

      {/* Main Content Sections */}
      <div className="relative z-10 px-6 md:px-20 pb-40 pt-2 space-y-32">
        {/* Categories Section */}
        <section className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories
              .sort((a, b) => a.name === 'Big Data Free' ? -1 : b.name === 'Big Data Free' ? 1 : a.name.localeCompare(b.name))
              .map(cat => (
                <div
                  key={cat._id}
                  onClick={() => navigate(`/category/${encodeURIComponent(cat.name)}`)}
                  className="group relative h-80 bg-[#0a0a0a] rounded-[2.5rem] border border-white/5 overflow-hidden cursor-pointer transition-all duration-500 hover:border-red-600/30 hover:-translate-y-2 shadow-2xl"
                >
                  {/* Category Image Overlay (Using first movie poster as bg) */}
                  <div className="absolute inset-0 opacity-40 group-hover:opacity-100 transition-all duration-700">
                    <img
                      src={movies.find(m => m.category?.includes(cat.name))?.poster || '/placeholder.jpg'}
                      className="w-full h-full object-cover transition-all duration-700 scale-110 group-hover:scale-100"
                      alt=""
                    />
                  </div>

                  {/* Content Container */}
                  <div className="absolute inset-0 p-10 flex flex-col justify-between bg-gradient-to-t from-black via-black/40 to-transparent">
                    <div className="flex justify-end items-start text-right">
                      {cat.name === 'Big Data Free' && (
                        <span className="px-4 py-1.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest">Open Sector</span>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter group-hover:text-red-500 transition-colors drop-shadow-2xl">
                        {cat.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest drop-shadow-md">
                          {movies.filter(m => m.category?.includes(cat.name)).length} Lessons
                        </span>
                        <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                          →
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>

      </div>
    </main>
  );
}
