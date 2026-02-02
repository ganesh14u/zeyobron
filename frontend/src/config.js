const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_URL = isLocal
    ? 'http://localhost:3001/api'
    : (import.meta.env.VITE_API_URL || 'https://royalhills-3q0i.onrender.com/api');

export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'your_razorpay_key_id';
