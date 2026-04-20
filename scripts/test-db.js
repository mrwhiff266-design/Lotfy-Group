/**
 * Database Connection Test Script
 * Run with: node scripts/test-db.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-ecommerce';

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  console.log(`URI: ${MONGODB_URI}\n`);

  try {
    // Connect
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
    console.log('✅ Connected successfully!\n');

    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📦 Collections in database:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    console.log('');

    // Count documents in each collection
    const collectionsToCheck = ['pages', 'menus', 'products', 'orders', 'customers', 'collections'];
    
    for (const collectionName of collectionsToCheck) {
      try {
        const collection = mongoose.connection.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`📊 ${collectionName}: ${count} documents`);
      } catch (err) {
        console.log(`📊 ${collectionName}: Collection not found`);
      }
    }

    console.log('\n✅ All tests passed! Database is working correctly.\n');
    console.log('💡 Next steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Go to: http://localhost:3000/admin');
    console.log('   3. Create a page with slug "home" and design it!');
    console.log('   4. Create a menu with handle "main-menu" for navigation\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Tips:');
    console.error('   1. Make sure MongoDB is running (run: net start MongoDB)');
    console.error('   2. Check your MONGODB_URI in .env.local');
    console.error('   3. MongoDB should be running on localhost:27017\n');
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

testConnection();
