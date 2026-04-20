import mongoose from 'mongoose';

const PageSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "Home", "About Us"
  slug: { type: String, required: true, unique: true }, // e.g., "home", "about-us"
  content: { type: String }, // For simple text pages
  
  // HERO SECTION (Banner)
  hero: {
    enabled: { type: Boolean, default: false },
    title: String,
    subtitle: String,
    imageUrl: String,
    buttonText: String,
    buttonLink: String,
  },

  // FEATURED PRODUCTS SECTION
  featuredProducts: {
    enabled: { type: Boolean, default: false },
    title: { type: String, default: "Featured Products" },
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
  },

  // CUSTOM SECTIONS (Advanced: Array of blocks)
  sections: [
    {
      type: { type: String, enum: ['text', 'image', 'products', 'hero'], default: 'text' },
      content: mongoose.Schema.Types.Mixed // Flexible content
    }
  ],

  isPublished: { type: Boolean, default: false },
}, { timestamps: true, collection: 'pages' });

export default mongoose.models.Page || mongoose.model('Page', PageSchema);