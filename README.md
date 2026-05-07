# 🍽️ Restaurant Management System

Complete real-time restaurant management system with AI-powered recommendations, email confirmations, self-service kiosk, kitchen/bar displays, waiter panel with receipt printing, and comprehensive admin dashboard.

## 📋 Features

### ✅ Customer-Facing
- **Self-Service Kiosk** - Table selection, menu browsing, AI-powered recommendations
- **AI Recommendations** - Time-based suggestions (breakfast/lunch/dinner), popular items, smart pairings
- **Online Reservations** - Reserve tables with email confirmations and unique codes
- **Session Codes** - Multi-person ordering with secure 4-digit codes
- **Real-time Updates** - Live order status tracking
- **Smart Suggestions** - Frequently-bought-together items in cart

### ✅ Staff-Facing
- **Kitchen Display** - Food orders only, real-time updates, status management
- **Bar Display** - Drink orders only, separate workflow
- **Waiter Panel** - Session management, order tracking, shift reports, receipt printing
- **Print Receipts** - Thermal printer compatible (80mm), print & close in one action
- **Admin Panel** - Complete CRUD for products/categories/tables, real-time dashboard

### ✅ Core Features
- **Inventory Management** - Auto stock deduction, low stock alerts, manual adjustments
- **Order Cancellation** - With automatic stock refund
- **Table Status** - FREE → RESERVED → OCCUPIED → FREE
- **Session Management** - Multi-order sessions with unique codes
- **Email Confirmations** - Automatic reservation emails with booking details
- **AI-Powered Recommendations** - Rule-based suggestions using SQL aggregations
- **Receipt Printing** - Professional receipts with tax calculations
- **Free Table** - Admin can cancel reservations and free tables
- **Out of Stock** - Real-time stock status in kiosk

---

## 🚀 Tech Stack

**Backend:**
- Node.js + Express
- PostgreSQL database
- Socket.io (real-time updates)
- Nodemailer (email system)

**Frontend:**
- React (via CDN)
- Vanilla JavaScript
- CSS3 Grid & Flexbox

**Database:**
- PostgreSQL 14+
- Tables: menu_items, orders, sessions, inventory, reservations, categories

**Integrations:**
- Gmail SMTP for emails
- Thermal printer support (80mm)

---

## 📦 Installation

### Prerequisites
- Node.js 16+
- PostgreSQL 14+
- Git
- Gmail account (for email features)

### Setup

1. **Clone repository:**
```bash
git clone https://github.com/JORGODERVISHI/Restorant-managment-system.git
cd Restorant-managment-system
```

2. **Install dependencies:**
```bash
npm install
```

3. **Setup database:**
```bash
# Create database
createdb restaurant_db

# Run schema (execute SQL files in order):
psql -d restaurant_db -f database/schema.sql
psql -d restaurant_db -f database/reservations.sql
psql -d restaurant_db -f database/inventory.sql
```

4. **Configure database:**
Edit `server.js` (lines ~10-16):
```javascript
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'restaurant_db',
  password: 'YOUR_PASSWORD',  // ← Change this
  port: 5432,
});
```

5. **Configure email (optional):**
Edit `server.js` (lines ~16-20) for reservation confirmations:
```javascript
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',      // ← Your Gmail
    pass: 'your-app-password'          // ← Gmail App Password (16 chars)
  }
});
```

**Note:** You need a Gmail App Password (not your regular password). [Get one here](https://myaccount.google.com/apppasswords)

6. **Start server:**
```bash
node server.js
```

Server runs at: `http://localhost:3000`

---

## 🖥️ Access Points

| Interface | URL | Purpose |
|-----------|-----|---------|
| **Kiosk** | `/public/kiosk.html` | Customer self-ordering with AI recommendations |
| **Kitchen** | `/public/kitchen.html` | Food order display (real-time) |
| **Bar** | `/public/bar.html` | Drink order display (real-time) |
| **Waiter** | `/public/waiter.js` | Staff panel with print receipts |
| **Admin** | `/public/admin.html` | Complete management dashboard |
| **Reservations** | `/public/reserve.html` | Online table booking with email |

---

## 📊 Database Schema

### Core Tables
- `tables` - Restaurant tables with status (free/reserved/occupied) and capacity
- `menu_items` - Products with pricing and categories
- `categories` - Food/Drink categories with emojis
- `orders` - Customer orders with status tracking
- `order_items` - Order line items with quantities
- `table_sessions` - Session management with unique codes
- `inventory` - Stock levels with movement tracking
- `reservations` - Online bookings with email and confirmation codes

---

## 🎯 Key Workflows

### 1. Walk-in Customer
```
Select FREE table → Browse menu with AI suggestions
  ↓
Add products → See popular items & recommendations
  ↓
Checkout → Session opens
  ↓
Code generated (e.g., 4782) → Table = OCCUPIED
  ↓
Others can join with code
```

### 2. Online Reservation
```
Visit reserve.html → Fill form (name, email, date, time, guests)
  ↓
Submit → Receive confirmation email
  ↓
Code displayed on screen (e.g., 4782)
  ↓
Email arrives with booking details
  ↓
Table = RESERVED (blocked for walk-ins)
  ↓
Customer arrives → Click "Kam Rezervim" → Enter code
  ↓
Table = OCCUPIED → Order normally
```

### 3. Order Flow
```
Kiosk: Customer orders with AI suggestions
  ↓
Backend: Auto stock deduction + Split by category (FOOD vs DRINK)
  ↓
Kitchen Display: Receives FOOD items only
Bar Display: Receives DRINK items only
  ↓
Staff: Mark NEW → COOKING → READY → COMPLETED
  ↓
Waiter: View bill → Print receipt → Close session
  ↓
Table = FREE (available for next customer)
```

### 4. Admin Management
```
Admin Panel → Dashboard (stats, revenue, active sessions)
  ↓
Products: Add/Edit/Delete menu items
Categories: Manage food/drink categories
Tables: View status, Free reserved tables
  ↓
Inventory: Track stock, adjust quantities
Reservations: View bookings, manage status
```

---

## 🤖 AI Features

### Time-Based Recommendations
- **Breakfast** (6 AM - 11 AM): Morning items
- **Lunch** (11 AM - 3 PM): Midday favorites
- **Dinner** (3 PM - 11 PM): Evening specialties

### Popular Items
- Real-time tracking of best sellers
- 🔥 badge on trending products
- Based on daily order volume

### Smart Pairings
- Frequently-bought-together suggestions
- Shown in cart section
- Cross-category recommendations
- Based on historical purchase patterns

### Endpoints
- `GET /ai/popular-items` - Most sold today
- `GET /ai/recommendations` - Time-based picks
- `GET /ai/pairings` - Product combinations
- `GET /ai/upsell/:id` - Higher-tier suggestions

---

## 📧 Email System

### Features
- Automatic reservation confirmations
- Professional HTML template
- Reservation code delivery
- Complete booking details
- Mobile-responsive design

### Email Template Includes
- Large reservation code (36px, monospace)
- Table number and capacity
- Date and time
- Number of guests
- Customer name
- Reminder to arrive early (yellow box)

### Configuration
Uses Gmail SMTP with App Password:
- Service: Gmail
- Auth: App Password (16 characters)
- From: Restaurant <your-email@gmail.com>
- Async sending (non-blocking)

---

## 🖨️ Receipt Printing

### Features
- Thermal printer compatible (80mm width)
- Print & Close in one button
- Auto-print dialog
- Save as PDF option
- Professional layout

### Receipt Includes
- Restaurant name and contact
- Table number
- Date and time
- Session/order code
- All items with quantities
- Unit prices and totals
- Subtotal
- Tax (20% TVSH)
- Grand Total (bold)
- Thank you message

### Technical
- Courier New font (monospace)
- Auto-print on load
- Auto-close after print (3 fallbacks)
- ESC key to close
- Browser print dialog
- Cross-browser compatible

---

## 🔧 Configuration

### Table Status Values
- `free` - Available for walk-in selection
- `reserved` - Booked via reservation system (blocked)
- `occupied` - Active session in progress

### Session Codes
- 4-digit codes (1000-9999)
- Unique per session
- Used for multi-person ordering
- Same code for reservation → session conversion

### Inventory
- Auto stock deduction on order
- Manual adjustments via Admin Panel
- Low stock alerts (configurable threshold)
- Out-of-stock products disabled in Kiosk
- Stock movement tracking

### Email Settings
- Optional for reservations
- Graceful fallback if email fails
- Configurable SMTP settings
- Professional HTML templates

---

## 🛠️ Development

### File Structure
```
Restaurant_Backend/
├── server.js                    # Main backend (1300+ lines)
├── package.json                 # Dependencies
├── package-lock.json            # Locked versions
├── test-db.js                   # Database connection test
├── .gitignore                   # Git ignore rules
├── README.md                    # This file
├── public/
│   ├── kiosk.html              # Customer self-service
│   ├── kitchen.html            # Kitchen display
│   ├── bar.html                # Bar display
│   ├── waiter.html             # Waiter panel
│   ├── admin.html              # Admin dashboard
│   ├── reserve.html            # Online reservations
│   ├── js/
│   │   ├── kiosk.js           # Kiosk + AI features
│   │   ├── kitchen.js         # Kitchen logic
│   │   ├── bar.js             # Bar logic
│   │   ├── waiter.js          # Waiter + print receipts
│   │   ├── admin.js           # Admin CRUD
│   │   └── admin_backend_endpoints.js
│   └── css/
│       ├── kiosk.css          # Kiosk styles
│       ├── kitchen.css        # Kitchen styles
│       ├── bar.css            # Bar styles
│       ├── waiter.css         # Waiter styles
│       └── admin.css          # Admin styles
└── database/
    ├── schema.sql             # Main schema
    ├── reservations.sql       # Reservations table
    └── inventory.sql          # Inventory system
```

### API Endpoints

**Tables:**
- `GET /tables` - All tables with status
- `POST /tables/cleanup` - Free stuck tables
- `POST /admin/tables/:id/free` - Cancel reservations and free table

**Sessions:**
- `POST /sessions/open` - Create new session
- `POST /sessions/verify-code` - Verify session code
- `POST /sessions/:id/close` - Close session
- `GET /sessions/active` - Active sessions with totals
- `GET /sessions/closed/today` - Today's closed sessions
- `GET /sessions/:id/orders` - All orders for session

**Orders:**
- `POST /orders` - Create order (auto stock deduction)
- `GET /orders/:id/items` - Order items with details
- `POST /orders/:id/status` - Update order status
- `POST /orders/:id/cancel` - Cancel with stock refund

**Reservations:**
- `POST /reservations` - Create reservation (sends email)
- `GET /reservations` - List all reservations
- `POST /reservations/verify-code` - Verify reservation code
- `POST /reservations/:id/seat` - Convert to active session
- `POST /reservations/:id/cancel` - Cancel reservation

**Inventory:**
- `GET /inventory` - All stock levels
- `GET /inventory/low-stock` - Items below threshold
- `POST /inventory/adjust` - Manual stock adjustment
- `GET /inventory/movements` - Stock movement history

**Menu:**
- `GET /menu_items` - All products (with stock status)
- `GET /categories` - All categories

**AI Recommendations:**
- `GET /ai/popular-items` - Most sold items today
- `GET /ai/recommendations` - Time-based suggestions
- `GET /ai/pairings` - Frequently bought together
- `GET /ai/upsell/:id` - Higher tier recommendations

**Admin CRUD:**
- `POST /admin/products` - Create/update products
- `POST /admin/categories` - Manage categories
- `POST /admin/tables` - Manage tables

---

## 🐛 Troubleshooting

### Tables Stuck as OCCUPIED
```sql
-- Free all tables without active sessions
UPDATE tables SET status = 'free' 
WHERE id NOT IN (
  SELECT table_id FROM table_sessions WHERE status = 'ACTIVE'
);
```

### Kitchen Showing All Orders
- Kitchen/Bar only listen to Socket.io events
- Don't load all orders on startup
- Verify backend splits FOOD vs DRINK correctly
- Check Socket.io connection in browser console

### Reservation Not Converting
- Verify reservation code is correct (4 digits)
- Check reservation status = 'CONFIRMED'
- Ensure table_id matches available table
- Check that table is not already occupied

### Email Not Sending
- Verify Gmail App Password is correct (16 chars, no spaces)
- Enable 2FA on Gmail account first
- Check SMTP settings in server.js
- Review console logs for email errors
- Test with: `node test-email.js`

### Print Receipt Not Working
- Ensure browser allows pop-ups
- Check printer is connected (for thermal)
- Try "Save as PDF" if printer unavailable
- Verify window.print() is supported
- Check browser console for errors

### AI Recommendations Not Showing
- Verify `/ai/*` endpoints are responding
- Check that menu items have categories
- Ensure orders exist for "popular items"
- Review server.js AI logic
- Check browser console for fetch errors

---

## 🎨 Customization

### Change Restaurant Name
Edit in multiple files:
- `public/reserve.html` - Header
- `public/kiosk.html` - Header
- `server.js` (line ~100) - Email template
- `public/js/waiter.js` - Receipt header

### Modify Tax Rate
Edit `public/js/waiter.js` (line ~18):
```javascript
const tax = subtotal * 0.20;  // ← 20% TVSH (change to your rate)
```

### Add Menu Categories
Via Admin Panel or SQL:
```sql
INSERT INTO categories (name, type, emoji) 
VALUES ('Desserts', 'FOOD', '🍰');
```

### Configure Low Stock Threshold
Edit inventory logic in server.js:
```javascript
const LOW_STOCK_THRESHOLD = 10;  // ← Change threshold
```

---

## 📈 Performance

### Optimizations
- Connection pooling for PostgreSQL
- Async/await patterns throughout
- Socket.IO for real-time updates (no polling)
- Lazy loading of AI recommendations
- Cached popular items queries
- Indexed database tables
- Debounced API calls

### Scalability
- Stateless backend (can run multiple instances)
- PostgreSQL supports high concurrency
- Socket.IO can scale with Redis adapter
- CDN for static assets (React, CSS)

---

## 🔒 Security

### Implemented
- SQL injection protection (parameterized queries)
- CORS configuration
- Input validation on all forms
- Error handling without data leakage
- Session code uniqueness verification
- Stock validation before orders

### Recommendations
- Use environment variables for secrets
- Enable HTTPS in production
- Add rate limiting
- Implement authentication for admin
- Regular database backups
- Sanitize all user inputs

---

## 👥 Credits

Developed as a comprehensive bachelor-level restaurant management system.

**Technologies:**
- Backend: Node.js, Express, PostgreSQL, Socket.IO, Nodemailer
- Frontend: React (CDN), Vanilla JavaScript, CSS3
- Database: PostgreSQL with complex relations
- Real-time: Socket.IO for live updates
- Email: Nodemailer with Gmail SMTP

---

## 📄 License

MIT License - Use freely for educational and commercial purposes.

---

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server console logs
3. Check browser console for frontend errors
4. Verify database connections with `node test-db.js`
5. Test email with test script

---

## 🎯 System Requirements

**Server:**
- CPU: 2+ cores recommended
- RAM: 2GB minimum, 4GB recommended
- Storage: 1GB for application + database
- OS: Windows, macOS, Linux

**Database:**
- PostgreSQL 14 or higher
- 500MB storage for data

**Client (Browser):**
- Modern browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Cookies enabled for sessions
- Pop-ups allowed for receipts

---

## 📞 Production Deployment

### Recommended Setup
1. Use PM2 for process management
2. Nginx as reverse proxy
3. PostgreSQL on separate server
4. SSL certificate (Let's Encrypt)
5. Regular database backups
6. Monitoring (Sentry, LogRocket)

### Environment Variables
Create `.env` file:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_db
DB_USER=postgres
DB_PASS=your_password
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
PORT=3000
```

Then use in `server.js`:
```javascript
require('dotenv').config();
const pool = new Pool({
  host: process.env.DB_HOST,
  // ... etc
});
```

---

**Built with ❤️ for the restaurant industry**
