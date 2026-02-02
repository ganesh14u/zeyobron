import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MovieCard from '../components/MovieCard';
import LoadingSpinner from '../components/LoadingSpinner';

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
          axios.get(import.meta.env.VITE_API_URL + '/movies', config),
          axios.get(import.meta.env.VITE_API_URL + '/movies?featured=true', config),
          axios.get(import.meta.env.VITE_API_URL + '/categories') // Public endpoint, no auth needed
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
      {/* Ambient Background Lighting */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-red-900/10 rounded-full blur-[150px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-blue-900/10 rounded-full blur-[150px] animate-pulse-slow delay-1000"></div>
      </div>

      {/* Cinematic Hero Section */}
      {featured.length > 0 && featured[activeHeroIdx] && (
        <section className="relative h-[90vh] w-full group overflow-hidden z-10">
          <div className="absolute inset-0 transition-opacity duration-1000" key={featured[activeHeroIdx]?._id}>
            <img
              src={featured[activeHeroIdx].poster}
              alt={featured[activeHeroIdx].title}
              className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-all duration-[3000ms] ease-out animate-in fade-in zoom-in-105"
            />
            {/* Professional Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/60 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-black/20 to-black/80 opacity-60"></div>
          </div>

          <div className="absolute inset-0 flex items-center px-4 md:px-16 pb-12" key={`content-${featured[activeHeroIdx]?._id}`}>
            <div className="max-w-2xl space-y-6 pt-32 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              {/* Netflix-style Metadata Line */}
              <div className="flex items-center gap-3 text-sm font-bold shadow-black drop-shadow-md">
                <span className="text-red-600 font-black tracking-widest uppercase">LESSONS</span>
                {featured[activeHeroIdx].batchNo && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-200">{featured[activeHeroIdx].batchNo}</span>
                  </>
                )}
              </div>

              {/* Title - Bold, Solid White */}
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none drop-shadow-2xl uppercase">
                {featured[activeHeroIdx].title}
              </h1>

              {/* Description - Concise */}
              <p className="text-lg text-white drop-shadow-md font-medium line-clamp-3 max-w-xl italic">
                {featured[activeHeroIdx].description}
              </p>

              {/* Professional Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4 relative z-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/movie/${featured[activeHeroIdx]._id}`);
                  }}
                  className="px-10 py-4 bg-white text-black font-black rounded-xl flex items-center gap-3 hover:bg-red-600 hover:text-white transition-all text-sm md:text-base shadow-2xl active:scale-95"
                >
                  <span className="text-xl">▶</span> PLAY NOW
                </button>

                {(!currentUser || (currentUser.subscription !== 'premium' && currentUser.role !== 'admin')) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/profile');
                    }}
                    className="px-10 py-4 bg-red-600/20 border border-red-600/40 text-white font-black rounded-xl flex items-center gap-3 hover:bg-red-600 transition-all text-sm md:text-base backdrop-blur-md shadow-2xl active:scale-95"
                  >
                    <span>🛡️</span> SUBSCRIBE TO UNLOCK
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Rolling Indicators */}
          {featured.length > 1 && (
            <div className="absolute bottom-12 right-12 flex gap-2 z-20">
              {featured.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveHeroIdx(idx)}
                  className={`h-1 transition-all duration-500 cursor-pointer ${activeHeroIdx === idx ? 'w-8 bg-red-600' : 'w-4 bg-white/20 hover:bg-white/40'}`}
                />
              ))}
            </div>
          )}

          {/* Subtle Bottom Fade */}
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#020202] to-transparent"></div>
        </section>
      )}

      <div className="relative z-10 pt-12 md:pt-4 px-4 md:px-12 pb-32">
        {/* Professional Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {categories
            .sort((a, b) => a.name === 'Big Data Free' ? -1 : b.name === 'Big Data Free' ? 1 : a.name.localeCompare(b.name))
            .map(categoryObj => {
              const category = categoryObj.name;
              const allCategoryMovies = movies.filter(m => m.category?.includes(category));

              return (
                <div
                  key={category}
                  onClick={() => navigate(`/category/${encodeURIComponent(category)}`)}
                  className="group relative bg-[#111] border border-white/5 rounded-[2.5rem] p-10 cursor-pointer overflow-hidden hover:bg-[#161616] hover:border-red-600/30 transition-all duration-500 hover:translate-y-[-8px] shadow-2xl"
                >
                  {/* Subtle Background Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-[60px] group-hover:bg-red-600/10 transition-colors"></div>

                  <div className="relative z-10 space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:bg-red-600 transition-all duration-500">
                        {category === 'Big Data Free' ? '🆓' : '🛡️'}
                      </div>
                      {category === 'Big Data Free' && (
                        <span className="px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest">Unlocked</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none italic group-hover:text-red-500 transition-colors">
                        {category}
                      </h2>
                      <p className="text-[10px] text-red-600 group-hover:text-white font-black uppercase tracking-[0.2em] transition-colors duration-500">
                        {allCategoryMovies.length} Videos Available
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-black text-red-600 group-hover:text-green-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-10px] group-hover:translate-x-0">
                      Enter Sector <span>→</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </main>
  );
}
