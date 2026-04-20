# Frontend Setup - Page Builder & Navigation

## ✅ What's Been Set Up

### 1. Database Connection
- MongoDB is running and connected
- Collections: pages, menus, products, orders, customers, collections
- Test with: `node scripts/test-db.js`

### 2. Customer-Facing Pages
- **Home page**: `/` - Shows published "home" page or setup instructions
- **Dynamic pages**: `/[slug]` - Renders any published page by its slug
- **404 page**: Shows when page doesn't exist

### 3. Navigation System
- **Frontend Navbar**: `src/components/frontend/Navbar.tsx`
  - Responsive (desktop + mobile)
  - Supports dropdowns for sub-menus
  - Fetches menu from database

### 4. Page Rendering
- **PageRenderer**: `src/components/frontend/PageRenderer.tsx`
  - Renders Craft.js builder content on frontend
  - Uses same components as admin builder

### 5. Preview Route
- **Preview**: `/preview?id=<pageId>` - Preview pages before publishing

## 🚀 How to Use

### Step 1: Start the Dev Server
```bash
npm run dev
```

### Step 2: Create Your Home Page
1. Go to: `http://localhost:3000/admin/pages`
2. Click "Add Page"
3. Set **slug** to: `home` (important!)
4. Set **title** to: "Home"
5. Click "Create"
6. Click the page to open the builder
7. Design your page with drag-and-drop
8. Click **"Publish Live"**

### Step 3: Create Navigation Menu
1. Go to: `http://localhost:3000/admin/navigation`
2. Click "Add Menu"
3. Enter title: "Main Menu"
4. Handle will auto-generate as `main-menu` (important!)
5. Click "Add"
6. Click "Edit" to add menu items
7. Add items like:
   - Home (type: page, value: home)
   - About (type: page, value: about)
   - Products (type: custom, value: /products)

### Step 4: View Your Store
- Home: `http://localhost:3000/`
- Other pages: `http://localhost:3000/[slug]`

## 📁 New Files Created

```
src/
├── app/
│   ├── [slug]/
│   │   └── page.tsx          # Dynamic page route
│   ├── preview/
│   │   └── page.tsx          # Preview route
│   ├── page.tsx              # Updated home page
│   └── not-found.tsx         # 404 page
├── components/
│   └── frontend/
│       ├── Navbar.tsx        # Navigation component
│       └── PageRenderer.tsx  # Page content renderer
├── api/
│   └── public/
│       └── navigation/
│           └── route.ts      # Public menu API
scripts/
└── test-db.js                # Database test script
```

## 🎨 Builder Components Available

All your builder components work on the frontend:
- Hero Banner
- Product Slider
- Featured Grid
- Selected Products
- Collection List
- Image + Text
- Box/Container
- Multi-Column
- Text
- Button
- Image

## 🔧 Testing

1. **Test database**: `node scripts/test-db.js`
2. **Start dev**: `npm run dev`
3. **View home**: `http://localhost:3000/`
4. **Admin panel**: `http://localhost:3000/admin`

## ⚠️ Important Notes

- Page **slug must be "home"** for the home page to work
- Menu **handle must be "main-menu"** for navigation to appear
- Pages must be **published** to show on frontend
- Preview works for unpublished pages
