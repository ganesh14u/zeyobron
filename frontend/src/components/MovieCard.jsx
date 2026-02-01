import { Link } from 'react-router-dom';

export default function MovieCard({ movie, userCategories = [] }) {
  // Check if user is signed in
  const token = localStorage.getItem('token');
  const isSignedIn = !!token;

  // Check if user has access:
  // 1. If the movie is NOT premium, any signed-in user has access
  // 2. If it is premium, they must have the specific category in their subscribedCategories
  const hasAccess = !movie.isPremium || (movie.category?.some(cat => userCategories.includes(cat)));

  // Show premium lock if:
  // - User is NOT signed in, OR 
  // - Video is premium AND user doesn't have access
  const showPremiumBadge = !isSignedIn || (movie.isPremium && !hasAccess);

  return (
    <div className="w-full flex-shrink-0 group cursor-pointer relative">
      <Link to={`/movie/${movie._id}`}>
        <div className="relative aspect-[2/3] rounded-3xl overflow-hidden bg-[#111] border border-white/5 transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {/* Poster Image */}
          <img
            src={movie.poster}
            alt={movie.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=Module+Image'; }}
          />

          {/* Elegant Overlay Badges */}
          {movie.isPremium ? (
            showPremiumBadge && (
              <div className="absolute top-4 right-4 z-10 p-2 bg-yellow-500/10 backdrop-blur-md border border-yellow-500/20 text-yellow-500 rounded-xl shadow-2xl">
                <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:inline ml-2 mr-2">Premium Access</span>
                <span className="text-sm">🔒</span>
              </div>
            )
          ) : (
            <div className="absolute top-4 right-4 z-10 p-2 bg-green-500/10 backdrop-blur-md border border-green-500/20 text-green-500 rounded-xl shadow-2xl">
              <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:inline ml-2 mr-2">Free Lesson</span>
              <span className="text-sm">🆓</span>
            </div>
          )}

          {movie.featured && (
            <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-red-600 text-white text-[9px] font-black rounded-lg uppercase tracking-widest shadow-xl">
              Featured
            </div>
          )}

          {/* Hover Overlay Info */}
          <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="space-y-3">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{movie.category?.[0]}</p>
                <p className="text-sm font-black text-white uppercase tracking-tighter leading-tight italic">{movie.title}</p>
              </div>
              <div className="flex items-center gap-3 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                <span>{movie.duration}</span>
                <span>•</span>
                <span>{movie.batchNo || 'Standard'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Static Title (Below Card) - Subtle */}
        <div className="mt-4 px-1 space-y-1">
          <h3 className="font-black text-white text-xs uppercase tracking-tighter transition-colors group-hover:text-red-600 truncate">{movie.title}</h3>
          <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{movie.category?.[0] || 'Module'}</p>
        </div>
      </Link>
    </div>
  );
}
