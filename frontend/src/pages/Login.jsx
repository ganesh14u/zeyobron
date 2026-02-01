import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNotification } from '../components/Notification';

export default function Login() {
  const navigate = useNavigate();
  const notify = useNotification();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isSignUp ? '/auth/signup' : '/auth/login';
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}${endpoint}`,
        formData
      );

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        notify(isSignUp ? 'Account created successfully!' : 'Welcome back!', 'success');
        navigate('/');
        window.location.reload();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Authentication failed';
      setError(msg);
      // notify(msg, 'error'); // Removed as per request
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#080808] relative overflow-hidden font-sans">
      {/* Background Ambient Glows - More Subtle */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-red-600/5 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-red-900/5 blur-[150px] rounded-full"></div>

      <div className="relative z-10 w-full max-w-xl p-6 md:p-8 animate-in fade-in zoom-in duration-500">
        <div className="bg-[#121212] border border-white/5 rounded-[2.5rem] p-8 md:p-14 shadow-2xl">

          {/* Header */}
          <div className="mb-10 text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest pt-2">
              {isSignUp ? 'Create your Data Sai account' : 'Access your viewing library'}
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-600/10 border border-red-600/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/5 focus:outline-none focus:border-red-600 focus:bg-white/10 transition-all text-sm font-medium placeholder:text-gray-700"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="Enter phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/5 focus:outline-none focus:border-red-600 focus:bg-white/10 transition-all text-sm font-medium placeholder:text-gray-700"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/5 focus:outline-none focus:border-red-600 focus:bg-white/10 transition-all text-sm font-medium placeholder:text-gray-700"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-[10px] font-bold text-gray-500 hover:text-red-500 transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/5 focus:outline-none focus:border-red-600 focus:bg-white/10 transition-all text-sm font-medium placeholder:text-gray-700"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-red-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-red-700 transition-all active:scale-[0.98] disabled:opacity-50 mt-4 text-xs"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-white/5 text-center">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </p>
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-sm font-black text-white hover:text-red-600 transition-colors uppercase tracking-widest underline underline-offset-8 decoration-red-600/50"
            >
              {isSignUp ? 'Sign In Now' : 'Create Account'}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button onClick={() => navigate('/')} className="text-[10px] font-black text-gray-600 hover:text-white uppercase tracking-[0.3em] transition-colors">
            ← Back to Browse
          </button>
        </div>
      </div>
    </div>
  );
}