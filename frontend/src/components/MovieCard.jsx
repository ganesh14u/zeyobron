import { Link } from 'react-router-dom';

export default function MovieCard({ movie, userCategories = [] }) {
  // Check if user is signed in
  const token = localStorage.getItem('token');
  const isSignedIn = !!token;
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isPremiumUser = user.subscription === 'premium';

  // Check if user has access:
  // 1. If user is Premium -> Has access to EVERYTHING.
  // 2. If user is NOT Premium -> Check if movie category is in their subscribed list.
  // 3. If movie is NOT Premium (isPremium=false) -> Everyone has access (Free).
  const hasAccess = !movie.isPremium || isPremiumUser || (movie.category?.some(cat => userCategories.includes(cat)));

  // Show premium lock if:
  // - User is NOT signed in (Guest)
  // - OR User doesn't have access (Free user trying to view Premium content without specific category access)
  const showPremiumBadge = !isSignedIn || !hasAccess;

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
            <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-red-600/90 text-white text-[9px] font-black rounded-lg uppercase tracking-widest shadow-lg backdrop-blur-sm">
              Featured
            </div>
          )}

          {/* Hover Play Button Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl transform scale-50 group-hover:scale-100 transition-transform duration-300">
              <span className="text-2xl text-white ml-1">▶</span>
            </div>
          </div>


          {/* Bottom Gradient for Text Protection */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#050505] via-black/80 to-transparent opacity-90"></div>
        </div>

        {/* Minimal Content Below */}
        <div className="mt-4 px-2 space-y-1">
          <h3 className="text-base font-bold text-white leading-tight group-hover:text-red-500 transition-colors line-clamp-1 uppercase tracking-tight">
            {movie.title}
          </h3>
          <div className="flex items-center justify-between text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] pt-0.5">
            <span className="flex items-center gap-1.5 font-black text-red-600">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
              {movie.category && movie.category[0]}
            </span>
            <span className="text-gray-700 opacity-50">/</span>
            <span className="flex items-center gap-1">
              {movie.batchNo || 'LATEST'}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
