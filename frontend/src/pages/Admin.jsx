import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/Notification';
import { useConfirm } from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Admin() {
  const navigate = useNavigate();
  const notify = useNotification();
  const confirm = useConfirm();

  const [movies, setMovies] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: '', description: '', poster: '', videoUrl: '', videoType: 'youtube',
    category: [], batchNo: '', duration: '', featured: false, isPremium: false
  });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', isPremium: false });
  const [userSubForm, setUserSubForm] = useState({ subscription: 'free', subscribedCategories: [] });
  const [editingId, setEditingId] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [csvFile, setCsvFile] = useState(null);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchData = async () => {
    try {
      const [m, u, c] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/movies`, getAuthHeaders()),
        axios.get(`${import.meta.env.VITE_API_URL}/admin/users`, getAuthHeaders()),
        axios.get(`${import.meta.env.VITE_API_URL}/admin/categories`, getAuthHeaders())
      ]);
      setMovies(m.data);
      setUsers(u.data);
      setCategories(c.data);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.role !== 'admin') return navigate('/');
    fetchData();
  }, [navigate]);

  // Helper to fix Google Drive URLs
  const fixGDriveUrl = (url) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://docs.google.com/uc?export=view&id=${match[1]}`;
      }
    }
    return url;
  };

  const handleMovieSubmit = async (e) => {
    e.preventDefault();
    try {
      const cleanedForm = {
        ...form,
        poster: fixGDriveUrl(form.poster),
        category: Array.isArray(form.category) ? form.category : (typeof form.category === 'string' ? form.category.split(',').map(c => c.trim()) : [])
      };
      const endpoint = editingId ? `/admin/movie/${editingId}` : '/admin/movie';
      await axios[editingId ? 'put' : 'post'](`${import.meta.env.VITE_API_URL}${endpoint}`, cleanedForm, getAuthHeaders());
      notify(`Content ${editingId ? 'Updated' : 'Published'}`, 'success');
      setForm({ title: '', description: '', poster: '', videoUrl: '', videoType: 'youtube', category: [], batchNo: '', duration: '', featured: false, isPremium: false });
      setEditingId(null);
      fetchData();
    } catch (err) { notify(err.response?.data?.message || err.message, 'error'); }
  };

  const handleUserUpdate = async (userId) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/admin/user/${userId}/subscription`, userSubForm, getAuthHeaders());
      notify('Access Updated', 'success');
      setSelectedUser(null);
      fetchData();
    } catch (err) { notify(err.message, 'error'); }
  };

  const toggleCategory = (catName) => {
    setForm(prev => {
      const current = prev.category || [];
      const updated = current.includes(catName) ? current.filter(c => c !== catName) : [...current, catName];
      return { ...prev, category: updated };
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111] border-r border-white/5 fixed h-full z-40 hidden md:flex flex-col">
        <div className="p-8"><h2 className="text-2xl font-black text-red-600 tracking-tighter">DATA SAI.ADMIN</h2></div>
        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: 'overview', label: 'Dashboard', i: '📊' },
            { id: 'movies', label: 'Library', i: '🎥' },
            { id: 'users', label: 'Members', i: '👥' },
            { id: 'categories', label: 'Modules', i: '📂' },
            { id: 'bulk', label: 'Automate', i: '⚡' },
          ].map(t => (
            <button
              key={t.id} onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === t.id ? 'bg-red-600 shadow-lg shadow-red-900/20 text-white' : 'text-gray-500 hover:bg-white/5'}`}
            >
              <span>{t.i}</span> {t.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 flex-1 p-6 md:p-12 overflow-x-hidden">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">{activeTab}</h1>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Management Dashboard</p>
          </div>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5">← Exit Admin</button>
        </header>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
            {[
              { l: 'Total Lessons', v: movies.length, c: 'from-blue-600 to-blue-400' },
              { l: 'Registered Users', v: users.length, c: 'from-purple-600 to-purple-400' },
              { l: 'Premium Users', v: users.filter(u => u.subscription === 'premium').length, c: 'from-yellow-600 to-yellow-400' },
              { l: 'Total Categories', v: categories.length, c: 'from-red-600 to-red-400' },
            ].map(s => (
              <div key={s.l} className="bg-[#161616] p-8 rounded-[2rem] border border-white/5 shadow-xl transition-all hover:border-white/10">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.c} mb-4 shadow-lg`}></div>
                <div className="text-3xl font-black leading-none">{s.v}</div>
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">{s.l}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'movies' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-[#161616] rounded-[2.5rem] p-10 border border-white/5 shadow-2xl">
              <h3 className="text-xl font-black uppercase tracking-tighter mb-8 italic text-red-600">{editingId ? 'Edit Lesson' : 'Add New Lesson'}</h3>
              <form onSubmit={handleMovieSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Lesson Title</label>
                    <input type="text" placeholder="e.g. Advanced Big Data Analytics" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="px-6 py-5 bg-black/40 border border-white/10 rounded-2xl w-full focus:border-red-600 outline-none transition-all font-bold" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Poster Image URL</label>
                    <input type="text" placeholder="Paste poster URL here" value={form.poster} onChange={e => setForm({ ...form, poster: e.target.value })} className="px-6 py-5 bg-black/40 border border-white/10 rounded-2xl w-full focus:border-red-600 outline-none transition-all font-mono text-xs" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Video Source URL</label>
                    <input type="text" placeholder="YouTube URL or Direct MP4 Link" value={form.videoUrl} onChange={e => setForm({ ...form, videoUrl: e.target.value })} className="px-6 py-5 bg-black/40 border border-white/10 rounded-2xl w-full focus:border-red-600 outline-none transition-all font-mono text-xs" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Video Type</label>
                    <select value={form.videoType} onChange={e => setForm({ ...form, videoType: e.target.value })} className="px-6 py-5 bg-black/40 border border-white/10 rounded-2xl w-full focus:border-red-600 outline-none transition-all font-black uppercase text-[10px] tracking-widest appearance-none">
                      <option value="youtube">YouTube</option><option value="direct">Direct MP4/m3u8</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Batch / Session No</label>
                    <input type="text" placeholder="e.g. Session 01, L1-V2" value={form.batchNo} onChange={e => setForm({ ...form, batchNo: e.target.value })} className="px-6 py-5 bg-black/40 border border-white/10 rounded-2xl w-full focus:border-red-600 outline-none transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Duration</label>
                    <input type="text" placeholder="e.g. 1h 24m 10s" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className="px-6 py-5 bg-black/40 border border-white/10 rounded-2xl w-full focus:border-red-600 outline-none transition-all font-bold" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Access Type</label>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setForm({ ...form, isPremium: !form.isPremium })} className={`flex-1 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${form.isPremium ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-900/20' : 'bg-white/5 text-gray-500 hover:text-white border border-white/5'}`}>
                        {form.isPremium ? '🔒 Premium Access' : '🆓 Free Access'}
                      </button>
                      <button type="button" onClick={() => setForm({ ...form, featured: !form.featured })} className={`flex-1 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${form.featured ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'bg-white/5 text-gray-500 hover:text-white border border-white/5'}`}>
                        {form.featured ? '★ Featured' : '☆ Regular'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Assign Categories (Toggle to select)</label>
                  <div className="flex flex-wrap gap-2 p-6 bg-black/20 rounded-3xl border border-white/10">
                    {categories.map(cat => {
                      const isSel = (form.category || []).includes(cat.name);
                      return (
                        <button key={cat._id} type="button" onClick={() => toggleCategory(cat.name)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${isSel ? 'bg-white text-black' : 'bg-white/5 text-gray-600 hover:text-white hover:bg-white/10'}`}>{cat.name}</button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Description</label>
                  <textarea rows="4" placeholder="Enter comprehensive lesson details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="px-6 py-5 bg-black/40 border border-white/10 rounded-2xl w-full focus:border-red-600 outline-none transition-all resize-none font-medium"></textarea>
                </div>

                <div className="flex gap-6">
                  <button type="submit" className="flex-1 py-6 bg-red-600 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.01] active:scale-95 transition-all shadow-2xl shadow-red-900/20 text-sm">{editingId ? 'Update Lesson' : 'Publish Lesson'}</button>
                  {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ title: '', description: '', poster: '', videoUrl: '', videoType: 'youtube', category: [], batchNo: '', duration: '', featured: false, isPremium: false }); }} className="px-12 bg-white/5 text-white border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all">Cancel</button>}
                </div>
              </form>
            </div>

            <div className="bg-[#161616] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 bg-black/20">
                      <th className="p-10">Lesson Details</th>
                      <th className="p-10">Subscription</th>
                      <th className="p-10">Categories</th>
                      <th className="p-10 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {movies.map(m => (
                      <tr key={m._id} className="group hover:bg-white/[0.01] transition-all">
                        <td className="p-10 flex items-center gap-8">
                          <div className="relative w-16 h-24 rounded-2xl overflow-hidden bg-black border border-white/10 group-hover:border-red-600/50 transition-all shadow-xl">
                            <img src={m.poster} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                            {m.featured && <div className="absolute top-0 right-0 p-1.5 bg-red-600 text-[8px] font-black tracking-widest">★</div>}
                          </div>
                          <div className="space-y-2">
                            <p className="font-black text-white text-lg uppercase tracking-tighter leading-none italic group-hover:text-red-500 transition-colors">{m.title}</p>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{m.batchNo || 'Standard'}</span>
                              <span className="w-1 h-1 bg-gray-800 rounded-full"></span>
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{m.duration}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-10">
                          <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest inline-block ${m.isPremium ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                            {m.isPremium ? '🔒 Premium' : '🆓 Free'}
                          </span>
                        </td>
                        <td className="p-10">
                          <div className="flex flex-wrap gap-2 max-w-[250px]">
                            {m.category?.map(c => <span key={c} className="px-3 py-1 bg-white/5 text-gray-500 text-[8px] font-black rounded-lg border border-white/5 hover:text-white transition-colors">{c}</span>)}
                          </div>
                        </td>
                        <td className="p-10 text-right">
                          <div className="flex justify-end gap-3 opacity-30 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingId(m._id); setForm(m); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white text-black transition-all shadow-lg">✏️</button>
                            <button onClick={async () => { if (await confirm(`Are you sure you want to delete "${m.title}"?`)) { await axios.delete(`${import.meta.env.VITE_API_URL}/admin/movie/${m._id}`, getAuthHeaders()); fetchData(); } }} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-600 hover:border-red-600 transition-all shadow-lg font-bold">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-6">
              <input type="text" placeholder="Search by email or name..." value={userSearchQuery} onChange={e => setUserSearchQuery(e.target.value)} className="flex-1 px-10 py-6 bg-[#161616] border border-white/10 rounded-[2.5rem] focus:border-red-600 focus:outline-none font-bold placeholder:text-gray-700 shadow-2xl" />
              <div className="px-10 py-6 bg-[#161616] rounded-[2.5rem] border border-white/10 flex items-center gap-8 shadow-2xl">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Filter Status</span>
                <div className="flex gap-4">
                  {['all', 'premium', 'free'].map(st => (
                    <button key={st} onClick={() => setSubscriptionFilter(st)} className={`text-[10px] font-black uppercase tracking-widest transition-colors ${subscriptionFilter === st ? 'text-red-600' : 'text-gray-600 hover:text-white'}`}>{st}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#161616] rounded-[3.5rem] border border-white/5 overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 bg-black/20">
                    <th className="p-12">User Details</th>
                    <th className="p-12">Subscription</th>
                    <th className="p-12">Authorized Categories</th>
                    <th className="p-12 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users
                    .filter(u => u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) || u.name.toLowerCase().includes(userSearchQuery.toLowerCase()))
                    .filter(u => subscriptionFilter === 'all' || u.subscription === subscriptionFilter)
                    .map(u => (
                      <tr key={u._id} className="group hover:bg-white/[0.01] transition-all">
                        <td className="p-12">
                          <div className="space-y-1">
                            <p className="font-black text-white text-xl uppercase tracking-tighter italic leading-none">{u.name}</p>
                            <p className="text-xs font-bold text-gray-600">{u.email}</p>
                          </div>
                        </td>
                        <td className="p-12">
                          <span className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 w-fit ${u.subscription === 'premium' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-gray-800/10 text-gray-600 border border-white/5'}`}>
                            {u.subscription === 'premium' && <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>}
                            {u.subscription === 'premium' ? 'Premium Access' : 'Free Plan'}
                          </span>
                        </td>
                        <td className="p-12">
                          <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                            {u.subscribedCategories?.length > 0 ? u.subscribedCategories.map(c => (
                              <span key={c} className="px-3 py-1 bg-green-500/5 text-green-500 text-[9px] font-black rounded-lg border border-green-500/20 uppercase tracking-tighter">{c}</span>
                            )) : <span className="text-[10px] font-bold text-gray-800 italic uppercase tracking-widest">No Category Access</span>}
                          </div>
                        </td>
                        <td className="p-12 text-right">
                          <button onClick={() => { setSelectedUser(u); setUserSubForm({ subscription: u.subscription, subscribedCategories: u.subscribedCategories || [] }) }} className="px-10 py-4 bg-white text-black text-[10px] font-black rounded-[1.5rem] hover:bg-red-600 hover:text-white active:scale-95 transition-all shadow-xl uppercase tracking-widest">Edit Access</button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-16 animate-in fade-in duration-500">
            <div className="bg-[#161616] p-12 rounded-[3.5rem] border border-white/5 max-w-2xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-red-600/5 blur-[50px]"></div>
              <h3 className="text-2xl font-black uppercase mb-10 italic tracking-tighter">Create New Category</h3>
              <form onSubmit={async (e) => { e.preventDefault(); await axios.post(`${import.meta.env.VITE_API_URL}/admin/category`, categoryForm, getAuthHeaders()); setCategoryForm({ name: '', description: '', isPremium: false }); fetchData(); notify('Category Created Successfully', 'success'); }} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Category Name</label>
                  <input type="text" placeholder="e.g. Big Data" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} className="px-8 py-5 bg-black/40 border border-white/10 rounded-2xl w-full font-black uppercase text-sm focus:border-red-600 outline-none transition-all" required />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Description</label>
                  <textarea value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} className="px-8 py-5 bg-black/40 border border-white/10 rounded-2xl w-full resize-none h-32 font-medium focus:border-red-600 outline-none transition-all" placeholder="Enter category details..."></textarea>
                </div>
                <button type="submit" className="w-full py-6 bg-white text-black font-black uppercase rounded-[2rem] shadow-2xl hover:bg-red-600 hover:text-white transition-all tracking-widest text-xs">Create Category</button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {categories.map(c => (
                <div key={c._id} className="bg-[#161616] p-10 rounded-[3rem] border border-white/5 relative group hover:border-red-600/30 transition-all shadow-2xl">
                  <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">📂</div>
                  <h4 className="font-black uppercase text-white mb-3 text-lg tracking-tighter italic">{c.name}</h4>
                  <p className="text-[11px] font-bold text-gray-600 uppercase mb-10 line-clamp-3 leading-relaxed">{c.description || 'No description provided.'}</p>
                  <button onClick={async () => { if (await confirm(`Are you sure you want to delete category: "${c.name}"?`)) { await axios.delete(`${import.meta.env.VITE_API_URL}/admin/category/${c._id}`, getAuthHeaders()); fetchData(); } }} className="w-full py-4 bg-red-600/10 text-red-500 rounded-2xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all border border-red-600/20 shadow-lg">Delete Category</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bulk Integration */}
        {activeTab === 'bulk' && (
          <div className="bg-gradient-to-br from-[#161616] to-[#0a0a0a] p-20 rounded-[4rem] border border-white/5 max-w-3xl animate-in fade-in duration-500 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/5 blur-[120px] group-hover:bg-red-600/10 transition-colors"></div>
            <div className="relative z-10">
              <h3 className="text-4xl font-black uppercase mb-3 tracking-tighter italic">Bulk Import</h3>
              <p className="text-[11px] font-black text-gray-600 uppercase tracking-[0.3em] mb-12">Fast Lesson Import via CSV</p>

              <div className="space-y-10">
                <div className="relative p-12 border-2 border-white/5 border-dashed rounded-[3rem] bg-black/20 text-center space-y-6 group/upload cursor-pointer hover:border-red-600/50 transition-all">
                  <div className="text-5xl mb-2 opacity-20 group-hover/upload:opacity-100 transition-opacity">⚡</div>
                  <p className="text-sm font-black text-gray-500 uppercase group-hover/upload:text-white transition-colors tracking-widest">Upload CSV File (.csv)</p>
                  <input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                  {csvFile && <p className="text-red-500 font-black text-xs uppercase animate-pulse mt-4">Linked: {csvFile.name}</p>}
                </div>

                <div className="p-8 bg-red-600/5 border border-red-600/20 rounded-[2rem] flex gap-6">
                  <span className="text-2xl">⚠️</span>
                  <div className="space-y-2">
                    <p className="text-[11px] font-black text-red-600 uppercase tracking-widest">CSV Instructions</p>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-bold uppercase">The CSV must have these headers: Title, Description, Poster, VideoUrl, Category, BatchNo, Duration. Incorrect mapping will cause the import to fail.</p>
                  </div>
                </div>

                <button onClick={async () => { if (!csvFile) return; const fd = new FormData(); fd.append('file', csvFile); await axios.post(`${import.meta.env.VITE_API_URL}/admin/movies/bulk-csv`, fd, { headers: { ...getAuthHeaders().headers, 'Content-Type': 'multipart/form-data' } }); notify('Lessons imported successfully', 'success'); fetchData(); }} className="w-full py-7 bg-red-600 text-white font-black uppercase rounded-[2.5rem] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all tracking-[0.2em] text-sm">Start Bulk Import</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Access Control Overlay */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl flex items-center justify-center z-[100] p-6 animate-in fade-in zoom-in duration-300" onClick={() => setSelectedUser(null)}>
          <div className="bg-[#111] rounded-[4rem] p-16 max-w-2xl w-full border border-white/5 shadow-[0_0_150px_rgba(0,0,0,1)] relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
            <div className="mb-14 text-center">
              <h3 className="text-4xl font-black uppercase italic tracking-tighter mb-4">User Permissions</h3>
              <p className="text-[11px] font-black text-gray-600 uppercase tracking-[0.2em]">Adjusting settings for: {selectedUser.email}</p>
            </div>

            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-6">Subscription Plan</label>
                <div className="grid grid-cols-2 gap-4">
                  {['free', 'premium'].map(grade => (
                    <button key={grade} onClick={() => setUserSubForm({ ...userSubForm, subscription: grade })} className={`py-6 rounded-3xl font-black uppercase text-xs tracking-widest transition-all ${userSubForm.subscription === grade ? 'bg-red-600 text-white shadow-xl shadow-red-900/40 border-transparent' : 'bg-white/5 text-gray-600 border border-white/5 hover:text-white'}`}>
                      {grade === 'free' ? 'Free Plan' : 'Premium Access'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-6">Category Access</label>
                <div className="flex flex-wrap gap-2.5 p-8 bg-black/40 rounded-[3rem] border border-white/10 max-h-72 overflow-y-auto scrollbar-hide">
                  {categories.map(cat => {
                    const isSel = userSubForm.subscribedCategories.includes(cat.name);
                    return (
                      <button key={cat._id} onClick={() => setUserSubForm(p => ({ ...p, subscribedCategories: isSel ? p.subscribedCategories.filter(x => x !== cat.name) : [...p.subscribedCategories, cat.name] }))} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center gap-3 ${isSel ? 'bg-white text-black shadow-xl' : 'bg-white/5 text-gray-700 hover:text-white'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isSel ? 'bg-green-500' : 'bg-gray-800'}`}></span>
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6">
                <button onClick={() => handleUserUpdate(selectedUser._id)} className="w-full py-7 bg-white text-black font-black uppercase rounded-[2.5rem] shadow-2xl hover:bg-red-600 hover:text-white transition-all tracking-widest text-xs">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
