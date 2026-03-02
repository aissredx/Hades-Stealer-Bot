import mongoose from 'mongoose';
import { MONGO_URI } from '../config';

export async function connectMongo(uri?: string) {
    const u = uri ?? MONGO_URI;
    if (!u) throw new Error('MONGO_URI not provided in config or env');
    try {
        await mongoose.connect(u, {
        } as mongoose.ConnectOptions);
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB bağlantı hatası:', err);
        throw err;
    }
}

export default connectMongo;
