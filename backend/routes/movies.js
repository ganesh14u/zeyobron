import express from 'express';
import Movie from '../models/Movie.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get movies - Show ALL movies to everyone, frontend handles premium badges
router.get('/', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    let filter = {};
    let user = null;

    // Check if user is logged in (for logging purposes only)
    if (token) {
      try {
        const jwt = await import('jsonwebtoken');
        const User = await import('../models/User.js');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
        user = await User.default.findById(decoded.id).select('-password');

        if (user && user.role === 'admin') {
          console.log('Admin user - showing all movies');
        } else if (user) {
          console.log('Regular user - showing all movies with premium badges on frontend');
        }
      } catch (err) {
        console.log('Invalid token - showing all movies for guest');
      }
    } else {
      console.log('No token - showing all movies for guest');
    }

    // Apply query filters (search, category filter, featured)
    const { q, category, featured } = req.query;
    if (q) filter.title = new RegExp(q, 'i');
    if (category) filter.category = category;
    if (featured) filter.featured = featured === 'true';

    console.log('Final filter:', filter);
    const movies = await Movie.find(filter).sort({ createdAt: -1 }).limit(100);
    console.log('Movies found:', movies.length);
    res.json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).select('-videoUrl');
    if (!movie) return res.status(404).json({ message: 'Not found' });
    res.json(movie);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Securely fetch video URL for authorized users
router.get('/:id/play', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    // 1. If content is free, anyone can watch (including guests)
    if (!movie.isPremium) {
      return res.json({
        videoUrl: movie.videoUrl,
        videoType: movie.videoType || 'direct'
      });
    }

    // 2. If content is premium, check authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required for premium content' });
    }

    const token = authHeader.split(' ')[1];
    const jwt = await import('jsonwebtoken');
    const User = await import('../models/User.js');

    try {
      const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
      const user = await User.default.findById(decoded.id);

      if (!user) return res.status(401).json({ message: 'User not found' });

      const isAdmin = user.role === 'admin';
      const isPremiumUser = (user.subscription || '').toLowerCase() === 'premium';

      if (isAdmin || isPremiumUser) {
        return res.json({
          videoUrl: movie.videoUrl,
          videoType: movie.videoType || 'direct'
        });
      }

      res.status(403).json({ message: 'Premium subscription required' });
    } catch (err) {
      res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check video access - requires authentication
router.get('/:id/access', protect, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    // 1. Admin Override
    if (req.user.role === 'admin') {
      return res.json({ hasAccess: true, reason: 'admin-override' });
    }

    // 2. Premium User Override
    if ((req.user.subscription || '').toLowerCase() === 'premium') {
      return res.json({ hasAccess: true, reason: 'premium-plan' });
    }

    // 3. Free User Logic
    if (movie.isPremium) {
      // Strict lock: Free users cannot watch premium videos
      return res.json({ hasAccess: false, reason: 'premium-required' });
    } else {
      return res.json({ hasAccess: true, reason: 'free-tier' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update movie duration automatically - requires auth
router.put('/:id/duration', protect, async (req, res) => {
  try {
    const { duration } = req.body;
    if (!duration) return res.status(400).json({ message: 'Duration is required' });

    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    // Only update if duration is currently missing or generic '00:00'
    if (!movie.duration || movie.duration === '00:00') {
      movie.duration = duration;
      await movie.save();
      return res.json({ message: 'Duration updated automatically', duration });
    }

    res.json({ message: 'Duration already exists', duration: movie.duration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
