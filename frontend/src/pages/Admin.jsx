import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/Notification';
import { useConfirm } from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import { API_URL } from '../config';

export default function Admin() {
  const navigate = useNavigate();
  const notify = useNotification();
  const confirm = useConfirm();

  const [movies, setMovies] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [supportRequests, setSupportRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    paymentCount: 0,
    totalRevenue: 0,
    recentPayments: []
  });

  const [form, setForm] = useState({
    title: '', description: '', poster: '', videoUrl: '', videoType: 'youtube',
    category: [], batchNo: '', featured: false, isPremium: false
  });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', isPremium: false, price: 1000 });
  const [userSubForm, setUserSubForm] = useState({ subscription: 'free', subscribedCategories: [] });
  const [editingId, setEditingId] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const prevTicketsCountRef = useRef(0);
  const [isImporting, setIsImporting] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const fileInputRef = useRef(null);
  const adminMessagesEndRef = useRef(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [moviePage, setMoviePage] = useState(1);
  const [lessonCategoryFilter, setLessonCategoryFilter] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const categoryScrollRef = useRef(null);
  const itemsPerPage = 15;
  const usersPerPage = 10;

  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = 300;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const scrollContainer = categoryScrollRef.current;
    if (!scrollContainer) return;

    const handleWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        scrollContainer.scrollLeft += e.deltaY;
      }
    };

    scrollContainer.addEventListener('wheel', handleWheel, { passive: false });
    return () => scrollContainer.removeEventListener('wheel', handleWheel);
  }, []);

  const scrollToBottom = () => {
    adminMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (selectedTicket) {
      scrollToBottom();
    }
  }, [selectedTicket?.messages]);

  const [platformSettings, setPlatformSettings] = useState({
    premiumPrice: 20000,
    originalPrice: 25000,
    discountLabel: '20% OFF'
  });

  // Auto-calculate discount percentage
  useEffect(() => {
    if (platformSettings.originalPrice > 0 && platformSettings.premiumPrice > 0) {
      const percentage = Math.round(((platformSettings.originalPrice - platformSettings.premiumPrice) / platformSettings.originalPrice) * 100);
      if (percentage > 0) {
        setPlatformSettings(prev => ({
          ...prev,
          discountLabel: `${percentage}% OFF`
        }));
      }
    }
  }, [platformSettings.premiumPrice, platformSettings.originalPrice]);

  const handleBulkImport = async () => {
    if (!csvFile) return;
    setIsImporting(true);

    try {
      const fd = new FormData();
      fd.append('file', csvFile);

      await axios.post(
        `${API_URL}/admin/movies/bulk-csv`,
        fd,
        {
          headers: { ...getAuthHeaders().headers, 'Content-Type': 'multipart/form-data' }
        }
      );

      notify('Lessons imported successfully!', 'success');
      setCsvFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchData();
    } catch (err) {
      notify(err.response?.data?.message || err.message, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchData = async () => {
    try {
      const [m, u, c, s, settings, supportRes] = await Promise.all([
        axios.get(`${API_URL}/movies`, getAuthHeaders()),
        axios.get(`${API_URL}/admin/users`, getAuthHeaders()),
        axios.get(`${API_URL}/admin/categories`, getAuthHeaders()),
        axios.get(`${API_URL}/admin/stats`, getAuthHeaders()),
        axios.get(`${API_URL}/admin/settings`, getAuthHeaders()),
        axios.get(`${API_URL}/support/admin`, getAuthHeaders())
      ]);
      setMovies(m.data);
      setUsers(u.data);
      setCategories(c.data);
      setStats(s.data);
      setPlatformSettings(settings.data);
      const tickets = Array.isArray(supportRes.data) ? supportRes.data : [];
      setSupportRequests(tickets);

      const reopenedCount = tickets.filter(t => t.status === 'reopened').length;

      // Sound notification for new or reopened tickets
      if (prevTicketsCountRef.current !== 0 && (tickets.length > prevTicketsCountRef.current || reopenedCount > prevReopenedCountRef.current)) {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log('Audio play blocked or failed:', e));
      }
      prevTicketsCountRef.current = tickets.length;
      prevReopenedCountRef.current = reopenedCount;

      // Sync selected ticket chat if open
      if (selectedTicket) {
        const updated = tickets.find(t => t._id === selectedTicket._id);
        if (updated) setSelectedTicket(updated);
      }
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
    const interval = setInterval(fetchData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [navigate, selectedTicket?._id]);

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
      await axios[editingId ? 'put' : 'post'](`${API_URL}${endpoint}`, cleanedForm, getAuthHeaders());
      notify(`Content ${editingId ? 'Updated' : 'Published'}`, 'success');
      setForm({ title: '', description: '', poster: '', videoUrl: '', videoType: 'youtube', category: [], batchNo: '', featured: false, isPremium: false });
      setEditingId(null);
      fetchData();
    } catch (err) { notify(err.response?.data?.message || err.message, 'error'); }
  };

  const handleUserUpdate = async (userId) => {
    try {
      await axios.put(`${API_URL}/admin/user/${userId}/subscription`, userSubForm, getAuthHeaders());
      notify('Access Updated', 'success');
      setSelectedUser(null);
      fetchData();
    } catch (err) { notify(err.message, 'error'); }
  };

  const handleUpdateSupportStatus = async (ticketId, status) => {
    try {
      const res = await axios.put(`${API_URL}/support/admin/${ticketId}`, { status }, getAuthHeaders());
      notify('Ticket Status Updated', 'success');

      // Live sync: Update selectedTicket if it's the one being modified
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, status }));
      }

      fetchData();
    } catch (err) {
      notify('Failed to update ticket', 'error');
    }
  };

  const handleAdminSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || chatLoading) return;

    setChatLoading(true);
    try {
      const res = await axios.post(`${API_URL}/support/${selectedTicket._id}/message`, {
        content: newMessage
      }, getAuthHeaders());
      setSelectedTicket(res.data.data);
      setNewMessage('');
      fetchData();
    } catch (err) {
      notify('Failed to send message', 'error');
    } finally {
      setChatLoading(false);
    }
  };

  const handleAdminCloseTicket = async () => {
    if (!window.confirm('Close this ticket?')) return;
    try {
      await axios.put(`${API_URL}/support/${selectedTicket._id}/close`, {}, getAuthHeaders());
      notify('Ticket Closed', 'success');
      setSelectedTicket(null);
      fetchData();
    } catch (err) {
      notify('Failed to close', 'error');
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      const action = user.isActive ? 'block' : 'unblock';
      if (await confirm(`Are you sure you want to ${action} ${user.name}?`)) {
        await axios.put(`${API_URL}/admin/user/${user._id}/status`, {
          isActive: !user.isActive
        }, getAuthHeaders());

        notify(`User ${user.isActive ? 'blocked' : 'unblocked'} successfully`, 'success');
        fetchData();
      }
    } catch (err) {
      notify(err.response?.data?.message || err.message, 'error');
    }
  };

  const handleDeleteUser = async (user) => {
    try {
      if (await confirm(`CRITICAL: Are you sure you want to PERMANENTLY delete user: ${user.name}? This action cannot be undone.`)) {
        await axios.delete(`${API_URL}/admin/user/${user._id}`, getAuthHeaders());
        notify('User account deleted permanently', 'success');
        fetchData();
      }
    } catch (err) {
      notify(err.response?.data?.message || err.message, 'error');
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/admin/settings`, platformSettings, getAuthHeaders());
      notify('Pricing settings updated successfully!', 'success');
      fetchData();
    } catch (err) {
      notify(err.response?.data?.message || err.message, 'error');
    }
  };

  const handleResetPayments = async () => {
    if (await confirm('CRITICAL: Are you sure you want to PERMANENTLY reset all payment data? This will clear total revenue and recent sales history. This action cannot be undone.')) {
      try {
        await axios.delete(`${API_URL}/admin/payments/reset`, getAuthHeaders());
        notify('Payment history has been cleared', 'success');
        fetchData();
      } catch (err) {
        notify(err.response?.data?.message || err.message, 'error');
      }
    }
  };

  const [selectedMovies, setSelectedMovies] = useState([]);

  const toggleSelectAll = () => {
    if (selectedMovies.length === movies.length) {
      setSelectedMovies([]);
    } else {
      setSelectedMovies(movies.map(m => m._id));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedMovies.length) return;
    if (await confirm(`Are you sure you want to delete ${selectedMovies.length} lessons? This cannot be undone.`)) {
      try {
        await Promise.all(selectedMovies.map(id => axios.delete(`${API_URL}/admin/movie/${id}`, getAuthHeaders())));
        notify(`${selectedMovies.length} lessons deleted successfully`, 'success');
        setSelectedMovies([]);
        fetchData();
      } catch (err) {
        notify('Failed to delete some lessons', 'error');
      }
    }
  };

  const toggleCategory = (catName) => {
    setForm(prev => {
      const current = prev.category || [];
      const updated = current.includes(catName) ? current.filter(c => c !== catName) : [...current, catName];
      return { ...prev, category: updated };
    });
  };

  if (loading) return <LoadingSpinner />;

  const pendingCount = supportRequests.filter(r => ['pending', 'reopened'].includes(r.status)).length;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans pt-20">
      {/* Sidebar */}
      <aside className={`bg-[#111] border-r border-white/5 fixed top-20 bottom-0 z-40 hidden md:flex flex-col transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${sidebarCollapsed ? 'w-24' : 'w-72'}`}>
        <div className="flex justify-center py-8 border-b border-white/5 bg-black/20">
          <label className="admin-sidebar-toggle">
            <input
              type="checkbox"
              checked={!sidebarCollapsed}
              onChange={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <svg viewBox="0 0 32 32">
              <path d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22" className="line line-top-bottom" />
              <path d="M7 16 27 16" className="line" />
            </svg>
          </label>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-3">
          {[
            { id: 'overview', label: 'Dashboard', i: '📊' },
            { id: 'lessons', label: 'Lessons', i: '🎥' },
            { id: 'categories', label: 'Categories', i: '📂' },
            { id: 'pricing', label: 'Pricing', i: '💰' },
            { id: 'users', label: 'Members', i: '👥' },
            { id: 'support', label: 'Tickets', i: '📧', badge: pendingCount },
          ].map(t => (
            <button
              key={t.id} onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest relative group ${activeTab === t.id ? 'bg-red-600 shadow-lg shadow-red-900/20 text-white' : 'text-gray-500 hover:bg-white/5'}`}
            >
              <div className="flex items-center justify-center min-w-[24px] text-xl">
                <span>{t.i}</span>
              </div>

              {!sidebarCollapsed && (
                <div className="flex items-center justify-between flex-1 animate-in fade-in slide-in-from-left-2 duration-300">
                  <span className="truncate">{t.label}</span>
                  {t.badge > 0 && (
                    <span className="bg-white text-red-600 px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                      {t.badge}
                    </span>
                  )}
                </div>
              )}

              {sidebarCollapsed && t.badge > 0 && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-red-600 text-white rounded-full text-[8px] flex items-center justify-center animate-pulse border-2 border-[#111]">
                  {t.badge}
                </div>
              )}

              {/* Tooltip for Collapsed State */}
              {sidebarCollapsed && (
                <div className="absolute left-[calc(100%+20px)] px-4 py-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100] shadow-xl text-[10px]">
                  {t.label} {t.badge > 0 ? `(${t.badge})` : ''}
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-red-600"></div>
                </div>
              )}
            </button>
          ))}
        </nav>

      </aside>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed top-[72px] left-0 right-0 bg-[#111] border-b border-white/5 z-40 overflow-x-auto no-scrollbar py-2 px-4 shadow-xl">
        <div className="flex items-center gap-2 min-w-max">
          {[
            { id: 'overview', label: 'Stats', i: '📊' },
            { id: 'lessons', label: 'Lessons', i: '🎥' },
            { id: 'users', label: 'Members', i: '👥' },
            { id: 'categories', label: 'Cats', i: '📂' },
            { id: 'pricing', label: 'Price', i: '💰' },
            { id: 'support', label: 'Help', i: '📧', badge: pendingCount },
          ].map(t => (
            <button
              key={t.id} onClick={() => setActiveTab(t.id)}
              className={`relative flex items-center gap-3 px-5 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${activeTab === t.id ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-gray-500 bg-white/5'}`}
            >
              <span>{t.i}</span> {t.label}
              {t.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-red-600 w-4 h-4 rounded-full text-[8px] flex items-center justify-center animate-pulse border border-red-600/20">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 px-5 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest text-red-500 bg-red-600/5 border border-red-600/10"
          >
            <span>🚪</span> Exit
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className={`flex-1 p-6 md:p-12 overflow-x-hidden pt-28 md:pt-12 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${sidebarCollapsed ? 'md:ml-24' : 'md:ml-72'}`}>
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">
              {activeTab === 'lessons' ? 'Lessons' : activeTab}
            </h1>
          </div>
          {activeTab === 'overview' && (
            <button
              onClick={handleResetPayments}
              className="px-6 py-3 bg-red-600/10 text-red-500 border border-red-600/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-lg flex items-center gap-2"
            >
              <span>🧹</span> Reset Payment Data
            </button>
          )}
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { l: 'Total Revenue', v: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, c: 'from-emerald-600 to-emerald-400', i: '💰' },
                { l: 'Success Payments', v: stats?.paymentCount || 0, c: 'from-blue-600 to-blue-400', i: '✅' },
                { l: 'Premium Users', v: users.filter(u => u.subscription === 'premium').length, c: 'from-yellow-600 to-yellow-400', i: '👑' },
                { l: 'Total Members', v: users.length, c: 'from-purple-600 to-purple-400', i: '👥' },
              ].map(s => (
                <div key={s.l} className="bg-[#161616] p-8 rounded-[2rem] border border-white/5 shadow-xl transition-all hover:border-white/10 group">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.c} mb-6 shadow-lg flex items-center justify-center text-xl`}>{s.i}</div>
                  <div className="text-3xl font-black leading-none group-hover:text-emerald-500 transition-colors uppercase italic tracking-tighter">{s.v}</div>
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-3">{s.l}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-[#161616] rounded-[2.5rem] p-10 border border-white/5">
                <h3 className="text-xl font-black uppercase italic tracking-tighter mb-8 flex items-center gap-3">
                  <span className="text-red-600">📊</span> Operational Stats
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-black/20 rounded-3xl border border-white/5">
                    <div className="text-2xl font-black mb-1">{movies.length}</div>
                    <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Total Lessons Published</div>
                  </div>
                  <div className="p-6 bg-black/20 rounded-3xl border border-white/5">
                    <div className="text-2xl font-black mb-1">{categories.length}</div>
                    <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Active Categories</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#161616] rounded-[2.5rem] p-10 border border-white/5">
                <h3 className="text-xl font-black uppercase italic tracking-tighter mb-8 flex items-center gap-3">
                  <span className="text-emerald-500">💰</span> Recent Sales
                </h3>
                <div className="space-y-4">
                  {stats?.recentPayments?.length > 0 ? stats.recentPayments.map(p => (
                    <div key={p._id} className="flex justify-between items-center p-4 bg-black/20 rounded-2xl border border-white/5">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-tighter truncate w-32">{p.paymentId}</div>
                        <div className="text-[8px] font-bold text-gray-600 uppercase">{new Date(p.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="text-emerald-500 font-black text-sm italic">₹{(p.amount || 0).toLocaleString()}</div>
                    </div>
                  )) : (
                    <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest text-center py-8">No payments yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lessons' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex gap-4">
              <button
                onClick={() => setBulkMode(false)}
                className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border ${!bulkMode ? 'bg-red-600 border-red-600 shadow-xl shadow-red-900/20' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
              >
                Manual Upload
              </button>
              <button
                onClick={() => setBulkMode(true)}
                className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border ${bulkMode ? 'bg-red-600 border-red-600 shadow-xl shadow-red-900/20' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
              >
                Bulk Upload (CSV)
              </button>
            </div>

            {!bulkMode ? (
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
                      <input type="text" placeholder="e.g. Session 01" value={form.batchNo} onChange={e => setForm({ ...form, batchNo: e.target.value })} className="px-6 py-5 bg-black/40 border border-white/10 rounded-2xl w-full focus:border-red-600 outline-none transition-all font-bold" />
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
                      {categories
                        .map(cat => {
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
                    {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ title: '', description: '', poster: '', videoUrl: '', videoType: 'youtube', category: [], batchNo: '', featured: false, isPremium: false }); }} className="px-12 bg-white/5 text-white border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all">Cancel</button>}
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-[#161616] to-[#0a0a0a] p-12 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/5 blur-[120px] group-hover:bg-red-600/10 transition-colors"></div>
                <div className="relative z-10 space-y-8">
                  <div>
                    <h3 className="text-4xl font-black uppercase tracking-tighter italic text-red-600">Bulk Upload</h3>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Import multiple lessons instantly via CSV</p>
                  </div>

                  <div className="relative p-12 border-2 border-white/5 border-dashed rounded-[2rem] bg-black/20 text-center space-y-6 group/upload cursor-pointer hover:border-red-600/50 transition-all">
                    <div className="text-5xl mb-2 opacity-20 group-hover/upload:opacity-100 transition-opacity">📁</div>
                    <p className="text-sm font-black text-gray-500 uppercase group-hover/upload:text-white transition-colors tracking-widest">Select CSV File</p>
                    <input
                      type="file"
                      accept=".csv"
                      ref={fileInputRef}
                      onChange={e => {
                        if (e.target.files[0]) {
                          setCsvFile(e.target.files[0]);
                          notify('File selected: ' + e.target.files[0].name, 'success');
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {csvFile && <p className="text-red-500 font-black text-xs uppercase animate-pulse mt-4">Selected: {csvFile.name}</p>}
                  </div>

                  <div className="p-8 bg-black/40 border border-white/10 rounded-2xl space-y-4">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Required CSV Headers:</p>
                    <div className="flex flex-wrap gap-2">
                      {['Title', 'Description', 'Poster', 'VideoUrl', 'VideoType', 'Category', 'BatchNo', 'IsPremium', 'Featured'].map(h => (
                        <span key={h} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-gray-400">{h}</span>
                      ))}
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const res = await axios.get(`${API_URL}/admin/movies/sample-csv`, {
                            ...getAuthHeaders(),
                            responseType: 'blob'
                          });
                          const url = window.URL.createObjectURL(new Blob([res.data]));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', 'bulk_upload_template.csv');
                          document.body.appendChild(link);
                          link.click();
                        } catch (err) { notify('Failed to download template', 'error'); }
                      }}
                      className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline pt-2 block"
                    >
                      Download CSV Template
                    </button>
                  </div>

                  <button
                    onClick={handleBulkImport}
                    disabled={!csvFile || isImporting}
                    className={`w-full py-6 font-black uppercase rounded-2xl shadow-2xl transition-all tracking-widest text-sm flex items-center justify-center gap-4 ${isImporting ? 'bg-gray-800 text-gray-400 cursor-wait' : 'bg-red-600 text-white hover:bg-red-700 shadow-red-900/20'}`}
                  >
                    {isImporting ? 'Importing Lessons...' : 'Start Bulk Import'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <div className="flex-1 px-8 py-5 bg-[#161616] rounded-[2.5rem] border border-white/10 flex items-center gap-4 shadow-2xl relative group overflow-hidden">
                {/* Left Glide Button */}
                <button
                  onClick={() => scrollCategories('left')}
                  className="w-10 h-10 min-w-[40px] rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all z-10 shadow-lg active:scale-90"
                >
                  <span className="text-[10px]">◀</span>
                </button>

                <div
                  ref={categoryScrollRef}
                  className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-4 scroll-smooth px-2 py-1"
                >
                  <button
                    onClick={() => { setLessonCategoryFilter('all'); setMoviePage(1); }}
                    className={`text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap px-6 py-3 rounded-2xl ${lessonCategoryFilter === 'all' ? 'bg-red-600 text-white shadow-xl shadow-red-900/20' : 'text-gray-600 hover:text-white hover:bg-white/5'}`}
                  >
                    ALL MODULES
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat._id}
                      onClick={() => { setLessonCategoryFilter(cat.name); setMoviePage(1); }}
                      className={`text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap px-6 py-3 rounded-2xl ${lessonCategoryFilter === cat.name ? 'bg-red-600 text-white shadow-xl shadow-red-900/20' : 'text-gray-600 hover:text-white hover:bg-white/5'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Right Glide Button */}
                <button
                  onClick={() => scrollCategories('right')}
                  className="w-10 h-10 min-w-[40px] rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all z-10 shadow-lg active:scale-90"
                >
                  <span className="text-[10px]">▶</span>
                </button>
              </div>
            </div>

            <div className="bg-[#161616] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 bg-black/20">
                      <th className="p-10 w-20">
                        <input
                          type="checkbox"
                          checked={selectedMovies.length === movies.length && movies.length > 0}
                          onChange={toggleSelectAll}
                          className="w-5 h-5 rounded border-white/20 bg-black/40 checked:bg-red-600 focus:ring-0 cursor-pointer transition-colors"
                        />
                      </th>
                      <th className="p-10">
                        <div className="flex items-center gap-4">
                          Lesson Details
                          {selectedMovies.length > 0 && (
                            <button
                              onClick={handleBulkDelete}
                              className="px-4 py-2 bg-red-600 text-white text-[8px] rounded-lg animate-in fade-in slide-in-from-left-4 hover:bg-red-700 transition-colors"
                            >
                              Delete ({selectedMovies.length})
                            </button>
                          )}
                        </div>
                      </th>
                      <th className="p-10">Subscription</th>
                      <th className="p-10">Categories</th>
                      <th className="p-10 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(() => {
                      const filteredMovies = movies
                        .filter(m => lessonCategoryFilter === 'all' || (m.category || []).includes(lessonCategoryFilter))
                        .sort((a, b) => {
                          const getNum = (s) => parseInt(s?.match(/\d+/)?.[0] || 0);
                          const aNum = getNum(a.batchNo);
                          const bNum = getNum(b.batchNo);
                          if (aNum !== bNum) return aNum - bNum;
                          return (a.batchNo || "").localeCompare(b.batchNo || "", undefined, { numeric: true, sensitivity: 'base' });
                        });

                      const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);
                      const startIndex = (moviePage - 1) * itemsPerPage;
                      const paginatedMovies = filteredMovies.slice(startIndex, startIndex + itemsPerPage);

                      return paginatedMovies.map(m => (
                        <tr key={m._id} className={`group transition-all ${selectedMovies.includes(m._id) ? 'bg-red-900/10' : 'hover:bg-white/[0.01]'}`}>
                          <td className="p-10">
                            <input
                              type="checkbox"
                              checked={selectedMovies.includes(m._id)}
                              onChange={() => {
                                setSelectedMovies(prev =>
                                  prev.includes(m._id)
                                    ? prev.filter(id => id !== m._id)
                                    : [...prev, m._id]
                                );
                              }}
                              className="w-5 h-5 rounded border-white/20 bg-black/40 checked:bg-red-600 focus:ring-0 cursor-pointer transition-colors"
                            />
                          </td>
                          <td className="p-10 flex items-center gap-8">
                            <div className="space-y-2">
                              <p className="font-black text-white text-lg uppercase tracking-tighter leading-none italic group-hover:text-red-500 transition-colors">{m.title}</p>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{m.batchNo || 'Standard'}</span>
                                {m.featured && <span className="bg-red-600 text-white text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest ml-2">Featured</span>}
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
                              {(() => {
                                const cleanedCats = m.category?.filter(c => !['Action', 'Drama', 'Thriller', 'Sci-Fi', 'Crime', 'History', 'Mystery', 'Romance', 'Adventure', 'Fantasy'].includes(c)) || [];
                                return (
                                  <>
                                    {cleanedCats.slice(0, 2).map(c => (
                                      <span key={c} className="px-3 py-1 bg-white/5 text-gray-500 text-[8px] font-black rounded-lg border border-white/5 hover:text-white transition-colors">{c}</span>
                                    ))}
                                    {cleanedCats.length > 2 && (
                                      <span className="px-2 py-1 bg-white/5 text-gray-400 text-[7px] font-black rounded-lg border border-white/5 uppercase tracking-tighter">
                                        +{cleanedCats.length - 2}
                                      </span>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </td>
                          <td className="p-10 text-right">
                            <div className="flex justify-end gap-3 opacity-30 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingId(m._id); setForm(m); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white text-black transition-all shadow-lg">✏️</button>
                              <button onClick={async () => { if (await confirm(`Are you sure you want to delete "${m.title}"?`)) { await axios.delete(`${API_URL}/admin/movie/${m._id}`, getAuthHeaders()); fetchData(); } }} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-600 hover:border-red-600 transition-all shadow-lg font-bold">🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Cinematic Pagination */}
              {(() => {
                const filteredCount = movies.filter(m => lessonCategoryFilter === 'all' || (m.category || []).includes(lessonCategoryFilter)).length;
                const totalPages = Math.ceil(filteredCount / itemsPerPage);
                if (filteredCount <= itemsPerPage) return null;

                return (
                  <div className="p-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 bg-black/20">
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      Showing Page <span className="text-white">{moviePage}</span> of <span className="text-white">{totalPages}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setMoviePage(prev => Math.max(1, prev - 1))}
                        disabled={moviePage === 1}
                        className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setMoviePage(i + 1)}
                            className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${moviePage === i + 1 ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                          >
                            {i + 1}
                          </button>
                        )).slice(Math.max(0, moviePage - 3), Math.min(totalPages, moviePage + 2))}
                      </div>
                      <button
                        onClick={() => setMoviePage(prev => Math.min(totalPages, prev + 1))}
                        disabled={moviePage === totalPages}
                        className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                );
              })()}
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

            <div className="bg-[#161616] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 bg-black/20">
                    <th className="p-10">User Details</th>
                    <th className="p-10">Subscription</th>
                    <th className="p-10">Authorized Categories</th>
                    <th className="p-10 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(() => {
                    const filteredUsers = users
                      .filter(u => u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) || u.name.toLowerCase().includes(userSearchQuery.toLowerCase()))
                      .filter(u => subscriptionFilter === 'all' || u.subscription === subscriptionFilter)
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                    const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage);
                    const startUserIndex = (userPage - 1) * usersPerPage;
                    const paginatedUsers = filteredUsers.slice(startUserIndex, startUserIndex + usersPerPage);

                    return paginatedUsers.map(u => (
                      <tr key={u._id} className="group hover:bg-white/[0.01] transition-all">
                        <td className="p-10">
                          <div className="space-y-1">
                            <p className="font-black text-white text-lg uppercase tracking-tighter italic leading-none">{u.name}</p>
                            <p className="text-[10px] font-bold text-gray-600">{u.email}</p>
                          </div>
                        </td>
                        <td className="p-10">
                          <div className="flex flex-col gap-2">
                            <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-3 w-fit ${u.subscription === 'premium'
                              ? 'bg-red-600/10 text-red-500 border border-red-600/20'
                              : u.subscription === 'gold'
                                ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                : 'bg-gray-800/10 text-gray-400 border border-white/5'
                              }`}>
                              {u.subscription !== 'free' && <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${u.subscription === 'premium' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>}
                              {u.subscription === 'premium' ? 'Premium Access' : u.subscription === 'gold' ? 'Gold Access' : 'Free Plan'}
                            </span>
                            {!u.isActive && (
                              <span className="px-4 py-1 bg-red-600/20 text-red-500 border border-red-600/30 rounded-lg text-[7px] font-black uppercase tracking-[0.2em] w-fit">
                                ⚠️ Account Banned
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-10">
                          <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                            {u.subscription === 'free' ? (
                              <span className="text-[10px] font-bold text-gray-800 italic uppercase tracking-widest">No Category Access</span>
                            ) : u.subscription === 'premium' ? (
                              <span className="px-3 py-1 bg-red-600/10 text-red-500 text-[8px] font-black rounded-lg border border-red-600/20 uppercase tracking-tighter">✨ Platform-Wide</span>
                            ) : (
                              u.subscribedCategories?.length > 0 ? (
                                <>
                                  {u.subscribedCategories.slice(0, 2).map(c => (
                                    <span key={c} className="px-3 py-1 bg-yellow-500/5 text-yellow-500 text-[8px] font-black rounded-lg border border-yellow-500/20 uppercase tracking-tighter">{c}</span>
                                  ))}
                                  {u.subscribedCategories.length > 2 && (
                                    <span className="px-2 py-1 bg-white/5 text-gray-500 text-[7px] font-black rounded-lg border border-white/10 uppercase tracking-tighter">
                                      +{u.subscribedCategories.length - 2} More
                                    </span>
                                  )}
                                </>
                              ) : <span className="text-[9px] font-bold text-red-700 italic uppercase tracking-widest">Selection Required</span>
                            )}
                          </div>
                        </td>
                        <td className="p-10 text-right">
                          <div className="flex justify-end items-center gap-3">
                            {u.role !== 'admin' ? (
                              <>
                                <button
                                  onClick={() => { setSelectedUser(u); setUserSubForm({ subscription: u.subscription, subscribedCategories: u.subscribedCategories || [] }) }}
                                  className="px-5 py-3 bg-white text-black text-[9px] font-black rounded-xl hover:bg-white/90 active:scale-95 transition-all shadow-lg uppercase tracking-widest"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleToggleUserStatus(u)}
                                  className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 ${u.isActive ? 'bg-red-600/10 text-red-500 border border-red-600/20 hover:bg-red-600 hover:text-white' : 'bg-green-600/10 text-green-500 border border-green-600/20 hover:bg-green-600 hover:text-white'}`}
                                >
                                  {u.isActive ? '🚫' : '✅'}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl hover:bg-red-600 hover:border-red-600 transition-all text-xs"
                                  title="Permanently Delete User"
                                >
                                  🗑️
                                </button>
                              </>
                            ) : (
                              <span className="px-4 py-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest italic select-none">
                                SYSTEM ADMIN
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>

              {/* Members Pagination */}
              {(() => {
                const filteredCount = users
                  .filter(u => u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) || u.name.toLowerCase().includes(userSearchQuery.toLowerCase()))
                  .filter(u => subscriptionFilter === 'all' || u.subscription === subscriptionFilter).length;
                const totalPages = Math.ceil(filteredCount / usersPerPage);
                if (filteredCount <= usersPerPage) return null;

                return (
                  <div className="p-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 bg-black/20">
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      Showing Page <span className="text-white">{userPage}</span> of <span className="text-white">{totalPages}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setUserPage(prev => Math.max(1, prev - 1))}
                        disabled={userPage === 1}
                        className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setUserPage(i + 1)}
                            className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${userPage === i + 1 ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                          >
                            {i + 1}
                          </button>
                        )).slice(Math.max(0, userPage - 3), Math.min(totalPages, userPage + 2))}
                      </div>
                      <button
                        onClick={() => setUserPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={userPage === totalPages}
                        className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-16 animate-in fade-in duration-500">
            <div className="bg-[#161616] p-12 rounded-[3.5rem] border border-white/5 max-w-2xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-red-600/5 blur-[50px]"></div>
              <h3 className="text-2xl font-black uppercase mb-10 italic tracking-tighter">Create New Category</h3>
              <form onSubmit={async (e) => { e.preventDefault(); await axios.post(`${API_URL}/admin/category`, categoryForm, getAuthHeaders()); setCategoryForm({ name: '', description: '', isPremium: false, price: 1000 }); fetchData(); notify('Category Created Successfully', 'success'); }} className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Category Name</label>
                    <input type="text" placeholder="e.g. Big Data" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} className="px-8 py-5 bg-black/40 border border-white/10 rounded-2xl w-full font-black uppercase text-sm focus:border-red-600 outline-none transition-all" required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Gold Price (INR)</label>
                    <input type="number" placeholder="1000" value={categoryForm.price} onChange={e => setCategoryForm({ ...categoryForm, price: Number(e.target.value) })} className="px-8 py-5 bg-black/40 border border-white/10 rounded-2xl w-full font-black text-sm focus:border-red-600 outline-none transition-all" required />
                  </div>
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
                  <h4 className="font-black uppercase text-white mb-2 text-lg tracking-tighter italic">{c.name}</h4>

                  <div className="flex items-center gap-3 mb-8 bg-black/20 p-3 rounded-2xl border border-white/5 group-hover:border-red-600/20 transition-all">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Price:</span>
                    <div className="relative flex-1">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 text-white/50 text-xs font-bold pl-1">₹</span>
                      <input
                        type="number"
                        defaultValue={c.price}
                        onBlur={async (e) => {
                          const newPrice = Number(e.target.value);
                          if (newPrice !== c.price) {
                            await axios.put(`${API_URL}/admin/category/${c._id}`, { price: newPrice }, getAuthHeaders());
                            notify('Category Price Updated', 'success');
                            fetchData();
                          }
                        }}
                        className="bg-transparent border-none text-white text-sm font-black w-full pl-4 focus:ring-0 outline-none"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] font-bold text-gray-600 uppercase mb-10 line-clamp-2 leading-relaxed h-10">{c.description || 'No description provided.'}</p>
                  <button onClick={async () => { if (await confirm(`Are you sure you want to delete category: "${c.name}"?`)) { await axios.delete(`${API_URL}/admin/category/${c._id}`, getAuthHeaders()); fetchData(); } }} className="w-full py-4 bg-red-600/10 text-red-500 rounded-2xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all border border-red-600/20 shadow-lg">Delete Category</button>
                </div>
              ))}
            </div>
          </div>
        )
        }


        {
          activeTab === 'pricing' && (
            <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
              <div className="bg-[#161616] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl space-y-12">
                <div className="space-y-4">
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white flex items-center gap-4">
                    <span className="text-red-600">💰</span> Pricing Settings
                  </h2>
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest leading-loose max-w-lg">
                    Manage your platform's subscription pricing and discount labels. Changes are reflected instantly in the user upgrade portal.
                  </p>
                </div>

                <form onSubmit={handleUpdateSettings} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-6">Premium Price (INR)</label>
                      <input
                        type="number"
                        value={platformSettings.premiumPrice}
                        onChange={e => setPlatformSettings({ ...platformSettings, premiumPrice: Number(e.target.value) })}
                        className="w-full px-10 py-6 bg-black/40 border border-white/10 rounded-[2rem] font-bold text-lg focus:border-red-600 outline-none transition-all text-white"
                        placeholder="e.g. 20000"
                        required
                      />
                      <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest ml-6">The actual amount charged to the user.</p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-6">Original Price (Strike-through)</label>
                      <input
                        type="number"
                        value={platformSettings.originalPrice}
                        onChange={e => setPlatformSettings({ ...platformSettings, originalPrice: Number(e.target.value) })}
                        className="w-full px-10 py-6 bg-black/40 border border-white/10 rounded-[2rem] font-bold text-lg focus:border-red-600 outline-none transition-all text-white"
                        placeholder="e.g. 25000"
                        required
                      />
                      <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest ml-6">Shown as the crossed-out price to highlight savings.</p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-6">Gold Category Price (INR/Unit)</label>
                      <input
                        type="number"
                        value={platformSettings.goldCategoryPrice}
                        onChange={e => setPlatformSettings({ ...platformSettings, goldCategoryPrice: Number(e.target.value) })}
                        className="w-full px-10 py-6 bg-black/40 border border-white/10 rounded-[2rem] font-bold text-lg focus:border-red-600 outline-none transition-all text-white"
                        placeholder="e.g. 1000"
                        required
                      />
                      <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest ml-6">Price per category for Gold tier upgrades.</p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-6">Discount Label</label>
                      <input
                        type="text"
                        value={platformSettings.discountLabel}
                        onChange={e => setPlatformSettings({ ...platformSettings, discountLabel: e.target.value })}
                        className="w-full px-10 py-6 bg-black/40 border border-white/10 rounded-[2rem] font-bold text-lg focus:border-red-600 outline-none transition-all text-white"
                        placeholder="e.g. 20% OFF or LIMITED OFFER"
                        required
                      />
                      <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest ml-6">Visual badge shown next to the price.</p>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button type="submit" className="w-full py-7 bg-red-600 text-white font-black uppercase rounded-[2.5rem] shadow-2xl hover:bg-red-700 transition-all tracking-widest text-xs flex items-center justify-center gap-3">
                      <span>💾</span> Update Pricing Platform
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 p-10 rounded-[2.5rem] flex items-center gap-8">
                <div className="text-4xl">💎</div>
                <div>
                  <h4 className="text-emerald-500 font-black uppercase tracking-widest text-xs mb-2">Live Preview Logic</h4>
                  <p className="text-gray-400 text-[10px] font-medium leading-relaxed uppercase tracking-wider">
                    Users will see: <span className="text-white line-through opacity-50">₹{(platformSettings.originalPrice || 0).toLocaleString()}</span> <span className="text-white">₹{(platformSettings.premiumPrice || 0).toLocaleString()}</span> <span className="px-2 py-1 bg-red-600/20 text-red-500 rounded text-[8px] ml-2">{platformSettings.discountLabel}</span>
                  </p>
                </div>
              </div>
            </div>
          )
        }

        {activeTab === 'support' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="space-y-4">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white flex items-center gap-4">
                <span className="text-red-600">📧</span> Ticket Center
              </h2>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest leading-loose max-w-lg">
                Review and manage platform feedback, bug reports, and UI suggestions from your users.
              </p>
            </div>

            <div className="bg-[#161616] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 bg-black/20">
                      <th className="p-10">User Info</th>
                      <th className="p-10">Type & Subject</th>
                      <th className="p-10">Message</th>
                      <th className="p-10">Status</th>
                      <th className="p-10 text-right">Update</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {supportRequests.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-20 text-center text-gray-600 font-black uppercase text-xs tracking-widest italic">
                          No active support tickets found. 🎫
                        </td>
                      </tr>
                    ) : (
                      supportRequests.map(req => (
                        <tr
                          key={req._id}
                          onClick={() => setSelectedTicket(req)}
                          className="group hover:bg-white/[0.03] transition-all cursor-pointer active:scale-[0.99] origin-center"
                        >
                          <td className="p-10">
                            <div className="font-black text-white text-sm uppercase italic tracking-tighter">{req.user?.name || 'Unknown User'}</div>
                            <div className="text-[10px] text-gray-500 font-bold tracking-widest mt-1">{req.user?.email}</div>
                          </td>
                          <td className="p-10">
                            <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest inline-block mb-2 ${req.type === 'problem' ? 'bg-red-600/10 text-red-500 border border-red-600/20' :
                              req.type === 'suggestion' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                'bg-white/5 text-gray-400 border border-white/10'}`}>
                              {req.type}
                            </span>
                            <div className="font-bold text-gray-300 text-xs uppercase max-w-[200px] truncate">{req.subject}</div>
                          </td>
                          <td className="p-10">
                            <p className="text-[11px] text-gray-500 font-medium leading-relaxed max-w-[300px] break-words">
                              {req.message}
                            </p>
                            <p className="text-[9px] text-gray-600 mt-3 font-bold uppercase tracking-widest">
                              Sent: {new Date(req.createdAt).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="p-10">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${req.status === 'closed' || req.status === 'resolved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                              req.status === 'reopened' ? 'bg-red-600 text-white shadow-lg shadow-red-900/20 px-4' :
                                req.status === 'reviewed' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                  'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'}`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="p-10 text-right" onClick={(e) => e.stopPropagation()}>
                            <select
                              defaultValue={req.status}
                              value={req.status} // Controlled for better sync
                              onChange={(e) => handleUpdateSupportStatus(req._id, e.target.value)}
                              className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-red-600 transition-all cursor-pointer"
                            >
                              <option value="pending">Mark Pending</option>
                              <option value="reviewed">Mark Reviewed</option>
                              <option value="closed">Mark Closed</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main >

      {/* Access Control Overlay */}
      {
        selectedUser && (
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
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'free', label: 'Free Plan', color: 'gray' },
                      { id: 'gold', label: 'Gold Access', color: 'yellow' },
                      { id: 'premium', label: 'Premium', color: 'red' }
                    ].map(grade => (
                      <button
                        key={grade.id}
                        onClick={() => {
                          const allCategoryNames = categories.map(c => c.name);
                          setUserSubForm({
                            subscription: grade.id,
                            subscribedCategories: grade.id === 'premium' ? allCategoryNames : []
                          });
                        }}
                        className={`py-6 rounded-3xl font-black uppercase text-[10px] tracking-widest transition-all border ${userSubForm.subscription === grade.id
                          ? (grade.id === 'red' ? 'bg-red-600 border-red-600' : 'bg-white text-black border-white shadow-xl shadow-white/10')
                          : 'bg-white/5 text-gray-600 border-white/5 hover:text-white'}`}
                        style={{
                          backgroundColor: userSubForm.subscription === grade.id ? (grade.id === 'premium' ? '#dc2626' : (grade.id === 'gold' ? '#eab308' : '#ffffff')) : '',
                          color: userSubForm.subscription === grade.id ? (grade.id === 'gold' ? '#000000' : (grade.id === 'free' ? '#000000' : '#ffffff')) : ''
                        }}
                      >
                        {grade.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center mt-4 italic">
                    {userSubForm.subscription === 'premium'
                      ? '✨ Full Access: User can view all current and future modules.'
                      : userSubForm.subscription === 'gold'
                        ? '🔑 Selective Access: Authorization is limited to hand-picked categories below.'
                        : '🔒 Zero Access: User cannot view any restricted categories.'}
                  </p>
                </div>

                {userSubForm.subscription === 'gold' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-center ml-6">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Authorize Specific Categories</label>
                      <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">
                        {userSubForm.subscribedCategories?.length || 0} Modules Selected
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 p-8 bg-black/40 rounded-[2.5rem] border border-white/5 max-h-[280px] overflow-y-auto custom-scrollbar shadow-inner">
                      {categories.map(cat => (
                        <button
                          key={cat._id}
                          type="button"
                          onClick={() => {
                            const current = userSubForm.subscribedCategories || [];
                            const updated = current.includes(cat.name) ? current.filter(c => c !== cat.name) : [...current, cat.name];
                            setUserSubForm({ ...userSubForm, subscribedCategories: updated });
                          }}
                          className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${userSubForm.subscribedCategories?.includes(cat.name) ? 'bg-yellow-500 text-black border-yellow-500 shadow-lg shadow-yellow-900/20' : 'bg-white/5 text-gray-600 border-white/5 hover:text-white hover:bg-white/10'}`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-6">
                  <button onClick={() => handleUserUpdate(selectedUser._id)} className="w-full py-7 bg-white text-black font-black uppercase rounded-[2.5rem] shadow-2xl hover:bg-red-600 hover:text-white transition-all tracking-widest text-xs">Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        )
      }
      {/* Support Chat Modal (Admin) */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setSelectedTicket(null)}></div>

          <div className="relative w-full max-w-5xl h-[85vh] bg-[#0d0d0d] border border-white/10 rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-500">
            {/* Chat Header */}
            <div className="p-10 border-b border-white/5 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-8">
                <button onClick={() => setSelectedTicket(null)} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-xl">←</button>
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">{selectedTicket.subject}</h3>
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${selectedTicket.status === 'closed' || selectedTicket.status === 'resolved' ? 'bg-green-500/20 text-green-500' :
                      selectedTicket.status === 'reopened' ? 'bg-red-600 text-white shadow-xl' :
                        selectedTicket.status === 'reviewed' ? 'bg-blue-500/20 text-blue-500' :
                          'bg-yellow-500/20 text-yellow-500'}`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">User: <span className="text-white italic">{selectedTicket.user?.email} ({selectedTicket.user?.name})</span></p>
                    <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">ID: {selectedTicket._id}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                {!['closed', 'resolved'].includes(selectedTicket.status) && (
                  <>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateSupportStatus(selectedTicket._id, e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-red-600 transition-all cursor-pointer"
                    >
                      <option value="pending">Mark Pending</option>
                      <option value="reviewed">Mark Reviewed</option>
                      <option value="closed">Mark Closed</option>
                    </select>
                  </>
                )}
                <button onClick={() => setSelectedTicket(null)} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white text-black transition-all">✕</button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-gradient-to-b from-black to-transparent">
              {selectedTicket.messages?.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'admin' ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-3 mb-3 px-4">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${msg.role === 'admin' ? 'text-red-500' : 'text-gray-500'}`}>
                      {msg.role === 'admin' ? 'YOU (Admin)' : `${selectedTicket.user?.name || 'User'}`}
                    </span>
                    <span className="text-[9px] text-gray-800 font-bold uppercase tracking-widest">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  <div className={`max-w-[75%] rounded-[2rem] p-8 ${msg.role === 'admin'
                    ? 'bg-red-600 text-white rounded-tr-sm shadow-2xl shadow-red-900/20'
                    : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm'
                    }`}>
                    <p className="text-[13px] font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                    {msg.attachments?.length > 0 && (
                      <div className="mt-6 grid grid-cols-1 gap-4">
                        {msg.attachments.map((url, idx) => (
                          <div key={idx} className="space-y-2">
                            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">User Attachment:</p>
                            <a href={url} target="_blank" rel="noopener noreferrer" className="block rounded-3xl overflow-hidden border border-white/10 hover:border-white/30 transition-all shadow-2xl">
                              <img src={url} alt="attachment" className="w-full h-auto object-cover max-h-[400px]" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={adminMessagesEndRef} />
              {['closed', 'resolved'].includes(selectedTicket.status) && (
                <div className="text-center py-16">
                  <div className="bg-red-600/5 border border-red-600/10 px-10 py-8 rounded-[3rem] inline-block">
                    <p className="text-xs font-black text-red-600 uppercase tracking-[0.3em] italic">
                      🔒 ARCHIVED: THIS TICKET IS FINISHED AND READ-ONLY.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            {!['closed', 'resolved'].includes(selectedTicket.status) && (
              <div className="p-10 border-t border-white/5 bg-black/40">
                <form onSubmit={handleAdminSendMessage} className="relative flex items-center gap-6">
                  <div className="relative flex-1 group">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAdminSendMessage(e);
                        }
                      }}
                      placeholder="Type your reply to the user..."
                      className="w-full px-10 py-6 pr-24 bg-white/5 border border-white/10 rounded-3xl text-sm font-medium focus:border-red-600 outline-none transition-all placeholder:text-gray-700 resize-none h-20 min-h-[80px]"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || chatLoading}
                        className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center hover:bg-red-500 transition-all disabled:opacity-30 shadow-xl"
                      >
                        <span className="text-xl">→</span>
                      </button>
                    </div>
                  </div>
                </form>
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-6 ml-4">
                  REPLYING AS <span className="text-red-600 font-black">ADMINISTRATOR</span> • PRESS ENTER TO SEND
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div >
  );
}
