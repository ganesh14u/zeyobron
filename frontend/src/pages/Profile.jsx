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
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pt-32 pb-20 px-6 md:px-12">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* Header Section */}
        <header className="flex justify-between items-end animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">My Profile</h1>
            <p className="text-gray-500 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mt-2">Manage your account & preferences</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5 backdrop-blur-md"
          >
            ← Back to Home
          </button>
        </header>

        {/* Profile Card */}
        <div className="bg-[#161616] rounded-[3rem] p-10 md:p-16 border border-white/5 shadow-2xl relative overflow-hidden group animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 blur-[150px] rounded-full -mr-20 -mt-20 group-hover:bg-red-600/10 transition-colors duration-1000"></div>

          <div className="relative z-10 flex flex-col lg:flex-row gap-16 items-start">

            {/* Avatar Column */}
            <div className="flex flex-col items-center space-y-6 w-full lg:w-auto">
              <div className="relative">
                <div className="w-48 h-48 md:w-56 md:h-56 rounded-[2.5rem] bg-gradient-to-br from-[#222] to-[#0a0a0a] border border-white/10 flex items-center justify-center shadow-2xl group-hover:border-red-600/30 transition-all duration-500">
                  <span className="text-8xl font-black text-white/5 tracking-tighter select-none absolute">{user.name?.charAt(0).toUpperCase()}</span>
                  <div className="relative z-10">
                    <span className="text-6xl font-black bg-gradient-to-br from-white to-gray-500 text-transparent bg-clip-text">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-xl border-4 border-[#161616] flex items-center justify-center text-xs font-black ${user.isActive ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                  {user.isActive ? '✓' : '✕'}
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full">
                {user.subscription === 'premium' ? (
                  <div className="px-6 py-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-2xl text-center">
                    <div className="text-xs font-black uppercase tracking-widest">Premium Plan</div>
                    <div className="text-[10px] opacity-60 font-bold mt-1">Founding Member</div>
                  </div>
                ) : (
                  <div className="space-y-4 w-full">
                    <div className="px-6 py-4 bg-white/5 border border-white/10 text-gray-400 rounded-2xl text-center">
                      <div className="text-xs font-black uppercase tracking-widest">Free Plan</div>
                      <div className="text-[10px] opacity-60 font-bold mt-1">Limited Access</div>
                    </div>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-900/20 hover:scale-105 active:scale-95 animate-pulse"
                    >
                      🚀 Upgrade to Premium
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* UPI Payment Modal */}
            {showPaymentModal && (
              <div className="fixed inset-0 z-[500] flex items-center justify-center px-4 md:px-0">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowPaymentModal(false)}></div>
                <div className="relative z-10 w-full max-w-lg bg-[#111] border border-white/10 rounded-[3rem] p-10 md:p-12 shadow-2xl animate-in zoom-in-95 duration-300">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-xl"
                  >
                    ✕
                  </button>

                  <div className="space-y-8 text-center">
                    <div className="space-y-2">
                      <div className="w-20 h-20 bg-red-600/10 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4">🛡️</div>
                      <h3 className="text-3xl font-black uppercase tracking-tighter italic text-white leading-none">Complete Upgrade</h3>
                      <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Premium Lifetime Access</p>
                    </div>

                    <div className="p-8 bg-black/40 rounded-[2rem] border border-white/5 space-y-4">
                      <div className="flex justify-between items-center text-gray-400 text-[10px] font-black uppercase tracking-widest">
                        <span>One-Time Investment</span>
                        <span className="text-white text-lg">₹20,000/-</span>
                      </div>
                      <div className="h-px bg-white/5 w-full"></div>
                      <div className="space-y-4 pt-2">
                        <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest italic animate-pulse">Scan or Pay via UPI to confirm</p>

                        {/* Actual UPI Details & QR Code */}
                        <div className="space-y-6">
                          <div className="bg-white rounded-3xl p-4 shadow-2xl overflow-hidden group/qr max-w-[200px] mx-auto">
                            <img
                              src="/qr-code.jpg"
                              alt="UPI QR Code"
                              className="w-full h-auto rounded-2xl group-hover:scale-110 transition-transform duration-700"
                            />
                          </div>

                          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Payable via UPI ID</div>
                            <div className="text-xl font-bold text-white tracking-tight break-all">sbi14u@ybl</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {['GPay', 'PhonePe', 'Paytm', 'WhatsApp'].map(app => (
                            <button key={app} className="py-4 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">
                              {app}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[9px] text-gray-600 font-medium uppercase tracking-[0.2em]">Once paid, please wait for automatic confirmation or contact support with your transaction ID.</p>
                      <button
                        onClick={() => {
                          const upiUrl = `upi://pay?pa=sbi14u@ybl&pn=Zeyobron&am=20000&cu=INR`;
                          window.open(upiUrl, '_blank');
                        }}
                        className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-900/40"
                      >
                        Open UPI App
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Details Column */}
            <div className="flex-1 w-full space-y-10">
              <div className="space-y-2 text-center lg:text-left">
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">{user.name}</h2>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{user.email}</p>
              </div>

              {/* Form Section */}
              <div className="bg-black/20 rounded-[2.5rem] p-8 md:p-10 border border-white/5">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">Personal Information</h3>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-3 bg-white text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all shadow-lg hover:scale-105"
                    >
                      Edit Details
                    </button>
                  )}
                </div>

                <form onSubmit={handleUpdate} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Full Name</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full px-8 py-5 rounded-2xl font-bold transition-all outline-none text-sm ${isEditing ? 'bg-black/40 border border-white/10 focus:border-red-600 text-white' : 'bg-transparent border border-transparent text-gray-400 pl-0 text-lg'}`}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Phone Number</label>
                      <input
                        type="tel"
                        disabled={!isEditing}
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder={isEditing ? "Enter phone number" : "Not set"}
                        className={`w-full px-8 py-5 rounded-2xl font-bold transition-all outline-none text-sm ${isEditing ? 'bg-black/40 border border-white/10 focus:border-red-600 text-white' : 'bg-transparent border border-transparent text-gray-400 pl-0 text-lg'}`}
                      />
                    </div>
                  </div>

                  {/* Status Messages */}
                  {error && <div className="p-4 bg-red-600/10 border border-red-600/20 text-red-500 rounded-xl text-center text-xs font-black uppercase tracking-widest animate-pulse">{error}</div>}
                  {success && <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl text-center text-xs font-black uppercase tracking-widest">{success}</div>}

                  {isEditing && (
                    <div className="flex gap-4 pt-4 border-t border-white/5">
                      <button
                        type="submit"
                        className="py-5 px-10 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all shadow-xl hover:shadow-red-900/20 hover:scale-[1.02]"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({ name: user.name || '', phone: user.phone || '' });
                          setError('');
                        }}
                        className="py-5 px-10 bg-white/5 text-gray-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/10 hover:text-white transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { l: 'Member Since', v: new Date(user.createdAt).getFullYear() || '2024' },
                  { l: 'Last Login', v: 'Today' },
                  { l: 'Plan Status', v: user.isActive ? 'Active' : 'Inactive' },
                  { l: 'Modules', v: user.subscribedCategories?.length || 0 }
                ].map((stat, i) => (
                  <div key={i} className="bg-[#111] p-6 rounded-[2rem] border border-white/5 text-center hover:border-white/10 transition-colors">
                    <div className="text-2xl font-black text-white mb-2">{stat.v}</div>
                    <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{stat.l}</div>
                  </div>
                ))}
              </div>

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
