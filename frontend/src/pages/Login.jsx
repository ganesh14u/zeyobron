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
        navigate('/');
        window.location.reload();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black bg-cover bg-center relative"
      style={{ backgroundImage: 'url(https://assets.nflxext.com/ffe/siteui/vlv3/9f46b569-aff7-4975-9b8e-3212e4637f16/453ba2a1-6138-4e3c-9a06-b66f9a2832e4/IN-en-20240415-popsignuptwoweeks-perspective_alpha_website_large.jpg)' }}>
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60"></div>
      
      {/* Logo */}
      <div className="absolute top-6 left-6 z-20">
        <h1 className="text-4xl font-bold text-red-600">ZEYOBRON</h1>
      </div>
      
      {/* Form */}
      <div className="relative z-10 w-full max-w-md p-8">
        <div className="bg-black/75 rounded px-16 py-12">
          <h1 className="text-3xl font-bold mb-8">{isSignUp ? 'Sign Up' : 'Sign In'}</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-orange-600 rounded text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-white"
                    required
                  />
                </div>
                <div className="mb-4">
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-white"
                    required
                  />
                </div>
              </>
            )}
            
            <div className="mb-4">
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-white"
                required
              />
            </div>
            
            <div className="mb-6">
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-white"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 rounded font-semibold disabled:opacity-50 mb-4"
            >
              {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
            
            {!isSignUp && (
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center text-sm text-gray-400">
                  <input type="checkbox" className="mr-2" />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </form>
          
          <div className="mt-8 text-gray-400">
            {isSignUp ? (
              <div>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setIsSignUp(false);
                    setError('');
                  }}
                  className="text-white hover:underline"
                >
                  Sign in now
                </button>
              </div>
            ) : (
              <div>
                New to Zeyobron?{' '}
                <button
                  onClick={() => {
                    setIsSignUp(true);
                    setError('');
                  }}
                  className="text-white hover:underline"
                >
                  Sign up now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}