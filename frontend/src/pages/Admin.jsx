import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/Notification';
import { useConfirm } from '../components/ConfirmDialog';

export default function Admin() {
  const navigate = useNavigate();
  const notify = useNotification();
  const confirm = useConfirm();
  const [movies, setMovies] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('movies');
  
  // Movie form state
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    poster: '', 
    videoUrl: '', 
    videoType: 'youtube',
    category: [],
    batchNo: '',
    duration: '',
    featured: false,
    isPremium: false
  });
  
  // Category form
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    isPremium: false
  });
  
  // Bulk upload state
  const [bulkMovies, setBulkMovies] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  
  // User management
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSubForm, setUserSubForm] = useState({
    subscription: 'free',
    subscribedCategories: []
  });
  
  const [editingId, setEditingId] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all'); // New filter state
  const [selectedMovies, setSelectedMovies] = useState([]); // For bulk delete

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      notify('Please login first', 'error');
      navigate('/');
      return;
    }
    
    const userData = JSON.parse(user);
    if (userData.role !== 'admin') {
      notify('Admin access only', 'error');
      navigate('/');
      return;
    }

    fetchMovies();
    fetchUsers();
    fetchCategories();
  }, [navigate]);

  const getAuthHeaders = () => ({
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  });

  const fetchMovies = () => {
    axios.get(import.meta.env.VITE_API_URL + '/movies', getAuthHeaders())
      .then(r => setMovies(r.data))
      .catch(err => console.error('Error fetching movies:', err));
  };

  const fetchUsers = () => {
    axios.get(import.meta.env.VITE_API_URL + '/admin/users', getAuthHeaders())
      .then(r => setUsers(r.data))
      .catch(err => console.error('Error fetching users:', err));
  };

  const fetchCategories = () => {
    axios.get(import.meta.env.VITE_API_URL + '/admin/categories', getAuthHeaders())
      .then(r => setCategories(r.data))
      .catch(err => console.error('Error fetching categories:', err));
  };

  // Movie CRUD
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/admin/movie/${editingId}`,
          form,
          getAuthHeaders()
        );
        notify('Video updated successfully!', 'success');
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/admin/movie`,
          form,
          getAuthHeaders()
        );
        notify('Video created successfully!', 'success');
      }
      
      resetForm();
      fetchMovies();
    } catch (error) {
      notify('Error saving video: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleCSVUpload = async () => {
    if (!csvFile) {
      notify('Please select a CSV file', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/movies/bulk-csv`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: 'Bearer ' + localStorage.getItem('token')
          }
        }
      );
      
      let message = `Successfully uploaded ${response.data.count} video(s)!`;
      if (response.data.warning) {
        message += `\n\n⚠️ ${response.data.warning}`;
      }
      
      notify(message, response.data.warning ? 'warning' : 'success');
      setCsvFile(null);
      document.getElementById('csvInput').value = '';
      fetchMovies();
    } catch (error) {
      notify('Error uploading CSV: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleEdit = (movie) => {
    setForm({
      title: movie.title,
      description: movie.description,
      poster: movie.poster,
      videoUrl: movie.videoUrl,
      videoType: movie.videoType || 'youtube',
      category: movie.category || [],
      batchNo: movie.batchNo || '',
      duration: movie.duration || '',
      featured: movie.featured || false,
      isPremium: movie.isPremium || false
    });
    setEditingId(movie._id);
    setActiveTab('movies');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm('Are you sure you want to delete this video?', 'Delete Video');
    if (!confirmed) return;
    
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/admin/movie/${id}`, getAuthHeaders());
      notify('Video deleted successfully!', 'success');
      fetchMovies();
    } catch (error) {
      notify('Error deleting video: ' + error.message, 'error');
    }
  };

  const resetForm = () => {
    setForm({ 
      title: '', description: '', poster: '', videoUrl: '', videoType: 'youtube',
      category: [], batchNo: '', duration: '', featured: false, isPremium: false
    });
    setEditingId(null);
  };

  // Category Management
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/category`,
        categoryForm,
        getAuthHeaders()
      );
      notify('Category created successfully!', 'success');
      setCategoryForm({ name: '', description: '', isPremium: false });
      fetchCategories();
    } catch (error) {
      notify('Error: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const deleteCategory = async (id) => {
    const confirmed = await confirm('Are you sure you want to delete this category?', 'Delete Category');
    if (!confirmed) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/admin/category/${id}`, getAuthHeaders());
      notify('Category deleted successfully!', 'success');
      fetchCategories();
    } catch (error) {
      notify('Error: ' + error.message, 'error');
    }
  };

  // User Management
  const updateUserSubscription = async (userId) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/user/${userId}/subscription`,
        userSubForm,
        getAuthHeaders()
      );
      notify('User updated successfully!', 'success');
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      notify('Error: ' + error.message, 'error');
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/user/${userId}/toggle-status`,
        {},
        getAuthHeaders()
      );
      fetchUsers();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const updateUserStatus = async (userId, status) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/user/${userId}/status`,
        { status },
        getAuthHeaders()
      );
      fetchUsers();
      if (status === 'revoked') {
        notify('User access revoked. All categories and subscription cleared.', 'warning');
      } else {
        notify('User activated successfully!', 'success');
      }
    } catch (error) {
      notify('Error: ' + error.message, 'error');
    }
  };

  const deleteUser = async (userId, userEmail) => {
    // Prevent deleting admin@netflix.com
    if (userEmail === 'admin@netflix.com') {
      notify('Cannot delete the main admin account', 'error');
      return;
    }
    
    const confirmed = await confirm(
      'Are you sure you want to permanently delete this user? This action cannot be undone.',
      'Delete User'
    );
    if (!confirmed) return;
    
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/admin/user/${userId}`,
        getAuthHeaders()
      );
      notify('User deleted successfully', 'success');
      fetchUsers();
    } catch (error) {
      notify('Error deleting user: ' + error.message, 'error');
    }
  };

  const toggleCategorySelection = (cat) => {
    setForm(prev => ({
      ...prev,
      category: prev.category.includes(cat)
        ? prev.category.filter(c => c !== cat)
        : [...prev.category, cat]
    }));
  };

  const toggleUserCategory = (cat) => {
    // Prevent removing "Big Data Free" - it's the default locked category
    const isRemoving = userSubForm.subscribedCategories.includes(cat);
    const isDefaultCategory = cat === 'Big Data Free';
    
    if (isDefaultCategory && isRemoving) {
      notify('"Big Data Free" is locked by default and cannot be removed', 'warning');
      return;
    }
    
    setUserSubForm(prev => {
      const newCategories = prev.subscribedCategories.includes(cat)
        ? prev.subscribedCategories.filter(c => c !== cat)
        : [...prev.subscribedCategories, cat];
      
      // Auto-switch subscription based on category count:
      // 1 category = Free, 2+ categories = Premium
      const newSubscription = newCategories.length > 1 ? 'premium' : 'free';
      
      return {
        ...prev,
        subscribedCategories: newCategories,
        subscription: newSubscription
      };
    });
  };

  // Bulk delete functions
  const handleBulkDelete = async () => {
    if (selectedMovies.length === 0) {
      notify('Please select videos to delete', 'warning');
      return;
    }
    
    const confirmed = await confirm(
      `Are you sure you want to delete ${selectedMovies.length} video(s)?`,
      'Bulk Delete Videos'
    );
    if (!confirmed) return;
    
    try {
      await Promise.all(
        selectedMovies.map(id => 
          axios.delete(`${import.meta.env.VITE_API_URL}/admin/movie/${id}`, getAuthHeaders())
        )
      );
      notify(`${selectedMovies.length} video(s) deleted successfully!`, 'success');
      setSelectedMovies([]);
      fetchMovies();
    } catch (error) {
      notify('Error deleting videos: ' + error.message, 'error');
    }
  };

  const toggleMovieSelection = (movieId) => {
    setSelectedMovies(prev => 
      prev.includes(movieId) 
        ? prev.filter(id => id !== movieId)
        : [...prev, movieId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMovies.length === movies.length) {
      setSelectedMovies([]);
    } else {
      setSelectedMovies(movies.map(m => m._id));
    }
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
          Videos
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          className={`px-4 py-2 ${activeTab === 'bulk' ? 'border-b-2 border-red-600 text-white' : 'text-gray-400'}`}
        >
          Bulk Upload
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 ${activeTab === 'categories' ? 'border-b-2 border-red-600 text-white' : 'text-gray-400'}`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 ${activeTab === 'users' ? 'border-b-2 border-red-600 text-white' : 'text-gray-400'}`}
        >
          Users
        </button>
      </div>

      {/* MOVIES TAB */}
      {activeTab === 'movies' && (
        <>
          <div className="bg-gray-800 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Video' : 'Add New Video'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Title *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="px-4 py-2 bg-gray-700 rounded" required />
              <input type="text" placeholder="Batch No (e.g., BATCH-2024-001)" value={form.batchNo} onChange={e => setForm({...form, batchNo: e.target.value})} className="px-4 py-2 bg-gray-700 rounded" />
              <input type="text" placeholder="Duration (e.g., 2h 15min)" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} className="px-4 py-2 bg-gray-700 rounded" />
              <input type="text" placeholder="Poster URL" value={form.poster} onChange={e => setForm({...form, poster: e.target.value})} className="px-4 py-2 bg-gray-700 rounded md:col-span-2" />
              <input type="text" placeholder="Video URL" value={form.videoUrl} onChange={e => setForm({...form, videoUrl: e.target.value})} className="px-4 py-2 bg-gray-700 rounded md:col-span-2" />
              
              {/* Video Type Selector */}
              <div className="md:col-span-2">
                <label className="block text-sm mb-2">Video Type:</label>
                <select 
                  value={form.videoType} 
                  onChange={e => setForm({...form, videoType: e.target.value})} 
                  className="w-full px-4 py-2 bg-gray-700 rounded"
                >
                  <option value="youtube">YouTube (Private Link)</option>
                  <option value="direct">Direct Video URL</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">Select YouTube for private YouTube links with secure playback</p>
              </div>
              
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="px-4 py-2 bg-gray-700 rounded md:col-span-2 h-24" />
              
              {/* Category selection */}
              <div className="md:col-span-2">
                <label className="block text-sm mb-2">Categories:</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => toggleCategorySelection(cat.name)}
                      className={`px-3 py-1 rounded text-sm ${
                        form.category.includes(cat.name) ? 'bg-red-600' : 'bg-gray-700'
                      }`}
                    >
                      {cat.name} {cat.isPremium && '⭐'}
                    </button>
                  ))}
                </div>
              </div>
              
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.featured} onChange={e => setForm({...form, featured: e.target.checked})} className="w-4 h-4" />
                <span>Featured</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.isPremium} onChange={e => setForm({...form, isPremium: e.target.checked})} className="w-4 h-4" />
                <span>🔒 Premium Content</span>
              </label>
              
              <div className="flex gap-2 md:col-span-2">
                <button type="submit" className="px-6 py-2 bg-red-600 rounded hover:bg-red-700">
                  {editingId ? 'Update Video' : 'Create Video'}
                </button>
                {editingId && <button type="button" onClick={resetForm} className="px-6 py-2 bg-gray-600 rounded hover:bg-gray-700">Cancel</button>}
              </div>
            </form>
          </div>

          {/* Movies List */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">All Videos ({movies.length})</h2>
              {selectedMovies.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-semibold"
                >
                  🗑️ Delete Selected ({selectedMovies.length})
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-700">
                    <th className="pb-2">
                      <input
                        type="checkbox"
                        checked={selectedMovies.length === movies.length && movies.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4"
                      />
                    </th>
                    <th className="pb-2">Title</th>
                    <th className="pb-2">Batch</th>
                    <th className="pb-2">Categories</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {movies.map(movie => (
                    <tr key={movie._id} className="border-b border-gray-700">
                      <td className="py-3">
                        <input
                          type="checkbox"
                          checked={selectedMovies.includes(movie._id)}
                          onChange={() => toggleMovieSelection(movie._id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="py-3">{movie.title} {movie.featured && '⭐'}</td>
                      <td className="py-3">{movie.batchNo}</td>
                      <td className="py-3 text-sm">{movie.category?.join(', ')}</td>
                      <td className="py-3">{movie.isPremium ? '🔒 Premium' : '🆓 Free'}</td>
                      <td className="py-3">
                        <button onClick={() => handleEdit(movie)} className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 mr-2 text-sm">Edit</button>
                        <button onClick={() => handleDelete(movie._id)} className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 text-sm">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* BULK UPLOAD TAB */}
      {activeTab === 'bulk' && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-6">Bulk Upload Videos via CSV</h2>
          
          {/* Download Sample CSV */}
          <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-blue-400">📥 Download Sample CSV Template</h3>
            <p className="text-sm text-gray-400 mb-3">Download a sample CSV file with correct format and example data</p>
            <a
              href={`${import.meta.env.VITE_API_URL}/admin/movies/sample-csv`}
              download="sample-movies.csv"
              className="inline-block px-6 py-2 bg-blue-600 rounded hover:bg-blue-700 font-semibold"
              onClick={(e) => {
                e.preventDefault();
                fetch(`${import.meta.env.VITE_API_URL}/admin/movies/sample-csv`, {
                  headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
                })
                .then(res => res.blob())
                .then(blob => {
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'sample-movies.csv';
                  a.click();
                  window.URL.revokeObjectURL(url);
                })
                .catch(err => alert('Error downloading sample: ' + err.message));
              }}
            >
              ⬇️ Download Sample CSV
            </a>
          </div>
          
          {/* CSV Upload Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Upload CSV File</h3>
            <p className="text-sm text-gray-400 mb-4">CSV columns: title, description, poster, videoUrl, videoType, category (comma-separated), batchNo, duration, featured (true/false), isPremium (true/false)</p>
            
            <div className="space-y-4">
              <input
                id="csvInput"
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files[0])}
                className="w-full px-4 py-2 bg-gray-700 rounded"
              />
              <button
                onClick={handleCSVUpload}
                className="px-6 py-2 bg-green-600 rounded hover:bg-green-700"
              >
                📤 Upload CSV File
              </button>
            </div>
            
            <div className="mt-4 p-4 bg-gray-900 rounded">
              <p className="text-xs font-bold mb-2">📋 CSV Format Requirements:</p>
              <ul className="text-xs text-gray-400 space-y-1 mb-3">
                <li>• <strong>title</strong> - Required, movie title</li>
                <li>• <strong>description</strong> - Optional, movie description</li>
                <li>• <strong>poster</strong> - Optional, image URL</li>
                <li>• <strong>videoUrl</strong> - Optional, YouTube or direct video URL</li>
                <li>• <strong>videoType</strong> - Optional, "youtube" or "direct" (default: direct)</li>
                <li>• <strong>category</strong> - Optional, comma-separated categories in quotes "Action,Drama"</li>
                <li>• <strong>batchNo</strong> - Optional, batch identifier</li>
                <li>• <strong>duration</strong> - Optional, e.g., "2h 15min"</li>
                <li>• <strong>featured</strong> - Optional, "true" or "false"</li>
                <li>• <strong>isPremium</strong> - Optional, "true" or "false"</li>
              </ul>
              <p className="text-xs font-bold mb-2">Example CSV Format:</p>
              <pre className="text-xs text-gray-400 overflow-x-auto">title,description,poster,videoUrl,videoType,category,batchNo,duration,featured,isPremium
Movie Name,Great movie,https://poster.jpg,https://youtube.com/watch?v=ABC,youtube,"Action,Drama",BATCH-2024-001,2h 15min,true,true</pre>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <>
          <div className="bg-gray-800 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-bold mb-4">Create New Category</h2>
            <form onSubmit={handleCategorySubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Category Name *" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} className="px-4 py-2 bg-gray-700 rounded" required />
              <input type="text" placeholder="Description" value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} className="px-4 py-2 bg-gray-700 rounded" />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={categoryForm.isPremium} onChange={e => setCategoryForm({...categoryForm, isPremium: e.target.checked})} className="w-4 h-4" />
                <span>Premium Category</span>
              </label>
              <button type="submit" className="px-6 py-2 bg-red-600 rounded hover:bg-red-700">Create Category</button>
            </form>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">All Categories ({categories.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map(cat => (
                <div key={cat._id} className="bg-gray-700 p-4 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold">{cat.name}</h3>
                    {cat.isPremium && <span className="text-yellow-500">⭐</span>}
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{cat.description}</p>
                  <button onClick={() => deleteCategory(cat._id)} className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 text-sm">Delete</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              User Management ({users.filter(user => {
                // Apply same filters to count
                if (userSearchQuery) {
                  const query = userSearchQuery.toLowerCase();
                  const matchesText = (
                    user.name?.toLowerCase().includes(query) ||
                    user.email?.toLowerCase().includes(query) ||
                    user.phone?.toLowerCase().includes(query)
                  );
                  if (!matchesText) return false;
                }
                if (subscriptionFilter !== 'all') {
                  if (subscriptionFilter === 'free' && user.subscription !== 'free') return false;
                  if (subscriptionFilter === 'premium' && user.subscription !== 'premium') return false;
                }
                return true;
              }).length} / {users.length})
            </h2>
            {(userSearchQuery || subscriptionFilter !== 'all') && (
              <button
                onClick={() => {
                  setUserSearchQuery('');
                  setSubscriptionFilter('all');
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                ❌ Clear Filters
              </button>
            )}
          </div>
          
          {/* Search and Filter Bar */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Text Search */}
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search by name, email, or phone number..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-red-600"
              />
            </div>
            
            {/* Subscription Filter */}
            <div>
              <select
                value={subscriptionFilter}
                onChange={(e) => setSubscriptionFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-red-600"
              >
                <option value="all">All Subscriptions</option>
                <option value="free">📌 Free Only</option>
                <option value="premium">⭐ Premium Only</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Phone</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2">Subscription</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter(user => {
                    // Text search filter
                    if (userSearchQuery) {
                      const query = userSearchQuery.toLowerCase();
                      const matchesText = (
                        user.name?.toLowerCase().includes(query) ||
                        user.email?.toLowerCase().includes(query) ||
                        user.phone?.toLowerCase().includes(query)
                      );
                      if (!matchesText) return false;
                    }
                    
                    // Subscription filter
                    if (subscriptionFilter !== 'all') {
                      if (subscriptionFilter === 'free' && user.subscription !== 'free') return false;
                      if (subscriptionFilter === 'premium' && user.subscription !== 'premium') return false;
                    }
                    
                    return true;
                  })
                  .map(user => (
                  <tr key={user._id} className="border-b border-gray-700">
                    <td className="py-3">{user.name}</td>
                    <td className="py-3">{user.email}</td>
                    <td className="py-3">{user.phone || 'N/A'}</td>
                    <td className="py-3"><span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-red-600' : 'bg-gray-600'}`}>{user.role}</span></td>
                    <td className="py-3">
                      <div className="text-sm">
                        <div className={user.subscription === 'premium' ? 'text-yellow-400' : 'text-gray-400'}>
                          {user.subscription === 'premium' ? '⭐ Premium' : '📌 Free'}
                        </div>
                        {user.subscribedCategories?.length > 0 && (
                          <div className="text-xs text-green-400">{user.subscribedCategories.length} categories</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <select
                        value={user.isActive ? 'active' : 'revoked'}
                        onChange={(e) => updateUserStatus(user._id, e.target.value)}
                        className={`px-3 py-1 rounded text-xs font-semibold ${user.isActive ? 'bg-green-600' : 'bg-red-600'}`}
                      >
                        <option value="active" className="bg-gray-800">Active</option>
                        <option value="revoked" className="bg-gray-800">Revoke</option>
                      </select>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { 
                            setSelectedUser(user); 
                            setUserSubForm({ 
                              subscription: user.subscription, 
                              subscribedCategories: user.subscribedCategories || [] 
                            }); 
                          }} 
                          className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 text-sm"
                        >
                          Manage
                        </button>
                        <button 
                          onClick={() => deleteUser(user._id, user.email)} 
                          className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 text-sm"
                          disabled={user.email === 'admin@netflix.com'}
                          style={{ 
                            opacity: user.email === 'admin@netflix.com' ? 0.5 : 1,
                            cursor: user.email === 'admin@netflix.com' ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* User Subscription Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
              <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">Manage: {selectedUser.name}</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2">Subscription Type:</label>
                    <select 
                      value={userSubForm.subscription} 
                      onChange={e => setUserSubForm({...userSubForm, subscription: e.target.value})} 
                      className="w-full px-4 py-2 bg-gray-700 rounded"
                      disabled={userSubForm.subscribedCategories.length !== 1}
                    >
                      <option value="free">Free</option>
                      <option value="premium">Premium (Lifetime)</option>
                    </select>
                    {userSubForm.subscribedCategories.length === 1 && userSubForm.subscription === 'free' && (
                      <p className="text-xs text-green-400 mt-2">✓ Single category = Free subscription</p>
                    )}
                    {userSubForm.subscribedCategories.length > 1 && userSubForm.subscription === 'premium' && (
                      <p className="text-xs text-yellow-400 mt-2">✓ Auto-switched to Premium (2+ categories selected)</p>
                    )}
                    {userSubForm.subscribedCategories.length > 1 && (
                      <p className="text-xs text-blue-400 mt-2">ℹ️ Multiple categories require Premium subscription</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-2">Subscribed Categories (Required for Access):</label>
                    <p className="text-xs text-gray-400 mb-2">Select categories this user can access. "Big Data Free" is locked by default.</p>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => {
                        const isSelected = userSubForm.subscribedCategories.includes(cat.name);
                        const isDefaultCategory = cat.name === 'Big Data Free';
                        const isLocked = isDefaultCategory && isSelected;
                        
                        return (
                          <button 
                            key={cat._id} 
                            type="button" 
                            onClick={() => toggleUserCategory(cat.name)} 
                            className={`px-3 py-1 rounded text-sm transition-all ${
                              isSelected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'
                            } ${isLocked ? 'ring-2 ring-yellow-400' : ''}`}
                            title={isLocked ? 'Default category - Always locked' : ''}
                          >
                            {cat.name}
                            {isLocked && <span className="ml-1 text-yellow-400">🔒</span>}
                          </button>
                        );
                      })}
                    </div>
                    {userSubForm.subscribedCategories.includes('Big Data Free') && (
                      <p className="text-xs text-yellow-400 mt-2">🔒 "Big Data Free" is the default category and cannot be removed</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <button onClick={() => updateUserSubscription(selectedUser._id)} className="flex-1 px-6 py-2 bg-green-600 rounded hover:bg-green-700">Save Changes</button>
                    <button onClick={() => setSelectedUser(null)} className="px-6 py-2 bg-gray-600 rounded hover:bg-gray-700">Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
