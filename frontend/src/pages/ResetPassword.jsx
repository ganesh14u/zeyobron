import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useNotification } from '../components/Notification';

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const navigate = useNavigate();
  const notify = useNotification();

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      notify('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      notify('Password must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/reset-password/${token}`, { password });
      setResetSuccess(true);
      notify('Password updated successfully', 'success');
    } catch (error) {
      notify(error.response?.data?.message || 'Error updating password', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#080808] relative overflow-hidden">
        <div className="absolute inset-0 bg-red-600/5 blur-[120px]"></div>
        <div className="relative z-10 w-full max-w-md p-12 text-center bg-[#121212] rounded-[2.5rem] border border-white/5 animate-in zoom-in duration-500 shadow-2xl">
          <div className="text-5xl mb-8">🚫</div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-4">Invalid Link</h2>
          <p className="text-gray-400 text-sm font-medium leading-relaxed italic mb-8">
            This password reset link is invalid or has expired. Please request a new link.
          </p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full py-5 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all text-xs"
          >
            Request New Link
          </button>
        </div>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#080808] relative overflow-hidden">
        <div className="absolute inset-0 bg-green-600/5 blur-[120px]"></div>
        <div className="relative z-10 w-full max-w-md p-12 text-center bg-[#121212] rounded-[2.5rem] border border-white/5 animate-in zoom-in duration-500 shadow-2xl">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-3xl mx-auto mb-8 shadow-xl">✅</div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-4">Success!</h2>
          <p className="text-gray-400 text-sm font-medium leading-relaxed italic mb-8">
            Your password has been successfully updated. You can now log in with your new credentials.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-5 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all text-xs"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#080808] relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-red-600/5 blur-[150px] rounded-full"></div>

      <div className="relative z-10 w-full max-w-xl p-6 md:p-8 animate-in fade-in zoom-in duration-500">
        <div className="bg-[#121212] border border-white/5 rounded-[2.5rem] p-8 md:p-14 shadow-2xl">
          <div className="mb-10 text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">Set Password</h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest pt-2">Enter a new secure password for your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-5 rounded-2xl bg-white/5 border border-white/5 focus:outline-none focus:border-red-600 focus:bg-white/10 transition-all text-sm font-medium placeholder:text-gray-700"
                placeholder="••••••••"
                required
                minLength="6"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-6 py-5 rounded-2xl bg-white/5 border border-white/5 focus:outline-none focus:border-red-600 focus:bg-white/10 transition-all text-sm font-medium placeholder:text-gray-700"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-red-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-red-700 transition-all active:scale-[0.98] disabled:opacity-50 mt-8 text-xs"
            >
              {loading ? 'Changing...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}