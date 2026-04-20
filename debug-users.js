const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

// Define minimal schema to read users
const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function checkUsers() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-ecommerce');
  
  const users = await User.find({});
  console.log(`Found ${users.length} Admin Users.`);
  users.forEach(u => console.log(`- ${u.email}`));
  
  process.exit();
}

checkUsers();
