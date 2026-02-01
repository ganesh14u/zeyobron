import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  poster: String, // URL
  videoUrl: String, // YouTube URL or direct video URL
  videoType: { type: String, enum: ['youtube', 'direct'], default: 'direct' },
  category: [String],
  batchNo: String,
  duration: String,
  featured: { type: Boolean, default: false },
  isPremium: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// ✅ Optimized indexes
movieSchema.index({ featured: 1 });
movieSchema.index({ category: 1 });
movieSchema.index({ createdAt: -1 });

export default mongoose.model('Movie', movieSchema);
