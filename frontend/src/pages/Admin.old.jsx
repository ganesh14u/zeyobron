import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('movies');
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    poster: '', 
    videoUrl: '', 
    category: '',
    year: '',
    duration: '',
    featured: false
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      alert('Please login first');
      navigate('/');
      return;
    }
    
    const userData = JSON.parse(user);
    if (userData.role !== 'admin') {
      alert('Admin access only');
      navigate('/');
      return;
    }

    fetchMovies();
    fetchUsers();
  }, [navigate]);

  const getAuthHeaders = () => ({
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  });

  const fetchMovies = () => {
    axios.get(import.meta.env.VITE_API_URL + '/movies')
      .then(r => setMovies(r.data))
      .catch(err => console.error('Error fetching movies:', err));
  };

  const fetchUsers = () => {
    axios.get(import.meta.env.VITE_API_URL + '/admin/users', getAuthHeaders())
      .then(r => setUsers(r.data))
      .catch(err => console.error('Error fetching users:', err));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const movieData = {
      ...form,
      category: form.category.split(',').map(c => c.trim()),
      year: parseInt(form.year) || null
    };

    try {
      if (editingId) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/admin/movie/${editingId}`,
          movieData,
          getAuthHeaders()
        );
        alert('Movie updated successfully!');
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/admin/movie`,
          movieData,
          getAuthHeaders()
        );
        alert('Movie created successfully!');
      }
      
      setForm({ 
        title: '', 
        description: '', 
        poster: '', 
        videoUrl: '', 
        category: '',
        year: '',
        duration: '',
        featured: false
      });
      setEditingId(null);
      fetchMovies();
    } catch (error) {
      alert('Error saving movie: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (movie) => {
    setForm({
      title: movie.title,
      description: movie.description,
      poster: movie.poster,
      videoUrl: movie.videoUrl,
      category: movie.category?.join(', ') || '',
      year: movie.year?.toString() || '',
      duration: movie.duration || '',
      featured: movie.featured || false
    });
    setEditingId(movie._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this movie?')) return;
    
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/admin/movie/${id}`,
        getAuthHeaders()
      );
      alert('Movie deleted successfully!');
      fetchMovies();
    } catch (error) {
      alert('Error deleting movie: ' + (error.response?.data?.message || error.message));
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ 
      title: '', 
      description: '', 
      poster: '', 
      videoUrl: '', 
      category: '',
      year: '',
      duration: '',
      featured: false
    });
  };

  return (
    <div className="pt-20 px-6 pb-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('movies')}
          className={`px-4 py-2 ${activeTab === 'movies' ? 'border-b-2 border-red-600 text-white' : 'text-gray-400'}`}
        >
          Movies
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 ${activeTab === 'users' ? 'border-b-2 border-red-600 text-white' : 'text-gray-400'}`}
        >
          Users
        </button>
      </div>

      {activeTab === 'movies' && (
        <>
          {/* Movie Form */}
          <div className="bg-gray-800 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Edit Movie' : 'Add New Movie'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Title *"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                className="px-4 py-2 bg-gray-700 rounded"
                required
              />
              <input
                type="number"
                placeholder="Year"
                value={form.year}
                onChange={e => setForm({...form, year: e.target.value})}
                className="px-4 py-2 bg-gray-700 rounded"
              />
              <input
                type="text"
                placeholder="Duration (e.g., 2h 15min)"
                value={form.duration}
                onChange={e => setForm({...form, duration: e.target.value})}
                className="px-4 py-2 bg-gray-700 rounded"
              />
              <input
                type="text"
                placeholder="Categories (comma-separated)"
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value})}
                className="px-4 py-2 bg-gray-700 rounded"
              />
              <input
                type="text"
                placeholder="Poster URL"
                value={form.poster}
                onChange={e => setForm({...form, poster: e.target.value})}
                className="px-4 py-2 bg-gray-700 rounded md:col-span-2"
              />
              <input
                type="text"
                placeholder="Video URL"
                value={form.videoUrl}
                onChange={e => setForm({...form, videoUrl: e.target.value})}
                className="px-4 py-2 bg-gray-700 rounded md:col-span-2"
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                className="px-4 py-2 bg-gray-700 rounded md:col-span-2 h-24"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={e => setForm({...form, featured: e.target.checked})}
                  className="w-4 h-4"
                />
                <span>Featured</span>
              </label>
              <div className="flex gap-2 md:col-span-2">
                <button type="submit" className="px-6 py-2 bg-red-600 rounded hover:bg-red-700">
                  {editingId ? 'Update Movie' : 'Create Movie'}
                </button>
                {editingId && (
                  <button 
                    type="button" 
                    onClick={cancelEdit}
                    className="px-6 py-2 bg-gray-600 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Movies List */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">All Movies ({movies.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-700">
                    <th className="pb-2">Title</th>
                    <th className="pb-2">Year</th>
                    <th className="pb-2">Categories</th>
                    <th className="pb-2">Featured</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {movies.map(movie => (
                    <tr key={movie._id} className="border-b border-gray-700">
                      <td className="py-3">{movie.title}</td>
                      <td className="py-3">{movie.year}</td>
                      <td className="py-3">{movie.category?.join(', ')}</td>
                      <td className="py-3">{movie.featured ? '⭐' : '-'}</td>
                      <td className="py-3">
                        <button
                          onClick={() => handleEdit(movie)}
                          className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(movie._id)}
                          className="px-3 py-1 bg-red-600 rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">All Users ({users.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} className="border-b border-gray-700">
                    <td className="py-3">{user.name}</td>
                    <td className="py-3">{user.email}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-red-600' : 'bg-gray-600'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
