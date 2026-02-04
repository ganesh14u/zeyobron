import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    premiumPrice: {
        type: Number,
        required: true,
        default: 20000
    },
    originalPrice: {
        type: Number,
        required: true,
        default: 25000
    },
    discountLabel: {
        type: String,
        default: '20% OFF'
    },
    goldCategoryPrice: {
        type: Number,
        required: true,
        default: 1000
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
