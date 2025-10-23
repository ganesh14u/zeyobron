import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useNotification } from '../components/Notification';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const navigate = useNavigate();
  const notify = useNotification();
  
  const token = searchParams.get('token');

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
      notify('Password reset successfully!', 'success');
    } catch (error) {
      notify(error.response?.data?.message || 'Error resetting password', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-gray-900 p-8 rounded-lg max-w-md w-full text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-4">Invalid Reset Link</h2>
          <p className="text-gray-400 mb-6">
            This password reset link is invalid or has expired.
          </p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full py-3 bg-red-600 hover:bg-red-700 rounded font-semibold"
          >
            Request New Reset Link
          </button>
        </div>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-gray-900 p-8 rounded-lg max-w-md w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-4">Password Reset!</h2>
          <p className="text-gray-400 mb-6">
            Your password has been successfully reset.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-red-600 hover:bg-red-700 rounded font-semibold"
          >
            Login with New Password
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
          <h2 className="text-xl font-semibold">Set New Password</h2>
          <p className="text-gray-400 text-sm mt-2">
            Create a new password for your account
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm mb-2">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-red-600"
              placeholder="Enter new password"
              required
              minLength="6"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-red-600"
              placeholder="Confirm new password"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 rounded font-semibold disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
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