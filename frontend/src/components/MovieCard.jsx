import { Link } from 'react-router-dom';

export default function MovieCard({ movie, userCategories = [] }) {
  // Check if user is signed in
  const token = localStorage.getItem('token');
  const isSignedIn = !!token;
  
  // Check if user has access to ANY of this movie's categories
  const hasAccess = movie.category?.some(cat => userCategories.includes(cat));
  
  // Show lock badge if:
  // - User is NOT signed in (guest), OR
  // - User IS signed in but doesn't have access to any of the movie's categories
  const showPremiumBadge = !isSignedIn || (isSignedIn && !hasAccess);
  
  return (
    <div className="w-48 flex-shrink-0 transition-transform hover:scale-105 cursor-pointer relative">
      {/* Premium/Lock Badge for locked content */}
      {showPremiumBadge && (
        <div className="absolute top-2 right-2 z-10 px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded shadow-lg">
          🔒 PREMIUM
        </div>
      )}
      
      <Link to={`/movie/${movie._id}`}>
        <img 
          src={movie.poster} 
          alt={movie.title} 
          className="rounded-md w-full h-64 object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x450?text=No+Image';
          }}
        />
        <h3 className="mt-2 font-semibold text-sm">{movie.title}</h3>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{movie.batchNo || 'N/A'}</span>
          <span>{movie.duration}</span>
        </div>
      </Link>
    </div>
  );
}
