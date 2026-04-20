import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lotfy-group-db';

let cached = (global as any).mongoose || { conn: null, promise: null };

export default async function connectDB() {
  if (cached.conn) return cached.conn;

  // Extract database name from URI
  const dbName = MONGODB_URI.includes('/') ? MONGODB_URI.split('/').pop() : 'lotfy-group-db';

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: dbName,
      bufferCommands: false,
    }).then((m) => {
      console.log(`✅ Database Connected: ${dbName}`);
      return m;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}