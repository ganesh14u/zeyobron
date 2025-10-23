import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MovieCard from '../components/MovieCard';

export default function Category() {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCategories, setUserCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  
  const MOVIES_PER_PAGE = 12;

  useEffect(() => {
    const fetchCategoryMovies = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = token ? {
          headers: { Authorization: `Bearer ${token}` }
        } : {};
        
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/movies`,
          config
        );
        
        // Filter movies by category
        const categoryMovies = response.data.filter(m => 
          m.category?.includes(decodeURIComponent(categoryName))
        );
        setMovies(categoryMovies);
        
        // Get user's subscribed categories
        const user = localStorage.getItem('user');
        if (user) {
          const userData = JSON.parse(user);
          setUserCategories(userData.subscribedCategories || []);
        }
      } catch (error) {
        console.error('Error fetching category movies:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategoryMovies();
  }, [categoryName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(movies.length / MOVIES_PER_PAGE);
  const startIndex = currentPage * MOVIES_PER_PAGE;
  const endIndex = startIndex + MOVIES_PER_PAGE;
  const currentMovies = movies.slice(startIndex, endIndex);

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <main className="pt-20 px-6 pb-6">
      {/* Header with Back Button */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="mb-4 px-4 py-2 bg-[#272727] hover:bg-[#3f3f3f] rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <span>←</span>
          <span>Back to Home</span>
        </button>
        
        <h1 className="text-4xl font-bold mb-2">{decodeURIComponent(categoryName)}</h1>
        <p className="text-gray-400">
          {movies.length} {movies.length === 1 ? 'video' : 'videos'} available
          {totalPages > 1 && ` • Page ${currentPage + 1} of ${totalPages}`}
        </p>
      </div>

      {/* Movies Grid - 6 per row */}
      {currentMovies.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {currentMovies.map(movie => (
            <MovieCard key={movie._id} movie={movie} userCategories={userCategories} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎬</div>
          <h2 className="text-2xl font-bold mb-2">No Videos in This Category</h2>
          <p className="text-gray-400">Check back later for new content</p>
        </div>
      )}

      {/* Navigation Arrows */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-6 mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentPage === 0}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              currentPage === 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            <span className="text-xl">←</span>
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentPage(i);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`w-10 h-10 rounded-full font-semibold transition-all ${
                  currentPage === i
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={currentPage === totalPages - 1}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              currentPage === totalPages - 1
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            <span>Next</span>
            <span className="text-xl">→</span>
          </button>
        </div>
      )}
    </main>
  );
}
