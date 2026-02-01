import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Profile() {
  const navigate = useNavigate();
  // ... (existing state)
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch fresh user data
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/auth/me`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const userData = response.data;
      setUser(userData);

      // Only update formData if not currently editing to avoid overwriting user input
      if (!isEditing) {
        setFormData({
          name: userData.name || '',
          phone: userData.phone || ''
        });
      }

      localStorage.setItem('user', JSON.stringify(userData));
      window.dispatchEvent(new Event('userDataUpdated'));
    } catch (err) {
      console.error('Error fetching user data:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    const interval = setInterval(fetchUserData, 5000);
    return () => clearInterval(interval);
  }, [isEditing]); // Add isEditing to dependencies to ensure fetchUserData has current state

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/auth/update-profile`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const updatedUser = response.data.user;
      setUser(updatedUser);
      setFormData({
        name: updatedUser.name || '',
        phone: updatedUser.phone || ''
      });
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('userDataUpdated'));

      setSuccess('Profile updated successfully!');
      setIsEditing(false);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Profile Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-[2.5rem] border border-white/5 shadow-2xl p-8 md:p-12">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 blur-[120px] rounded-full -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-red-800/5 blur-[100px] rounded-full -ml-24 -mb-24"></div>

          <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Avatar Section */}
            <div className="relative group">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-[2rem] bg-gradient-to-br from-red-600 to-red-900 p-1 shadow-2xl transition-transform duration-500 group-hover:scale-105">
                <div className="w-full h-full rounded-[1.8rem] bg-[#121212] flex items-center justify-center overflow-hidden">
                  <span className="text-5xl md:text-7xl font-black text-white/90 tracking-tighter">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-[#121212] animate-pulse"></div>
            </div>

            {/* Name and Stats */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="space-y-1">
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                  {user.name}
                </h1>
                <p className="text-gray-400 font-medium text-lg">{user.email}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
                {user.subscription === 'premium' ? (
                  <div className="px-6 py-2 bg-yellow-500 rounded-2xl flex items-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                    <span className="text-xl">⭐</span>
                    <span className="text-black font-black text-sm uppercase tracking-wider">Premium Member</span>
                  </div>
                ) : (
                  <div className="px-6 py-2 bg-white/5 rounded-2xl flex items-center gap-2 border border-white/10">
                    <span className="text-xl">📌</span>
                    <span className="text-gray-300 font-bold text-sm uppercase tracking-wider">Free Plan</span>
                  </div>
                )}

                <div className="px-6 py-2 bg-white/5 rounded-2xl flex items-center gap-2 border border-white/10">
                  <span className="text-green-400">●</span>
                  <span className="text-gray-300 font-bold text-sm uppercase tracking-wider">
                    {user.isActive ? 'Active Member' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-8 py-3 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition-all active:scale-95 shadow-xl uppercase tracking-tighter text-sm"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Dynamic Content: Form or Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Personal Info / Editor */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#161616] rounded-[2.5rem] border border-white/5 p-8 shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Personal Details</h2>
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdate} className="space-y-6">
                  {/* Form Inputs with Modern Styling */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Full Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-6 py-4 bg-white/5 rounded-2xl border border-white/10 focus:border-red-600 focus:outline-none focus:bg-white/10 transition-all text-white font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-6 py-4 bg-white/5 rounded-2xl border border-white/10 focus:border-red-600 focus:outline-none focus:bg-white/10 transition-all text-white font-bold"
                        placeholder="Not set"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 opacity-50 cursor-not-allowed">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email Address (Locked)</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-6 py-4 bg-black/40 rounded-2xl border border-white/5 text-gray-500 font-bold"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="submit" className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-lg uppercase tracking-wider text-sm">
                      Update Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: user.name || '',
                          phone: user.phone || ''
                        });
                        setError('');
                      }}
                      className="px-8 py-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-sm font-bold text-white uppercase"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-[#e50914] uppercase tracking-widest">Full Name</p>
                    <p className="text-xl font-bold text-white tracking-tight">{user.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-[#e50914] uppercase tracking-widest">Phone</p>
                    <p className="text-xl font-bold text-white tracking-tight">{user.phone || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-[#e50914] uppercase tracking-widest">Email</p>
                    <p className="text-xl font-bold text-white tracking-tight">{user.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Courses / Categories Section */}
            <div className="bg-[#161616] rounded-[2.5rem] border border-white/5 p-8 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">My Subscribed Courses</h2>
                  <p className="text-gray-500 text-sm font-medium mt-1">
                    You have access to <span className="text-red-500 font-bold">{user.subscribedCategories?.length || 0}</span> learning modules.
                  </p>
                </div>
              </div>

              {user.subscribedCategories && user.subscribedCategories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {user.subscribedCategories.map((category, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        navigate(`/#category-${category}`);
                        setTimeout(() => {
                          const el = document.getElementById(`category-${category}`);
                          if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
                        }, 100);
                      }}
                      className="group relative bg-[#1c1c1c] hover:bg-red-600 transition-all duration-500 rounded-3xl p-6 text-left border border-white/5 hover:border-red-400 hover:-translate-y-2 overflow-hidden shadow-lg"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 blur-[40px] rounded-full group-hover:bg-white/20 transition-all"></div>
                      <div className="text-3xl mb-4 group-hover:scale-125 transition-transform duration-500 origin-left">📚</div>
                      <div className="font-black text-white text-lg tracking-tighter group-hover:text-white uppercase truncate">{category}</div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 group-hover:text-red-100 transition-colors">Module Assigned</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-black/20 rounded-[2rem] border border-dashed border-white/10">
                  <div className="text-6xl mb-4">🔓</div>
                  <p className="text-xl font-black text-white uppercase tracking-tighter">No Active Courses</p>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto mt-2">
                    Contact your course administrator to get your modules activated and start learning.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Status Cards */}
          <div className="space-y-8">
            {/* Account Status Card */}
            <div className="bg-gradient-to-br from-[#161616] to-[#0a0a0a] rounded-[2.5rem] border border-white/5 p-8 shadow-xl">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Account Status</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-400">Subscription</span>
                  <span className={`text-xs font-black px-3 py-1 rounded-lg uppercase ${user.subscription === 'premium' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-white/5 text-gray-500'
                    }`}>
                    {user.subscription}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-400">Membership</span>
                  <span className="text-xs font-black bg-green-500/10 text-green-500 px-3 py-1 rounded-lg uppercase">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-400">Member Since</span>
                  <span className="text-xs font-black text-white px-3 py-1 rounded-lg uppercase">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Info Message */}
            <div className="bg-red-600/10 rounded-[2.5rem] border border-red-900/20 p-8">
              <div className="text-2xl mb-2">🔄</div>
              <p className="text-sm font-bold text-red-100/80 leading-relaxed">
                Your profile data is synchronized automatically with our secure servers every <span className="text-red-400 font-black">5 seconds</span>.
              </p>
            </div>

            {/* Help Card */}
            <div className="bg-[#161616] rounded-[2.5rem] border border-white/5 p-8">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Need Help?</h3>
              <p className="text-gray-500 text-xs font-medium mb-6 leading-relaxed">
                If you have issues with your subscription or can't see your courses, contact our support team.
              </p>
              <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-xs font-black text-white uppercase tracking-widest">
                Contact Support
              </button>
            </div>
          </div>

        </div>

        {/* Global Notifications */}
        {success && (
          <div className="fixed bottom-8 right-8 bg-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl font-black text-sm uppercase tracking-wider animate-in fade-in slide-in-from-bottom-4 duration-300 z-[200]">
            ✓ {success}
          </div>
        )}
        {error && (
          <div className="fixed bottom-8 right-8 bg-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl font-black text-sm uppercase tracking-wider animate-in fade-in slide-in-from-bottom-4 duration-300 z-[200]">
            ⚠ {error}
          </div>
        )}

      </div>
    </div>
  );
}
