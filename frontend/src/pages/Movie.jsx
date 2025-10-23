import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import SecureVideoPlayer from '../components/SecureVideoPlayer';

export default function Movie() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessReason, setAccessReason] = useState('');
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/movies/${id}`);
        const movieData = response.data;
        setMovie(movieData);
        
        // Fetch related movies from the same category
        if (movieData.category && movieData.category.length > 0) {
          const config = token ? {
            headers: { Authorization: `Bearer ${token}` }
          } : {};
          
          const relatedResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/movies`,
            config
          );
          
          // Filter related movies: same category, exclude current movie
          const related = relatedResponse.data.filter(m => 
            m._id !== id && 
            m.category?.some(cat => movieData.category.includes(cat))
          ).slice(0, 12);  // Limit to 12 related videos
          
          setRelatedMovies(related);
        }
        
        // Check access if user is logged in
        if (token) {
          const accessResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/movies/${id}/access`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setHasAccess(accessResponse.data.hasAccess);
          setAccessReason(accessResponse.data.reason);
        } else {
          // Not logged in, no access
          setHasAccess(false);
        }
      } catch (error) {
        console.error('Error fetching movie:', error);
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchMovie();
  }, [id, token, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!movie) return null;

  return (
    <div className="pt-16 bg-[#0f0f0f] min-h-screen">
      {/* YouTube-style layout */}
      <div className="flex flex-col lg:flex-row gap-6 px-4 py-4 max-w-[1920px] mx-auto">
        
        {/* Left Column - Video Player & Details */}
        <div className="lg:w-[calc(100%-420px)] flex-shrink-0">
          
          {/* Back Button - Above Video */}
          <button
            onClick={() => navigate('/')}
            className="mb-4 px-4 py-2 bg-[#272727] hover:bg-[#3f3f3f] rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <span>←</span>
            <span>Back to Home</span>
          </button>
          
          {/* Video Player Section */}
          <div className="bg-black rounded-xl overflow-hidden mb-4">
            {movie.videoUrl && hasAccess ? (
              <SecureVideoPlayer
                videoUrl={movie.videoUrl}
                videoType={movie.videoType || 'direct'}
                poster={movie.poster}
                title={movie.title}
              />
            ) : (
              /* Lock Screen */
              <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80"></div>
                <div className="relative z-10 text-center p-8">
                  <div className="text-6xl mb-4">🔒</div>
                  <h2 className="text-2xl font-bold mb-4">Content Not Accessible</h2>
                  <p className="text-gray-300 mb-6">
                    {!token ? (
                      'Please sign in to access this content'
                    ) : (
                      'You don\'t have access to this category. Contact admin for category subscription.'
                    )}
                  </p>
                  
                  {!token ? (
                    <button
                      onClick={() => navigate('/login')}
                      className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold"
                    >
                      Sign In
                    </button>
                  ) : (
                    <div className="inline-block p-4 bg-gray-800 rounded-lg text-left">
                      <p className="text-sm text-yellow-400 mb-1">
                        Type: {user.subscription?.toUpperCase() || 'Free'}
                      </p>
                      <p className="text-sm text-green-400">
                        Access: {user.subscribedCategories?.join(', ') || 'None'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Video Title & Info */}
          <div className="mb-4">
            <h1 className="text-xl font-semibold mb-2">{movie.title}</h1>
            
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>📚 {movie.category?.join(', ')}</span>
              <span>•</span>
              <span>⏱️ {movie.duration}</span>
              {movie.batchNo && (
                <>
                  <span>•</span>
                  <span>📎 {movie.batchNo}</span>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          {movie.description && (
            <div className="bg-[#272727] rounded-xl p-4">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{movie.description}</p>
            </div>
          )}
        </div>

        {/* Right Column - Related Videos */}
        <div className="lg:w-[400px] flex-shrink-0">
          <div className="sticky top-20">
            <h2 className="text-lg font-semibold mb-4">Related Videos</h2>
            
            <div className="space-y-3">
              {relatedMovies.length > 0 ? (
                relatedMovies.map(related => {
                  const userHasAccess = related.category?.some(cat => 
                    user.subscribedCategories?.includes(cat)
                  );
                  
                  return (
                    <div
                      key={related._id}
                      onClick={() => navigate(`/movie/${related._id}`)}
                      className="flex gap-2 cursor-pointer hover:bg-[#272727] rounded-lg p-2 transition-colors group relative"
                    >
                      {/* Thumbnail */}
                      <div className="w-40 h-24 flex-shrink-0 relative rounded-lg overflow-hidden bg-gray-800">
                        {!userHasAccess && (
                          <div className="absolute top-1 right-1 z-10 px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded">
                            🔒
                          </div>
                        )}
                        <img
                          src={related.poster}
                          alt={related.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/160x90?text=No+Image';
                          }}
                        />
                        {related.duration && (
                          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                            {related.duration}
                          </div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-white">
                          {related.title}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {related.category?.slice(0, 2).join(', ')}
                        </p>
                        {related.batchNo && (
                          <p className="text-xs text-gray-500 mt-1">{related.batchNo}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No related videos found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
