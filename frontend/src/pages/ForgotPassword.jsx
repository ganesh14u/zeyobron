import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNotification } from '../components/Notification';
import { API_URL } from '../config';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const notify = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setSubmitted(true);
      notify('Password reset email sent', 'success');
    } catch (error) {
      notify(error.response?.data?.message || 'Error sending reset link', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#080808] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-red-600/5 blur-[120px]"></div>
        <div className="relative z-10 w-full max-w-md p-12 text-center bg-[#121212] rounded-[2.5rem] border border-white/5 animate-in zoom-in duration-500 shadow-2xl">
          <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center text-4xl mx-auto mb-8 shadow-xl">📧</div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic mb-4">Email Sent</h2>
          <p className="text-gray-400 text-sm font-medium leading-relaxed italic mb-8">
            Check your inbox for a password reset link. Be sure to check your spam folder as well.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-5 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all shadow-xl text-xs"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#080808] relative overflow-hidden font-sans pt-24 pb-12">
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-red-600/5 blur-[150px] rounded-full"></div>

      <div className="relative z-10 w-full max-w-xl p-6 animate-in fade-in zoom-in duration-500">
        <div className="bg-[#121212] border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
          <div className="mb-10 text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">Reset Password</h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest pt-2">Enter your email to receive recovery instructions</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-5 rounded-2xl bg-white/5 border border-white/5 focus:outline-none focus:border-red-600 focus:bg-white/10 transition-all text-sm font-medium placeholder:text-gray-700"
                placeholder="email@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-red-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-red-700 transition-all active:scale-[0.98] disabled:opacity-50 text-xs"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-white/5 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-black text-white hover:text-red-600 transition-colors uppercase tracking-widest underline underline-offset-8 decoration-red-600/50"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}