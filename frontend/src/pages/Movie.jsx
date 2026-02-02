import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import SecureVideoPlayer from '../components/SecureVideoPlayer';
import LoadingSpinner from '../components/LoadingSpinner';
import { API_URL } from '../config';

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
        const response = await axios.get(`${API_URL}/movies/${id}`);
        const movieData = response.data;
        setMovie(movieData);

        // 1. Initial Fetch of Related Movies
        let related = [];
        if (movieData.category && movieData.category.length > 0) {
          const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
          try {
            const allMovies = await axios.get(`${API_URL}/movies`, config);

            // 1. Get all movies in same category and sort them naturally
            const categoryMovies = allMovies.data
              .filter(m => m.category?.some(cat => movieData.category?.includes(cat)))
              .sort((a, b) => {
                const aBatch = a.batchNo || "";
                const bBatch = b.batchNo || "";
                return aBatch.localeCompare(bBatch, undefined, { numeric: true, sensitivity: 'base' });
              });

            // 2. Find current movie index
            const currentIndex = categoryMovies.findIndex(m => m._id === id);

            if (currentIndex !== -1) {
              const laterVideos = categoryMovies.slice(currentIndex + 1);
              const earlierVideos = categoryMovies.slice(0, currentIndex);
              related = [...laterVideos, ...earlierVideos].slice(0, 10);
            } else {
              related = categoryMovies.filter(m => m._id !== id).slice(0, 10);
            }
          } catch (e) { console.error('Related fetch error', e); }
        }

        // 2. Access Control & User Refresh
        if (token) {
          let userObj = JSON.parse(localStorage.getItem('user') || '{}');

          // Force Refresh User Profile (Backend Check)
          try {
            const meRes = await axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
            if (meRes.data) {
              userObj = meRes.data;
              localStorage.setItem('user', JSON.stringify(userObj));
            }
          } catch (err) { console.error('Profile refresh failed', err); }

          // Define Flags
          const isAdmin = userObj.role === 'admin';
          const isPremiumUser = userObj.subscription?.toLowerCase() === 'premium';
          const isPremiumContent = movieData.isPremium;

          // SHOW ALL RELATED CARDS (Visual access allowed)
          setRelatedMovies(related);

          // DETERMINE ACCESS
          if (isAdmin) {
            setHasAccess(true);
            setAccessReason('Admin Access');
          } else if (isPremiumUser) {
            setHasAccess(true);
            setAccessReason('Premium Subscription');
          } else {
            // Free User
            if (!isPremiumContent) {
              setHasAccess(true);
              setAccessReason('Free Content');
            } else {
              setHasAccess(false);
              setAccessReason('Premium Content is Locked');
            }
          }

        } else {
          // GUEST (No Token)
          setHasAccess(!movieData.isPremium);
          // Guests can see related cards but locks apply
          setRelatedMovies(related);
        }

      } catch (error) {
        console.error('Error fetching movie:', error);
        if (error.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };

    fetchMovie();
  }, [id, token, navigate]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!movie) return null;

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Background Ambient Glow */}
      <div className="fixed top-0 left-0 w-full h-[50vh] bg-red-600/5 blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 max-w-[1800px] mx-auto px-4 md:px-8 pt-24 pb-12">
        <div className="flex flex-col xl:flex-row gap-8">

          {/* Main Player Section */}
          <div className="flex-1 space-y-8">
            <button
              onClick={() => navigate('/')}
              className="group flex items-center gap-3 text-gray-400 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest"
            >
              <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-red-600 transition-colors">←</span>
              Browse Categories
            </button>

            <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase leading-tight italic pl-2">{movie.title}</h1>

            <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-[#000] border border-white/5 shadow-2xl group">
              {movie.videoUrl && hasAccess ? (
                <SecureVideoPlayer
                  key={movie._id}
                  videoUrl={movie.videoUrl}
                  videoType={movie.videoType || 'direct'}
                  poster={movie.poster}
                  title={movie.title}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#121212] to-[#050505]">
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                  <div className="relative text-center space-y-8 p-12 max-w-lg">
                    <div className="relative inline-block">
                      <div className="w-24 h-24 rounded-3xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-4xl animate-bounce">🔒</div>
                      <div className="absolute -inset-4 bg-red-600/20 blur-2xl rounded-full animate-pulse"></div>
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Access Locked</h2>
                      <p className="text-gray-400 font-medium italic">
                        {!token ? 'Please log in to watch this lesson.' : 'This lesson requires a premium subscription.'}
                      </p>
                    </div>
                    {!token ? (
                      <button onClick={() => navigate('/login')} className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-all shadow-xl">Sign In to Unlock</button>
                    ) : (
                      <div className="space-y-4">
                        <button
                          onClick={() => navigate('/profile')}
                          className="w-full py-5 bg-gradient-to-r from-red-600 to-red-800 text-white font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] transition-all shadow-2xl shadow-red-900/40 text-xs"
                        >
                          Subscribe to Premium To get Access
                        </button>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                          Unlock all modules instantly
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Metadata Section */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 p-2">
              <div className="space-y-4 max-w-2xl">
                <div className="flex flex-wrap items-center gap-3">
                  {movie.category?.map(c => (
                    <span key={c} className="px-4 py-1.5 bg-red-600/10 border border-red-600/20 text-red-500 text-[10px] font-black rounded-xl uppercase tracking-widest">{c}</span>
                  ))}
                  {!movie.isPremium && (
                    <span className="px-4 py-1.5 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black rounded-xl uppercase tracking-widest flex items-center gap-2">
                      FREE PASS
                    </span>
                  )}
                  <span className="text-gray-600 font-black text-[10px] uppercase">/</span>
                  <span className="text-gray-400 font-bold text-xs uppercase tracking-tighter">Batch: {movie.batchNo}</span>
                </div>
              </div>
            </div>

            {movie.description && (
              <div className="bg-[#111] rounded-[2.5rem] border border-white/5 p-12 shadow-xl group hover:border-white/10 transition-all">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> Description
                </h3>
                <p className="text-lg text-gray-300 font-medium leading-relaxed italic">{movie.description}</p>
              </div>
            )}
          </div>

          {/* Sidebar Section */}
          <aside className="w-full xl:w-[450px] space-y-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Related Lessons</h2>
              <span className="text-[10px] font-black text-gray-500 uppercase">{relatedMovies.length} videos</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-6">
              {relatedMovies.length > 0 ? (
                relatedMovies.map(related => {
                  const isAdmin = user.role === 'admin';
                  const isPremiumUser = user.subscription?.toLowerCase() === 'premium';
                  const isFreeContent = !related.isPremium;
                  const hasSubscribed = related.category?.some(cat => user.subscribedCategories?.includes(cat));

                  const hasRelAccess = isAdmin || isPremiumUser || isFreeContent || hasSubscribed;
                  return (
                    <div
                      key={related._id}
                      onClick={() => navigate(`/movie/${related._id}`)}
                      className="group flex gap-5 bg-[#111] border border-white/5 p-4 rounded-3xl hover:bg-[#161616] hover:border-white/20 transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className="w-36 h-24 flex-shrink-0 rounded-2xl overflow-hidden bg-black border border-white/5 relative">
                        <img src={related.poster} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        {!hasRelAccess && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                            <span className="text-xl">🔒</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 py-1 space-y-2">
                        <h4 className="font-black text-white text-sm uppercase tracking-tighter leading-tight line-clamp-2 group-hover:text-red-500 transition-colors">{related.title}</h4>
                        <div className="flex flex-col gap-1">
                          {related.category?.slice(0, 1).map(c => <span key={c} className="text-[9px] font-bold text-gray-500 uppercase">{c}</span>)}
                          {related.batchNo && (
                            <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">{related.batchNo}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center bg-[#111] rounded-[2.5rem] border border-white/5">
                  <span className="text-4xl block mb-4">🌑</span>
                  <p className="text-xs font-black text-gray-600 uppercase">No related lessons</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
