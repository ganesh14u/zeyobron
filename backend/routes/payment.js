import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import User from "../models/User.js";
import Settings from "../models/Settings.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Initialize Razorpay
// These should be in .env in production
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

// @desc    Create Razorpay Order
// @route   POST /api/payment/order
// @access  Private
router.post("/order", protect, async (req, res) => {
    try {
        const { type, categories } = req.body;
        const settings = await Settings.findOne() || { premiumPrice: 20000, goldCategoryPrice: 1000 };

        let amount = settings.premiumPrice;
        let notes = { type: 'premium' };

        if (type === 'gold' && Array.isArray(categories)) {
            const Category = (await import("../models/Category.js")).default;
            const chosenCats = await Category.find({ name: { $in: categories } });

            // Sum up specific prices from each category
            amount = chosenCats.reduce((sum, cat) => sum + (cat.price || settings.goldCategoryPrice || 1000), 0);

            notes = {
                type: 'gold',
                categories: categories.join(',')
            };
        }

        const options = {
            amount: amount * 100, // Amount in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: notes
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error("Order Creation Error:", error);
        res.status(500).json({ message: "Failed to create order" });
    }
});

// @desc    Verify Payment and Upgrade User
// @route   POST /api/payment/verify
// @access  Private
router.post("/verify", protect, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Verify Signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder')
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Payment Successful - Upgrade User
            // Fetch order from razorpay to get the chosen upgrade type/categories
            const orderObj = await razorpay.orders.fetch(razorpay_order_id);
            const { type, categories: catString } = orderObj.notes || {};

            const user = await User.findById(req.user._id);

            if (type === 'gold' && catString) {
                const newCategories = catString.split(',');
                // Add unique new categories to the user's list
                const current = user.subscribedCategories || [];
                user.subscribedCategories = [...new Set([...current, ...newCategories])];

                // If user is free, upgrade them to 'gold' status
                if (user.subscription === 'free') {
                    user.subscription = 'gold';
                }
            } else {
                // Default to Premium
                user.subscription = 'premium';
                // Auto-grant access to all current modules
                try {
                    const Category = (await import("../models/Category.js")).default;
                    const allCategories = await Category.find({});
                    const categoryNames = allCategories.map(c => c.name);
                    user.subscribedCategories = categoryNames;
                } catch (catErr) {
                    console.error("Failed to fetch categories during upgrade:", catErr);
                }
            }

            await user.save();

            // Log the payment
            try {
                const Payment = (await import("../models/Payment.js")).default;
                await Payment.create({
                    user: user._id,
                    orderId: razorpay_order_id,
                    paymentId: razorpay_payment_id,
                    amount: orderObj.amount / 100, // razorpay returns amount in paise
                    status: 'captured'
                });
            } catch (payErr) {
                console.error("Failed to log payment:", payErr);
            }

            res.json({
                success: true,
                message: type === 'gold' ? "Payment verified! Your selected modules are now unlocked." : "Payment verified and account upgraded to Premium Elite!"
            });
        } else {
            res.status(400).json({ message: "Invalid payment signature" });
        }
    } catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(500).json({ message: "Verification failed" });
    }
});

export default router;
