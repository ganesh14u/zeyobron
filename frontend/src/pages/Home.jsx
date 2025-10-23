import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MovieCard from '../components/MovieCard';

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
        setLoading(false);
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl">Loading...</div>
      </div>
    );
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
    <main className="pt-20 px-6 pb-6">
      {/* Featured Section */}
      {featured.length > 0 && featured[0] && (
        <div 
          className="relative h-[70vh] mb-8 rounded-lg overflow-hidden"
          style={{
            backgroundImage: `url(${featured[0].poster})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent flex items-center">
            <div className="px-12 max-w-2xl">
              <h1 className="text-5xl font-bold mb-4">{featured[0].title}</h1>
              <p className="text-lg mb-6">{featured[0].description}</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => window.location.href = `/movie/${featured[0]._id}`}
                  className="px-8 py-3 bg-white text-black font-semibold rounded hover:bg-gray-200"
                >
                  ▶ Play
                </button>
                <button className="px-8 py-3 bg-gray-500/50 text-white font-semibold rounded hover:bg-gray-500/70">
                  More Info
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Featured Movies */}
      {featured.length > 0 && (
        <section className="mb-8 relative">
          <h2 className="text-2xl font-bold mb-4">Featured</h2>
          
          <div className="relative group">
            {/* Left Arrow */}
            {featuredScrollPosition > 0 && (
              <button
                onClick={() => scrollFeatured('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Scroll left"
              >
                <span className="text-2xl font-bold">‹</span>
              </button>
            )}
            
            {/* Featured Movies Display */}
            <div className="overflow-hidden">
              <div 
                className="flex gap-4 transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${featuredScrollPosition * (192 + 16)}px)` }}
              >
                {featured.slice(0, 10).map(m => <MovieCard key={m._id} movie={m} userCategories={userCategories} />)}
              </div>
            </div>
            
            {/* Right Arrow */}
            {featuredScrollPosition < Math.min(featured.length, 10) - 1 && (
              <button
                onClick={() => scrollFeatured('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Scroll right"
              >
                <span className="text-2xl font-bold">›</span>
              </button>
            )}
          </div>
        </section>
      )}

      {/* Categories - Fetched from database Categories collection */}
      {/* Sort categories: "Big Data Free" first, then others */}
      {categories
        .sort((a, b) => {
          // "Big Data Free" always comes first
          if (a.name === 'Big Data Free') return -1;
          if (b.name === 'Big Data Free') return 1;
          // Other categories in alphabetical order
          return a.name.localeCompare(b.name);
        })
        .map(categoryObj => {
        const category = categoryObj.name;
        const categoryMovies = movies.filter(m => m.category?.includes(category)).slice(0, 10); // Max 10 videos
        if (categoryMovies.length === 0) return null;
        
        const scrollPosition = categoryScrollPositions[category] || 0;
        const canScrollLeft = scrollPosition > 0;
        const canScrollRight = scrollPosition < categoryMovies.length - 1;
        
        return (
          <section key={category} id={`category-${category}`} className="mb-8 relative">
            <div className="flex items-center justify-between mb-4">
              <h2 
                className="text-2xl font-bold hover:text-red-500 cursor-pointer transition-colors"
                onClick={() => navigate(`/category/${encodeURIComponent(category)}`)}
              >
                {category}
                {category === 'Big Data Free' && (
                  <span className="ml-2 text-sm text-green-400">✓ Free Access</span>
                )}
              </h2>
              <button
                onClick={() => navigate(`/category/${encodeURIComponent(category)}`)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                View All →
              </button>
            </div>
            
            {/* Navigation Arrows and Movie Container */}
            <div className="relative group">
              {/* Left Arrow */}
              {canScrollLeft && (
                <button
                  onClick={() => scrollCategory(category, 'left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Scroll left"
                >
                  <span className="text-2xl font-bold">‹</span>
                </button>
              )}
              
              {/* Movies Display - Show only current video */}
              <div className="overflow-hidden">
                <div 
                  className="flex gap-4 transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${scrollPosition * (192 + 16)}px)` }} // 192px card width + 16px gap
                >
                  {categoryMovies.map(m => <MovieCard key={m._id} movie={m} userCategories={userCategories} />)}
                </div>
              </div>
              
              {/* Right Arrow */}
              {canScrollRight && (
                <button
                  onClick={() => scrollCategory(category, 'right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Scroll right"
                >
                  <span className="text-2xl font-bold">›</span>
                </button>
              )}
            </div>
          </section>
        );
      })}
    </main>
  );
}
