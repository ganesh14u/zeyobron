import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import SecureVideoPlayer from '../components/SecureVideoPlayer';
import LoadingSpinner from '../components/LoadingSpinner';

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

  const [dynamicDuration, setDynamicDuration] = useState(null);

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

            {/* Cinematic Player Frame */}
            <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-[#000] border border-white/5 shadow-2xl group">
              {movie.videoUrl && hasAccess ? (
                <SecureVideoPlayer
                  videoUrl={movie.videoUrl}
                  videoType={movie.videoType || 'direct'}
                  poster={movie.poster}
                  title={movie.title}
                  onDurationChange={(d) => setDynamicDuration(formatDuration(d))}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#121212] to-[#050505]">
                  {/* Abstract Lock UI */}
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
                      <div className="p-6 bg-white/5 border border-white/10 rounded-3xl text-left space-y-2">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Your Account Permissions</p>
                        <div className="flex flex-wrap gap-2">
                          {user.subscribedCategories?.map(c => <span key={c} className="px-3 py-1 bg-green-500/10 text-green-500 text-[9px] font-black rounded-lg border border-green-500/20 uppercase">{c}</span>)}
                        </div>
                        <p className="text-xs text-red-500 font-bold mt-4 italic">Contact Admin to enable module: "{movie.category?.[0]}"</p>
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
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-tight italic">{movie.title}</h1>
                <div className="flex items-center gap-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  <span className="flex items-center gap-2">⏱️ {dynamicDuration || movie.duration}</span>
                  <span className="flex items-center gap-2">👁️ HD 4K</span>
                  <span className="flex items-center gap-2 uppercase">{movie.videoType === 'youtube' ? 'YouTube' : 'Direct'} Link</span>
                </div>
              </div>
              <div className="flex gap-4">
                <button className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-xl hover:bg-white/10 transition-all" title="Add to List">＋</button>
                <button className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-xl hover:bg-white/10 transition-all" title="Share Content">↗</button>
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
                  const hasRelAccess = related.category?.some(cat => user.subscribedCategories?.includes(cat));
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
                        <div className="flex flex-wrap gap-1">
                          {related.category?.slice(0, 1).map(c => <span key={c} className="text-[9px] font-bold text-gray-500 uppercase">{c}</span>)}
                          <span className="text-gray-700 text-[9px]">•</span>
                          <span className="text-[9px] font-bold text-gray-500 uppercase">{related.duration}</span>
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
