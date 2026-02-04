import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MovieCard from '../components/MovieCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { API_URL } from '../config';

export default function Search() {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get('q') || '';

    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userCategories, setUserCategories] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);

    const MOVIES_PER_PAGE = 20;

    useEffect(() => {
        const fetchSearchResults = async () => {
            if (!searchQuery) {
                setMovies([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const config = token ? {
                    headers: { Authorization: `Bearer ${token}` }
                } : {};

                const response = await axios.get(
                    `${API_URL}/movies?q=${encodeURIComponent(searchQuery)}`,
                    config
                );

                setMovies(response.data);

                // Get user's subscribed categories for MovieCard badges
                const user = localStorage.getItem('user');
                if (user) {
                    const userData = JSON.parse(user);
                    setUserCategories(userData.subscribedCategories || []);
                }
            } catch (error) {
                console.error('Error fetching search results:', error);
            } finally {
                setTimeout(() => setLoading(false), 800);
            }
        };

        fetchSearchResults();
        setCurrentPage(0); // Reset to first page on new search
    }, [searchQuery]);

    if (loading) {
        return <LoadingSpinner />;
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
        <main className="min-h-screen bg-[#0a0a0a] pt-32 pb-24 px-6 md:px-12">
            {/* Background Decorative Element */}
            <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-red-600/5 blur-[150px] rounded-full pointer-events-none"></div>

            {/* Header Section */}
            <div className="relative mb-16 space-y-6">
                <button
                    onClick={() => navigate('/')}
                    className="group flex items-center gap-3 text-gray-400 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest"
                >
                    <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-red-600 transition-colors text-white text-sm">←</span>
                    Return to Browse
                </button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] mb-2">Search Results</div>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
                            "{searchQuery}"
                        </h1>
                        <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest pl-1 mt-4">
                            <span>{movies.length} Results Found</span>
                            <span className="text-gray-800">/</span>
                            <span>Visual Archive Sector</span>
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Page {currentPage + 1} of {totalPages}
                        </div>
                    )}
                </div>
            </div>

            {/* Grid Display */}
            {currentMovies.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {currentMovies.map(movie => (
                        <div key={movie._id} className="transform hover:translate-y-[-8px] transition-all duration-300">
                            <MovieCard movie={movie} userCategories={userCategories} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-32 space-y-6 bg-[#111] rounded-[3rem] border border-white/5 border-dashed">
                    <div className="text-6xl animate-pulse">🔍</div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">No Matches Found</h2>
                        <p className="text-gray-500 font-medium italic">We couldn't find any content matching your request in the archive.</p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="px-8 py-3 bg-red-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-900/20"
                    >
                        Terminal Home
                    </button>
                </div>
            )}

            {/* Professional Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-8 mt-24">
                    <button
                        onClick={handlePrevious}
                        disabled={currentPage === 0}
                        className={`flex items-center gap-4 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${currentPage === 0
                            ? 'bg-white/2 text-gray-700 cursor-not-allowed opacity-20'
                            : 'bg-white text-black hover:bg-gray-200 active:scale-95 shadow-xl'
                            }`}
                    >
                        ← Prev
                    </button>

                    <div className="hidden md:flex items-center gap-3">
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setCurrentPage(i);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`w-12 h-12 rounded-2xl font-black text-xs transition-all ${currentPage === i
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                                    : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {String(i + 1).padStart(2, '0')}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleNext}
                        disabled={currentPage === totalPages - 1}
                        className={`flex items-center gap-4 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${currentPage === totalPages - 1
                            ? 'bg-white/2 text-gray-700 cursor-not-allowed opacity-20'
                            : 'bg-white text-black hover:bg-gray-200 active:scale-95 shadow-xl'
                            }`}
                    >
                        Next →
                    </button>
                </div>
            )}
        </main>
    );
}
