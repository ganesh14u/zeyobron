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
  const [categories, setCategories] = useState([]); // Categories from admin panel

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
        setMovies(allMovies.data);
        setFeatured(featuredMovies.data);
        setCategories(categoriesData.data);

        // Get user's subscribed categories from localStorage
        const user = localStorage.getItem('user');
        if (user) {
          const userData = JSON.parse(user);
          setUserCategories(userData.subscribedCategories || []);
        }
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setTimeout(() => setLoading(false), 800); // Small delay for smooth transition
      }
    };

    fetchMovies();

    // Listen for user data updates
    const handleUserUpdate = () => {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        setUserCategories(userData.subscribedCategories || []);
      }
    };

    window.addEventListener('userDataUpdated', handleUserUpdate);

    return () => {
      window.removeEventListener('userDataUpdated', handleUserUpdate);
    };
  }, []);

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
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Cinematic Hero Section */}
      {featured.length > 0 && featured[0] && (
        <section className="relative h-[85vh] w-full group overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={featured[0].poster}
              alt={featured[0].title}
              className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[2s]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/40 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent"></div>
          </div>

          <div className="absolute inset-0 flex items-center px-6 md:px-24">
            <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-left-8 duration-1000">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded">Featured</span>
                {featured[0].batchNo && featured[0].batchNo !== featured[0].title && (
                  <span className="text-gray-400 font-bold text-sm tracking-tighter uppercase">{featured[0].batchNo}</span>
                )}
              </div>

              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9] uppercase italic">
                {featured[0].title}
              </h1>

              <p className="text-lg text-gray-300 font-medium line-clamp-3 md:line-clamp-none max-w-xl italic opacity-80">
                {featured[0].description}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-6">
                <button
                  onClick={() => navigate(`/movie/${featured[0]._id}`)}
                  className="px-10 py-5 bg-white text-black font-black rounded-[2rem] flex items-center gap-3 hover:bg-red-600 hover:text-white transition-all shadow-2xl uppercase text-[10px] tracking-[0.2em]"
                >
                  <span className="text-xl">▶</span> Watch Now
                </button>
                <button
                  onClick={() => navigate(`/movie/${featured[0]._id}`)}
                  className="px-10 py-5 bg-white/5 text-white font-black rounded-[2rem] flex items-center gap-3 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all uppercase text-[10px] tracking-[0.2em]"
                >
                  More Info
                </button>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>
        </section>
      )}

      <div className="relative z-10 -mt-16 px-6 md:px-12 space-y-20 pb-24">
        {/* User's learning path section removed as requested */}

        {/* Dynamic Category Sliders */}
        {categories
          .sort((a, b) => a.name === 'Big Data Free' ? -1 : b.name === 'Big Data Free' ? 1 : a.name.localeCompare(b.name))
          .map(categoryObj => {
            const category = categoryObj.name;
            const allCategoryMovies = movies.filter(m => m.category?.includes(category));
            const categoryMovies = allCategoryMovies.slice(0, 12); // Show up to 12 in slider
            if (allCategoryMovies.length === 0) return null;

            return (
              <section key={category} className="space-y-6 group/section">
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <h2
                      onClick={() => navigate(`/category/${encodeURIComponent(category)}`)}
                      className="text-2xl font-black text-white uppercase tracking-tighter hover:text-red-500 cursor-pointer transition-colors"
                    >
                      {category}
                      {category === 'Big Data Free' && <span className="ml-3 text-[10px] py-1 px-2 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg">FREE PASS</span>}
                    </h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{allCategoryMovies.length} Available Lessons</p>
                  </div>
                  <button
                    onClick={() => navigate(`/category/${encodeURIComponent(category)}`)}
                    className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-colors border-b-2 border-transparent hover:border-red-600 pb-1"
                  >
                    Explore All
                  </button>
                </div>

                <div className="relative">
                  <div className="overflow-hidden p-2 -m-2">
                    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x transition-all">
                      {categoryMovies.map(m => (
                        <div key={m._id} className="snap-start flex-shrink-0 w-[200px] md:w-[240px]">
                          <MovieCard movie={m} userCategories={userCategories} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
      </div>
    </main>
  );
}
