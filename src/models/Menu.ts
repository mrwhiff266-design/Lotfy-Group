import mongoose from 'mongoose';

const MenuItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['page', 'collection', 'product', 'custom'], 
    default: 'custom' 
  },
  value: { type: String }, // URL or ID
});

// Add recursive field properly
MenuItemSchema.add({
  items: [MenuItemSchema]
});

const MenuSchema = new mongoose.Schema({
  handle: { type: String, required: true, unique: true }, // e.g. "main-menu", "footer"
  title: { type: String, required: true },
  items: [MenuItemSchema]
}, { timestamps: true, collection: 'menus' });

export default mongoose.models.Menu || mongoose.model('Menu', MenuSchema);
