const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

// Define Schema Inline
const OrderSchema = new mongoose.Schema({
  // minimalist schema just to count
}, { strict: false });

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/openstore';

const checkData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB:', MONGODB_URI);

    const orderCount = await Order.countDocuments({});
    console.log(`Orders found in DB: ${orderCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking data:', error);
    process.exit(1);
  }
};

checkData();