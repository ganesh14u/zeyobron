import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from './models/Movie.js';

dotenv.config();

const dummyMovies = [
    {
        title: "AWS Cloud Practitioner Mastery",
        description: "Complete guide to cloud computing with AWS. Learn core services, security, and architecture.",
        poster: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        videoType: "youtube",
        category: ["Big Data Videos", "Cloud Computing"],
        batchNo: "Batch 01",
        isPremium: true,
        featured: true
    },
    {
        title: "Python for Data Science",
        description: "Master NumPy, Pandas, and Matplotlib for data analysis and visualization.",
        poster: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        videoType: "youtube",
        category: ["Big Data Sql Scenarios"],
        batchNo: "Batch 01",
        isPremium: false,
        featured: false
    },
    {
        title: "SQL Performance Tuning",
        description: "Learn how to optimize slow queries and improve database performance indexes.",
        poster: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&q=80",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        videoType: "youtube",
        category: ["Big Data Sql Scenarios", "Gold Videos"],
        batchNo: "Session 45",
        isPremium: true,
        featured: true
    }
];

// Generate 100 dummy movies
const generateDummyData = () => {
    const categories = ["Big Data Videos", "Big Data Sql Scenarios", "Gold Videos", "Azure Mastery", "Spark Optimization"];
    const batches = ["Batch 2024", "Session A", "Session B", "Morning Batch"];
    const data = [];

    for (let i = 1; i <= 100; i++) {
        const isPremium = Math.random() > 0.5;
        const isFeatured = Math.random() > 0.7;
        const catCount = Math.floor(Math.random() * 2) + 1;
        const selCats = [];
        for (let j = 0; j < catCount; j++) {
            selCats.push(categories[Math.floor(Math.random() * categories.length)]);
        }

        data.push({
            title: `Lesson ${i}: Advanced Technical Masterclass`,
            description: `In-depth technical session on module ${i}. This covers architectural patterns and implementation details for high-scale systems.`,
            poster: `https://picsum.photos/seed/${i + 123}/800/450`,
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            videoType: "youtube",
            category: [...new Set(selCats)],
            batchNo: batches[Math.floor(Math.random() * batches.length)],
            isPremium,
            featured: isFeatured
        });
    }
    return data;
};

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Optionally clear existing
        // await Movie.deleteMany({});
        // console.log('Cleared existing movies');

        const movies = generateDummyData();
        await Movie.insertMany(movies);
        console.log('Successfully seeded 100 dummy movies!');

        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seed();
