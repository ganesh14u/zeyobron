import mongoose from 'mongoose';

const supportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['problem', 'suggestion', 'other'],
        default: 'problem'
    },
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved', 'closed', 'reopened'],
        default: 'pending'
    },
    closedAt: {
        type: Date,
        default: null
    },
    messages: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        attachments: [String], // Array of image URLs
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Support', supportSchema);
