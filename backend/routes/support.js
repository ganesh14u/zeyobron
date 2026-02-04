import express from 'express';
import Support from '../models/Support.js';
import { protect, adminOnly } from '../middleware/auth.js';

import multer from 'multer';
import path from 'path';

const router = express.Router();

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only images (JPEG, JPG, PNG, WEBP) are allowed'));
    }
});

// Permanent deletion of tickets closed or resolved for more than 24 hours
setInterval(async () => {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const result = await Support.deleteMany({
            status: { $in: ['closed', 'resolved'] },
            closedAt: { $lt: twentyFourHoursAgo }
        });
        if (result.deletedCount > 0) {
            console.log(`[Support Cleanup] Permanently deleted ${result.deletedCount} closed/resolved tickets.`);
        }
    } catch (err) {
        console.error('[Support Cleanup Error]', err);
    }
}, 60 * 60 * 1000); // Run every hour

// @desc    Upload an image for support
// @route   POST /api/support/upload
// @access  Private
router.post('/upload', protect, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url });
});

// @desc    Submit a support request
// @route   POST /api/support
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { type, subject, message } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ message: 'Subject and message are required' });
        }

        const supportRequest = await Support.create({
            user: req.user._id,
            type: type || 'problem',
            subject,
            message,
            messages: [{
                sender: req.user._id,
                role: 'user',
                content: message,
                attachments: req.body.attachments || []
            }]
        });

        res.status(201).json({
            success: true,
            message: 'Support request submitted successfully. We will review it soon!',
            data: supportRequest
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get user's own support requests
// @route   GET /api/support/me
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const requests = await Support.find({ user: req.user._id })
            .populate('messages.sender', 'name email')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all support requests (Admin Only)
// @route   GET /api/support/admin
// @access  Private/Admin
router.get('/admin', protect, adminOnly, async (req, res) => {
    try {
        const requests = await Support.find()
            .populate('user', 'name email')
            .populate('messages.sender', 'name email')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add a message to a ticket
// @route   POST /api/support/:id/message
// @access  Private
router.post('/:id/message', protect, async (req, res) => {
    try {
        const { content, attachments } = req.body;
        const ticket = await Support.findById(req.params.id);

        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        // Check permissions: must be owner or admin
        if (ticket.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (ticket.status === 'closed') {
            return res.status(400).json({ message: 'Cannot message a closed ticket' });
        }

        const newMessage = {
            sender: req.user._id,
            role: req.user.role === 'admin' ? 'admin' : 'user',
            content,
            attachments: attachments || []
        };

        ticket.messages.push(newMessage);

        // Auto-update status to 'reviewed' if admin replies
        if (req.user.role === 'admin' && ticket.status === 'pending') {
            ticket.status = 'reviewed';
        }

        await ticket.save();

        const updatedTicket = await Support.findById(req.params.id)
            .populate('user', 'name email')
            .populate('messages.sender', 'name email');

        res.json({ success: true, data: updatedTicket });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Close a ticket
// @route   PUT /api/support/:id/close
// @access  Private
router.put('/:id/close', protect, async (req, res) => {
    try {
        const ticket = await Support.findById(req.params.id);

        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        // Check permissions: must be owner or admin
        if (ticket.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        ticket.status = 'closed';
        ticket.closedAt = new Date();
        await ticket.save();

        res.json({ success: true, message: 'Ticket closed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Reopen a ticket
// @route   PUT /api/support/:id/reopen
// @access  Private
router.put('/:id/reopen', protect, async (req, res) => {
    try {
        const ticket = await Support.findById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        if (ticket.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        ticket.status = 'reopened';
        ticket.closedAt = null; // Clear closure time
        await ticket.save();

        res.json({ success: true, message: 'Ticket reopened successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update support request status (Admin Only)
// @route   PUT /api/support/admin/:id
// @access  Private/Admin
router.put('/admin/:id', protect, adminOnly, async (req, res) => {
    try {
        const { status } = req.body;
        const updateData = { status };

        // If ticket is being closed or resolved, set the timestamp
        if (['closed', 'resolved'].includes(status)) {
            updateData.closedAt = new Date();
        } else {
            // If ticket is moved to another status, clear the closure timestamp
            updateData.closedAt = null;
        }

        const request = await Support.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!request) {
            return res.status(404).json({ message: 'Support request not found' });
        }

        res.json({ success: true, message: 'Status updated', data: request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
