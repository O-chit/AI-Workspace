import mongoose from 'mongoose';
import { env } from './env.js';
export async function connectDB() {
    try {
        const conn = await mongoose.connect(env.MONGODB_URI, {
            autoIndex: true,
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
    }
    catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}
mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
});
mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection runtime error:', err);
});
