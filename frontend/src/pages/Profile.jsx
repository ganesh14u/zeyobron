import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { API_URL, RAZORPAY_KEY_ID } from '../config';
import { useNotification } from '../components/Notification';

export default function Profile() {
  const navigate = useNavigate();
  const notify = useNotification();
  // ... (existing state)
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [pricingSettings, setPricingSettings] = useState({
    premiumPrice: 20000,
    originalPrice: 25000,
    discountLabel: '20% OFF'
  });

  // Fetch fresh user data
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(
        `${API_URL}/auth/me`,
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

      // Fetch Pricing Settings
      try {
        const settingsRes = await axios.get(`${API_URL}/admin/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPricingSettings(settingsRes.data);
      } catch (e) { console.error("Pricing settings fetch failed", e); }

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

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/auth/update-profile`,
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

      notify('Profile updated successfully!', 'success');
      setIsEditing(false);
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to update profile', 'error');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.password !== passwordData.confirmPassword) {
      notify('Passwords do not match', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/auth/change-password`,
        passwordData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      notify('Password changed successfully!', 'success');
      setIsChangingPassword(false);
      setPasswordData({ password: '', confirmPassword: '' });
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to change password', 'error');
    }
  };

  const handleRazorpayPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // 1. Create order on backend
      const orderRes = await axios.post(
        `${API_URL}/payment/order`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { id: order_id, amount, currency } = orderRes.data;

      // 2. Open Razorpay Checkout
      const options = {
        key: RAZORPAY_KEY_ID || 'rzp_test_placeholder', // Should be in .env
        amount: amount,
        currency: currency,
        name: "Data Sai Premium",
        description: "Lifetime Elite Access",
        order_id: order_id,
        handler: async function (response) {
          try {
            // 3. Verify payment on backend
            const verifyRes = await axios.post(
              `${API_URL}/payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.success) {
              notify('Welcome to Premium Elite!', 'success');
              setShowPaymentModal(false);
              fetchUserData(); // Refresh user state
            }
          } catch (err) {
            notify('Payment verification failed. Please contact support.', 'error');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || '',
        },
        theme: {
          color: "#dc2626", // Red 600
        },
        modal: {
          ondismiss: function () {
            notify('Payment cancelled by user', 'warning');
          }
        }
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response) {
        notify(`Payment Failed: ${response.error.description}`, 'error');
      });

      rzp.open();

    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to initiate payment. Check your Razorpay keys and Internet.';
      notify(msg, 'error');
      console.error('Payment Error:', err);
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

            {/* Status Messages removed from here as they are now global toasts */}

            {/* UPI Payment Modal */}
            {showPaymentModal && (
              <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
                <div className="fixed inset-0" onClick={() => setShowPaymentModal(false)}></div>

                <div className="relative z-10 w-full max-w-4xl max-h-[85vh] bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-[0_0_80px_rgba(220,38,38,0.25)] animate-in zoom-in-95 duration-300 flex flex-col">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="absolute top-5 right-5 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-red-600 transition-all text-sm z-50 group border border-white/10"
                  >
                    <span className="group-hover:rotate-90 transition-transform">✕</span>
                  </button>

                  <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden lg:min-h-[400px]">
                    {/* Left Side: Value Prop */}
                    <div className="lg:w-1/2 p-10 md:p-12 bg-gradient-to-br from-[#111] to-black relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(220,38,38,0.1),transparent)]"></div>

                      <div className="relative z-10 space-y-6">
                        <div className="inline-flex items-center gap-3 px-3 py-1.5 bg-red-600/10 border border-red-600/20 rounded-lg">
                          <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                          <span className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em]">Unlimited Access</span>
                        </div>

                        <div className="space-y-3">
                          <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic text-white leading-[0.9]">
                            Upgrade to <br />
                            <span className="text-red-600">Premium Elite</span>
                          </h3>
                          <p className="text-gray-500 text-xs font-medium leading-relaxed max-w-xs">
                            Master the industry with lifetime access to all core sessions and future updates.
                          </p>
                        </div>

                        <ul className="space-y-3">
                          {[
                            'Lifetime Access to All Lessons',
                            'Exclusive Premium Content',
                            'Direct Path to Advanced Modules',
                            'Dedicated Student Support',
                            'Offline Learning Resources'
                          ].map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 group">
                              <span className="w-5 h-5 rounded-md bg-green-500/10 border border-green-500/20 flex items-center justify-center text-[8px] text-green-500">✓</span>
                              <span className="text-[11px] font-bold text-gray-300 group-hover:text-white transition-colors">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="relative z-10 pt-8 border-t border-white/5">
                        <div className="flex items-end gap-3">
                          <span className="text-4xl font-black text-white tracking-tighter italic">₹{(pricingSettings.premiumPrice || 0).toLocaleString()}</span>
                          <span className="text-gray-600 text-[9px] font-black uppercase tracking-widest pb-1.5">/ Lifetime Access</span>
                        </div>
                        <div className="mt-4 flex items-center gap-4">
                          <span className="text-gray-500 line-through text-sm font-bold italic">₹{(pricingSettings.originalPrice || 0).toLocaleString()}</span>
                          <span className="px-5 py-2 bg-red-600 text-white font-black uppercase text-[18px] rounded-xl shadow-[0_10px_30px_rgba(220,38,38,0.4)] tracking-tighter italic scale-110">
                            {pricingSettings.discountLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Payment Methods */}
                    <div className="lg:w-1/2 p-10 md:p-12 bg-[#0a0a0a] flex flex-col justify-center items-center text-center space-y-10">
                      <div className="space-y-3">
                        <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">💳</div>
                        <h4 className="text-xl font-black uppercase tracking-tighter italic text-white">Instant Activation</h4>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.3em]">Secure Automated Payment</p>
                      </div>

                      <div className="w-full space-y-5">
                        <button
                          onClick={handleRazorpayPayment}
                          className="w-full py-5 bg-red-600 text-white font-black uppercase text-xs tracking-[0.2em] rounded-xl hover:bg-red-700 transition-all shadow-[0_15px_30px_rgba(220,38,38,0.25)] hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                        >
                          PROCEED TO PAY ₹{(pricingSettings.premiumPrice || 0).toLocaleString()}
                        </button>

                        <p className="text-[9px] text-gray-600 font-medium uppercase tracking-[0.2em] max-w-[280px] mx-auto leading-loose">
                          Payment processed securely via Razorpay. Your account will be upgraded immediately after success.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-700 h-8">
                        {['GPay', 'PhonePe', 'Paytm', 'Visa', 'Mastercard'].map(app => (
                          <span key={app} className="text-[8px] font-black uppercase tracking-widest border border-white/20 px-3 py-1.5 rounded-lg">{app}</span>
                        ))}
                      </div>
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
                  <div className="flex gap-4">
                    {!isEditing && !isChangingPassword && (
                      <>
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setIsChangingPassword(false);
                          }}
                          className="px-6 py-3 bg-white text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all shadow-lg hover:scale-105"
                        >
                          Edit Details
                        </button>
                        <button
                          onClick={() => {
                            setIsChangingPassword(true);
                            setIsEditing(false);
                          }}
                          className="px-6 py-3 bg-white/5 text-white border border-white/10 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all shadow-lg hover:scale-105"
                        >
                          Change Password
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isChangingPassword ? (
                  <form onSubmit={handlePasswordChange} className="space-y-8 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">New Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={passwordData.password}
                          onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                          className="w-full px-8 py-5 rounded-2xl font-bold bg-black/40 border border-white/10 focus:border-red-600 text-white transition-all outline-none text-sm"
                          required
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Confirm New Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="w-full px-8 py-5 rounded-2xl font-bold bg-black/40 border border-white/10 focus:border-red-600 text-white transition-all outline-none text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-white/5">
                      <button
                        type="submit"
                        className="py-5 px-10 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all shadow-xl hover:shadow-red-900/20 hover:scale-[1.02]"
                      >
                        Update Password
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordData({ password: '', confirmPassword: '' });
                        }}
                        className="py-5 px-10 bg-white/5 text-gray-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/10 hover:text-white transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
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

                    {/* Status Messages removed from here as they are now at the top for better visibility */}

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
                          }}
                          className="py-5 px-10 bg-white/5 text-gray-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/10 hover:text-white transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </form>
                )}
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

        {/* Global Notifications are already handled by the <Notification /> component in App.jsx or equivalent */}

      </div>
    </div>
  );
}
