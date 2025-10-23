import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNotification } from '../components/Notification';

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
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, { email });
      setSubmitted(true);
      notify('Password reset link sent to your email', 'success');
    } catch (error) {
      notify(error.response?.data?.message || 'Error sending reset link', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-gray-900 p-8 rounded-lg max-w-md w-full text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-bold mb-4">Check Your Email</h2>
          <p className="text-gray-400 mb-6">
            We've sent a password reset link to <span className="text-white">{email}</span>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            If you don't see the email, check your spam folder.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-red-600 hover:bg-red-700 rounded font-semibold"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-gray-900 p-8 rounded-lg max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-red-600 mb-2">ZEYOBRON</h1>
          <h2 className="text-xl font-semibold">Reset Your Password</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-red-600"
              placeholder="Enter your email"
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              We'll send a password reset link to your email address
            </p>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 rounded font-semibold disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-gray-400 hover:text-white text-sm"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}