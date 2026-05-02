# 🍽️ Restaurant Management System

Complete restaurant management system with Kiosk ordering, Kitchen/Bar displays, Waiter panel, and online reservations.

## 📋 Features

### ✅ Customer-Facing
- **Self-Service Kiosk** - Table selection, menu browsing, ordering
- **Online Reservations** - Reserve tables with confirmation codes
- **Session Codes** - Multi-person ordering with secure codes
- **Real-time Updates** - Live order status

### ✅ Staff-Facing
- **Kitchen Display** - Food orders only, real-time updates
- **Bar Display** - Drink orders only, separate workflow
- **Waiter Panel** - Session management, order tracking, shift reports
- **Admin Panel** - Inventory, dashboard, analytics (in progress)

### ✅ Core Features
- **Inventory Management** - Auto stock deduction, low stock alerts
- **Order Cancellation** - With automatic stock refund
- **Table Status** - FREE → RESERVED → OCCUPIED → FREE
- **Session Management** - Multi-order sessions with unique codes
- **Out of Stock** - Real-time stock status in kiosk

---

## 🚀 Tech Stack

**Backend:**
- Node.js + Express
- PostgreSQL database
- Socket.io (real-time)

**Frontend:**
- React (via CDN)
- Vanilla JavaScript
- CSS3

**Database:**
- PostgreSQL 14+
- Tables: menu_items, orders, sessions, inventory, reservations

---

## 📦 Installation

### Prerequisites
- Node.js 16+
- PostgreSQL 14+
- Git

### Setup

1. **Clone repository:**
```bash
git clone https://github.com/YOUR_USERNAME/restaurant-system.git
cd restaurant-system/Restaurant_Backend
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
Edit `server.js` line 10-16:
```javascript
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'restaurant_db',
  password: 'YOUR_PASSWORD',  // ← Change this
  port: 5432,
});
```

5. **Start server:**
```bash
node server.js
```

Server runs at: `http://localhost:3000`

---

## 🖥️ Access Points

| Interface | URL | Purpose |
|-----------|-----|---------|
| **Kiosk** | `/public/kiosk.html` | Customer self-ordering |
| **Kitchen** | `/public/kitchen.html` | Food order display |
| **Bar** | `/public/bar.html` | Drink order display |
| **Waiter** | `/public/waiter-COMPLETE.html` | Staff order management |
| **Admin** | `/public/admin.html` | Management dashboard |
| **Reservations** | `/public/reserve.html` | Online table booking |

---

## 📊 Database Schema

### Core Tables
- `tables` - Restaurant tables with status
- `menu_items` - Products with pricing
- `categories` - Food/Drink categories
- `orders` - Customer orders
- `order_items` - Order line items
- `table_sessions` - Session management with codes
- `inventory` - Stock levels
- `reservations` - Online bookings

---

## 🎯 Key Workflows

### 1. Walk-in Customer
```
Select FREE table → Add products → Checkout
  ↓
Session opens → Code generated (e.g., 4782)
  ↓
Table = OCCUPIED → Other customers need code to add to order
```

### 2. Online Reservation
```
Visit reserve.html → Fill form → Submit
  ↓
Code displayed on screen (e.g., 4782)
  ↓
Table = RESERVED (cannot be selected by walk-ins)
  ↓
Customer arrives → Click "Kam Rezervim" → Enter code
  ↓
Table = OCCUPIED → Order normally
```

### 3. Order Flow
```
Kiosk: Customer orders
  ↓
Backend: Split by category (FOOD vs DRINK)
  ↓
Kitchen: Receives FOOD items only
Bar: Receives DRINK items only
  ↓
Staff: Mark COOKING → READY → COMPLETED
  ↓
Waiter: Close session & table = FREE
```

---

## 🔧 Configuration

### Table Status Values
- `free` - Available for selection
- `reserved` - Booked via reservation system
- `occupied` - Active session in progress

### Session Codes
- 4-digit codes (1000-9999)
- Unique per session
- Used for multi-person ordering
- Same code used for reservation → session conversion

### Inventory
- Auto stock deduction on order
- Manual adjustments via Admin Panel
- Low stock alerts
- Out-of-stock products disabled in Kiosk

---

## 🛠️ Development

### File Structure
```
Restaurant_Backend/
├── server.js           # Main backend
├── package.json        # Dependencies
├── public/
│   ├── kiosk.html     # Customer interface
│   ├── kitchen.html   # Kitchen display
│   ├── bar.html       # Bar display
│   ├── waiter-COMPLETE.html
│   ├── admin.html
│   ├── reserve.html   # Reservations
│   ├── js/
│   │   ├── kiosk.js
│   │   ├── kitchen.js
│   │   ├── bar.js
│   │   ├── waiter-ULTIMATE.js
│   │   └── admin.js
│   └── css/
│       ├── kiosk.css
│       ├── waiter-COMPLETE.css
│       └── admin.css
└── database/
    ├── schema.sql
    ├── reservations.sql
    └── inventory.sql
```

### API Endpoints

**Tables:**
- GET `/tables` - All tables
- POST `/tables/cleanup` - Free stuck tables

**Sessions:**
- POST `/sessions/open` - Create session
- POST `/sessions/verify-code` - Verify session code
- POST `/sessions/:id/close` - Close session
- GET `/sessions/active` - Active sessions
- GET `/sessions/closed/today` - Today's closed sessions

**Orders:**
- POST `/orders` - Create order (auto stock deduction)
- GET `/orders/:id/items` - Order items
- POST `/orders/:id/status` - Update status
- POST `/orders/:id/cancel` - Cancel with stock refund

**Reservations:**
- POST `/reservations` - Create reservation
- GET `/reservations` - List reservations
- POST `/reservations/verify-code` - Verify code
- POST `/reservations/:id/seat` - Convert to session
- POST `/reservations/:id/cancel` - Cancel reservation

**Inventory:**
- GET `/inventory` - All stock levels
- GET `/inventory/low-stock` - Low stock items
- POST `/inventory/adjust` - Manual adjustment
- GET `/inventory/movements` - Stock history

**Menu:**
- GET `/menu_items` - All products (with stock status)
- GET `/categories` - All categories

---

## 🐛 Troubleshooting

**Tables stuck as OCCUPIED:**
```sql
-- Free all tables without active sessions
UPDATE tables SET status = 'free' 
WHERE id NOT IN (
  SELECT table_id FROM table_sessions WHERE status = 'ACTIVE'
);
```

**Kitchen showing all orders:**
- Kitchen/Bar only listen to Socket.io events
- Don't load all orders on startup
- Check that backend splits FOOD vs DRINK correctly

**Reservation not converting:**
- Verify reservation code is correct
- Check reservation status = 'CONFIRMED'
- Check table_id matches

---

## 📝 TODO

- [ ] Complete Admin Panel (Menu CRUD, Reports, Settings)
- [ ] SMS/Email integration for reservations
- [ ] QR Code for reservations
- [ ] Receipt printing
- [ ] Payment integration
- [ ] Multi-language support
- [ ] Analytics dashboard

---

## 👥 Credits

Developed for bachelor-level restaurant management system.

---

## 📄 License

MIT License - Use freely for educational and commercial purposes.
