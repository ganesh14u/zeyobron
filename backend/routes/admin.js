import express from 'express';
import Movie from '../models/Movie.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Settings from '../models/Settings.js';
import { protect, adminOnly } from '../middleware/auth.js';
import multer from 'multer';
import { Readable } from 'stream';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ==================== MOVIE ROUTES ====================

// Download sample CSV template
router.get('/movies/sample-csv', protect, adminOnly, (req, res) => {
  const sampleCSV = `Title,Description,Poster,VideoUrl,VideoType,BatchNo,IsPremium,Featured,Categories
AWS Cloud Practitioner Mastery,"Complete guide to cloud computing with AWS. Learn core services, security, and architecture.",https://images.unsplash.com/photo-1516116216624-53e697fedbea,https://www.youtube.com/watch?v=dQw4w9WgXcQ,youtube,Batch 01,true,true,"Big Data Videos, Gold Videos"
SQL Performance Tuning,"Learn how to optimize slow queries and improve database performance indexes.",https://images.unsplash.com/photo-1544383835-bda2bc66a55d,https://www.youtube.com/watch?v=dQw4w9WgXcQ,youtube,Session 45,false,true,"Big Data Sql Scenarios"`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="sample-movies.csv"');
  res.send(sampleCSV);
});

// Create movie
router.post('/movie', protect, adminOnly, async (req, res) => {
  const movie = await Movie.create(req.body);
  res.json(movie);
});

// Bulk upload movies via CSV
router.post('/movies/bulk-csv', protect, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const movies = [];
    const fileBuffer = req.file.buffer.toString('utf8');
    const readableStream = Readable.from(fileBuffer);

    readableStream
      .pipe(csv())
      .on('data', (row) => {
        // Trim whitespace from all values
        const cleanRow = {};
        Object.keys(row).forEach(key => {
          cleanRow[key.trim().toLowerCase()] = row[key] ? row[key].trim() : '';
        });

        // Only add movies with a title
        if (cleanRow.title) {
          movies.push({
            title: cleanRow.title,
            description: cleanRow.description || '',
            poster: cleanRow.poster || '',
            videoUrl: cleanRow.videourl || cleanRow.url || '',
            videoType: (cleanRow.videotype || cleanRow.type || 'direct').toLowerCase(),
            category: (cleanRow.categories || cleanRow.category) ? (cleanRow.categories || cleanRow.category).split(',').map(c => c.trim()) : [],
            batchNo: cleanRow.batch || cleanRow.batchno || '',
            duration: cleanRow.duration || '',
            featured: cleanRow.featured === 'true' || cleanRow.featured === '1' || cleanRow.featured === 'TRUE',
            isPremium: cleanRow.ispremium === 'true' || cleanRow.ispremium === '1' || cleanRow.ispremium === 'TRUE'
          });
        }
      })
      .on('end', async () => {
        try {
          if (movies.length === 0) {
            return res.status(400).json({ message: 'No valid movies found in CSV. Make sure the file has a "title" column and at least one row with data.' });
          }

          // Check for duplicates by title and prevent insertion
          const existingTitles = await Movie.find({
            title: { $in: movies.map(m => m.title) }
          }).select('title');

          const existingTitleSet = new Set(existingTitles.map(m => m.title));
          const newMovies = movies.filter(m => !existingTitleSet.has(m.title));
          const duplicates = movies.filter(m => existingTitleSet.has(m.title));

          if (newMovies.length === 0) {
            return res.status(400).json({
              message: 'All videos are duplicates. No new videos were added.',
              duplicates: duplicates.map(m => m.title)
            });
          }

          const createdMovies = await Movie.insertMany(newMovies);

          const response = {
            success: true,
            count: createdMovies.length,
            movies: createdMovies
          };

          if (duplicates.length > 0) {
            response.warning = `${duplicates.length} duplicate(s) skipped: ${duplicates.map(m => m.title).join(', ')}`;
            response.duplicates = duplicates.map(m => m.title);
          }

          res.json(response);
        } catch (error) {
          res.status(500).json({ message: 'Database error: ' + error.message });
        }
      })
      .on('error', (error) => {
        res.status(500).json({ message: 'CSV parsing error: ' + error.message });
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk upload movies (JSON - keep for backward compatibility)
// Bulk upload movies (JSON - keep for backward compatibility)
router.post('/movies/bulk', protect, adminOnly, async (req, res) => {
  try {
    const { movies } = req.body;
    if (!Array.isArray(movies)) {
      return res.status(400).json({ message: 'Movies must be an array' });
    }

    // Check for duplicates
    const titles = movies.map(m => m.title);
    const existing = await Movie.find({ title: { $in: titles } }).select('title');
    const existingSet = new Set(existing.map(m => m.title));

    const newMovies = movies.filter(m => !existingSet.has(m.title));

    if (newMovies.length === 0) {
      return res.json({ message: 'All movies already exist', count: 0 });
    }

    const createdMovies = await Movie.insertMany(newMovies);
    res.json({
      success: true,
      count: createdMovies.length,
      movies: createdMovies
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update movie
router.put('/movie/:id', protect, adminOnly, async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(movie);
});

// Delete
router.delete('/movie/:id', protect, adminOnly, async (req, res) => {
  await Movie.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

// ==================== CATEGORY ROUTES ====================

// Get all categories
router.get('/categories', protect, adminOnly, async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json(categories);
});

// Create category
router.post('/category', protect, adminOnly, async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update category
router.put('/category/:id', protect, adminOnly, async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(category);
});

// Delete category
router.delete('/category/:id', protect, adminOnly, async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: 'Category deleted' });
});

// ==================== USER MANAGEMENT ROUTES ====================

// List users (admin)
router.get('/users', protect, adminOnly, async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

// Get global stats including payments
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const [movieCount, userCount, categoryCount, payments] = await Promise.all([
      Movie.countDocuments(),
      User.countDocuments(),
      Category.countDocuments(),
      Payment.find().sort({ createdAt: -1 })
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      movies: movieCount,
      users: userCount,
      categories: categoryCount,
      paymentCount: payments.length,
      totalRevenue,
      recentPayments: payments.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset all payment data
router.delete('/payments/reset', protect, adminOnly, async (req, res) => {
  try {
    await Payment.deleteMany({});
    res.json({ message: 'Payment history reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user subscription (removed expiry)
router.put('/user/:id/subscription', protect, adminOnly, async (req, res) => {
  try {
    const { subscription, subscribedCategories } = req.body;
    const updates = {};

    if (subscription) updates.subscription = subscription;
    if (subscribedCategories) updates.subscribedCategories = subscribedCategories;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update user status (active/revoked)
router.put('/user/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body; // 'active' or 'revoked'
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent blocking the main admin
    if (user.role === 'admin' && !req.body.isActive) {
      return res.status(403).json({ message: 'Cannot deactivate an admin account' });
    }

    user.isActive = req.body.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Toggle user active status (kept for backward compatibility)
router.put('/user/:id/toggle-status', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ isActive: user.isActive, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete user
router.delete('/user/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent deleting admin@netflix.com
    if (user.email === 'admin@netflix.com') {
      return res.status(403).json({ message: 'Cannot delete the main admin account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});



// ==================== BULK IMPORT (CSV) ====================

const csvUpload = multer({ dest: 'uploads/' });


router.post('/movies/bulk-csv', protect, adminOnly, csvUpload.single('file'), async (req, res) => {
  console.log('📂 CSV Upload Request Received');
  if (!req.file) {
    console.error('❌ No file attached');
    return res.status(400).json({ message: 'No file uploaded' });
  }

  console.log('📄 File info:', req.file.path, req.file.mimetype, req.file.size);

  // Sniff delimiter
  let delimiter = ',';
  try {
    const content = req.file.path ? fs.readFileSync(req.file.path, 'utf8') : req.file.buffer.toString('utf8');
    const firstLine = content.split('\n')[0];
    if (firstLine.includes('\t') && firstLine.split('\t').length > firstLine.split(',').length) {
      delimiter = '\t';
    }
  } catch (e) {
    console.log('Delim check failed, defaulting to comma');
  }
  console.log('🕵️ Detected Delimiter:', delimiter === '\t' ? 'TAB' : 'COMMA');

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv({
      mapHeaders: ({ header }) => header.toLowerCase().trim(),
      separator: delimiter
    }))
    .on('headers', (headers) => {
      console.log('📋 Detected CSV Headers:', headers);
    })
    .on('data', (data) => {
      // Robust normalization
      const normalized = {};
      Object.keys(data).forEach(key => {
        // Remove BOM and whitespace
        const cleanKey = key.replace(/^\uFEFF/, '').toLowerCase().trim();
        normalized[cleanKey] = data[key];
      });

      // console.log('📝 Parsed Row:', normalized); // checking row content

      if (normalized.title) {
        results.push(normalized);
      } else {
        // If row is NOT empty but missing title, warn
        if (Object.values(normalized).some(v => v)) {
          console.warn('⚠️ Row missing title (skipped):', normalized);
        }
      }
    })
    .on('end', async () => {
      try {
        console.log(`✅ CSV Parsing complete. Valid rows: ${results.length}`);

        if (results.length === 0) {
          throw new Error('No valid movies found in CSV. Ensure valid "Title" column.');
        }

        let successCount = 0;

        // Debug first row keys
        if (results.length > 0) {
          console.log('🔍 First Row Keys:', Object.keys(results[0]));
          console.log('🔍 First Row Data (Sample):', {
            title: results[0].title,
            cat: results[0].categories || results[0].category,
            sub: results[0].subscription || results[0].accesstype
          });
        }


        for (const row of results) {
          // Build Partial Update Object
          const updateData = {};

          // 1. Text Fields - Only update if provided and not undefined
          if (row.description !== undefined) updateData.description = row.description;
          if (row.poster !== undefined) updateData.poster = row.poster;
          if (row.videourl !== undefined) {
            updateData.videoUrl = row.videourl;
            updateData.videoType = (row.videourl && row.videourl.includes('youtube')) ? 'youtube' : 'direct';
          }
          // Support both Batch and BatchNo
          if (row.batch !== undefined) updateData.batchNo = row.batch;
          else if (row.batchno !== undefined) updateData.batchNo = row.batchno;

          if (row.duration !== undefined) updateData.duration = row.duration;

          // 2. Categories - Update only if column exists
          const catString = row.categories !== undefined ? row.categories : row.category;
          if (catString !== undefined) {
            updateData.category = catString ? catString.split(/[,|]/).map(c => c.trim()) : [];
          }

          // 3. Subscription - Update only if column exists
          const subString = row.subscription !== undefined ? row.subscription : row.accesstype;
          if (subString !== undefined) {
            // If they provide the column, we calculate value. 
            // Logic: "Free" -> false. Anything else (or empty) -> Premium (default)
            updateData.isPremium = !subString.toLowerCase().includes('free');
          }

          if (Object.keys(updateData).length > 0) {
            await Movie.findOneAndUpdate(
              { title: row.title }, // Match by Title
              { $set: updateData },
              { upsert: true, new: true }
            );
            successCount++;
          }
        }

        // Cleanup
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        res.json({ message: `Successfully processed ${successCount} lessons` });

      } catch (error) {
        console.error('❌ Import Error:', error.message);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(400).json({ message: error.message });
      }
    });

});

// ==================== SETTINGS ROUTES ====================

// Get platform settings
router.get('/settings', protect, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        premiumPrice: 20000,
        originalPrice: 25000,
        discountLabel: '20% OFF'
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update platform settings
router.put('/settings', protect, adminOnly, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
