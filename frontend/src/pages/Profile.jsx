import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Profile() {
  const navigate = useNavigate();
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
      setFormData({
        name: userData.name || '',
        phone: userData.phone || ''
      });

      // Update localStorage with fresh data
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Dispatch custom event to notify other components
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

    // Poll for updates every 5 seconds when on profile page
    const interval = setInterval(fetchUserData, 5000);

    return () => clearInterval(interval);
  }, []);

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

      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.dispatchEvent(new Event('userDataUpdated'));
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="pt-24 px-6 pb-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-600 rounded text-white">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-600 rounded text-white">
          {error}
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Personal Information</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
            >
              Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Name:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Phone Number:</label>
              <input
                type="tel"
                value={formData.phone || ''}  
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-400">Email:</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-2 bg-gray-900 rounded border border-gray-600 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 rounded hover:bg-green-700"
              >
                Save Changes
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
                className="px-6 py-2 bg-gray-600 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Name:</label>
              <p className="text-lg">{user.name}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Email:</label>
              <p className="text-lg">{user.email}</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Phone Number:</label>
              <p className="text-lg">{user.phone || 'Not provided'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Subscription Details */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Subscription Details</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Subscription Type:</label>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-semibold ${
                user.subscription === 'premium' ? 'text-yellow-400' : 'text-gray-300'
              }`}>
                {user.subscription === 'premium' ? '⭐ Premium (Lifetime)' : '📌 Free'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Account Status:</label>
            <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
              user.isActive ? 'bg-green-600' : 'bg-red-600'
            }`}>
              {user.isActive ? '✓ Active' : '✗ Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Accessible Categories (Courses) */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">My Courses (Accessible Categories)</h2>
        
        {user.subscribedCategories && user.subscribedCategories.length > 0 ? (
          <>
            <p className="text-sm text-gray-400 mb-4">
              You have access to {user.subscribedCategories.length} categor{user.subscribedCategories.length === 1 ? 'y' : 'ies'}. Click to view.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {user.subscribedCategories.map((category, index) => (
                <button
                  key={index}
                  onClick={() => {
                    navigate(`/#category-${category}`);
                    window.scrollTo({ 
                      top: document.getElementById(`category-${category}`)?.offsetTop - 100 || 0,
                      behavior: 'smooth' 
                    });
                  }}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg p-4 text-center transition-all transform hover:scale-105 cursor-pointer"
                >
                  <div className="text-2xl mb-2">📚</div>
                  <div className="font-semibold">{category}</div>
                  <div className="text-xs text-gray-200 mt-1">Click to view</div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🔒</div>
            <p className="text-gray-400 mb-2">No categories assigned yet</p>
            <p className="text-sm text-gray-500">
              Contact admin to get access to categories
            </p>
          </div>
        )}
      </div>

      {/* Live Update Indicator */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          🔄 Profile updates automatically every 5 seconds
        </p>
      </div>
    </div>
  );
}
