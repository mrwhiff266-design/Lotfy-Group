const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const ProductSchema = new mongoose.Schema({
  name: String,
  collection: String,
  isVisible: Boolean
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-ecommerce');
  
  console.log("Connected. Checking products...");
  const products = await Product.find({}, 'name collection');
  
  console.log("--- PRODUCTS DUMP ---");
  console.log(JSON.stringify(products, null, 2));
  console.log("---------------------");
  
  const target = "LG Bill Counter";
  const match = await Product.find({ collection: target });
  console.log(`Query for collection='${target}' found: ${match.length} items`);
  
  process.exit();
}

check();
