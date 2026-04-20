const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-ecommerce';

const checkDatabases = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`Connected to: ${conn.connection.name}`);

    // List all collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('Collections in this DB:');
    collections.forEach(col => console.log(` - ${col.name}`));

    // Count documents in key collections
    const productsCount = await conn.connection.db.collection('products').countDocuments();
    const ordersCount = await conn.connection.db.collection('orders').countDocuments();
    
    console.log(`\nCOUNTS:`);
    console.log(`Products: ${productsCount}`);
    console.log(`Orders: ${ordersCount}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkDatabases();