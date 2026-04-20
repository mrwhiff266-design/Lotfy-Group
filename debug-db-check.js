const mongoose = require('mongoose');

// Define minimal schema
const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function check() {
  // Check the 'openstore' DB
  await mongoose.connect('mongodb://localhost:27017/openstore');
  
  const count = await Product.countDocuments();
  console.log(`Products in 'openstore' DB: ${count}`);
  
  process.exit();
}

check();
