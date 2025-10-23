import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/reset-password/${token}`,
        { password }
      );
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold mb-4">Password Reset Successful!</h1>
          <p className="text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black bg-cover bg-center relative"
      style={{ backgroundImage: 'url(https://assets.nflxext.com/ffe/siteui/vlv3/9f46b569-aff7-4975-9b8e-3212e4637f16/453ba2a1-6138-4e3c-9a06-b66f9a2832e4/IN-en-20240415-popsignuptwoweeks-perspective_alpha_website_large.jpg)' }}>
      
      <div className="absolute inset-0 bg-black/60"></div>
      
      <div className="absolute top-6 left-6 z-20">
        <h1 className="text-4xl font-bold text-red-600">ZEYOBRON</h1>
      </div>
      
      <div className="relative z-10 w-full max-w-md p-8">
        <div className="bg-black/75 rounded px-16 py-12">
          <h1 className="text-3xl font-bold mb-8">Set New Password</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-orange-600 rounded text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-white"
                required
              />
            </div>
            
            <div className="mb-6">
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-white"
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
              className="text-gray-400 hover:text-white"
            >
              ← Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
