import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  thumbnail: String,
  isPremium: { type: Boolean, default: false },
  price: { type: Number, default: 1000 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Category', categorySchema);
