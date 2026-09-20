#  Restaurant Management System

Complete real-time restaurant management platform with AI recommendations, email reservations, self-service kiosk, kitchen/bar displays, waiter receipts, and admin dashboard.

---

## ✨ Features

### 👥 Customer Features
- **Self-Service Kiosk** - Browse menu, AI-powered recommendations, add items to cart
- **Online Reservations** - Book tables with instant email confirmations and unique codes
- **Table Selection** - Choose table, view capacity, check availability
- **Real-time Status** - Track order status from kitchen to delivery
- **Session Codes** - Multi-person ordering with secure 4-digit codes

### 👨‍💼 Staff Features
- **Kitchen Display** - Food orders only with status management
- **Bar Display** - Drink orders only, separate workflow
- **Waiter Panel** - Session management, order tracking, print receipts
- **Admin Dashboard** - Complete CRUD management, real-time statistics
- **Inventory Management** - Auto stock deduction, low stock alerts, manual adjustments

### 🤖 AI Features
- **Time-based Recommendations** - Breakfast/lunch/dinner suggestions
- **Popular Items** - Real-time trending products
- **Smart Pairings** - Frequently bought together items

---

## 🖥️ System Modules

### **1. Kiosk** (`/public/kiosk.html`)
Customer self-ordering interface with AI recommendations, menu browsing by category, and smart cart suggestions. Real-time stock status prevents ordering out-of-stock items.

### **2. Kitchen Display** (`/public/kitchen.html`)
Real-time food orders only. Staff mark items NEW → COOKING → READY. Simple, distraction-free interface optimized for speed.

### **3. Bar Display** (`/public/bar.html`)
Real-time drink orders only. Separate workflow from kitchen. Same workflow: NEW → COOKING → READY.

### **4. Waiter Panel** (`/public/waiter.html`)
Staff view active sessions, manage orders, close sessions with print receipt. Receipt includes itemization, tax calculation, and total. Print & Close in one action.

### **5. Reservations** (`/public/reserve.html`)
Online booking system with email confirmations. Generates unique reservation code, sends professional HTML email with booking details.

### **6. Admin Panel** (`/public/admin.html`)
Complete management dashboard:
- **Dashboard** - Real-time stats (sales, orders, active sessions, low stock)
- **Inventory** - View/adjust stock, track movements
- **Menu** - Add/edit/delete products and categories
- **Tables** - Manage table capacity and status
- **Reports** - Daily/Weekly/Monthly/Yearly analytics
- **User Management** - Add/delete staff accounts (admin/waiter/kitchen/bar)
- **Settings** - QR code management, backups, system settings

---

## 🚀 Quick Start

### Installation
```bash
# Clone and setup
git clone https://github.com/JORGODERVISHI/Restorant-managment-system.git
cd Restorant-managment-system

# Install dependencies
npm install

# Update database credentials in server.js
# Then start server
node server.js
```

Server runs at: `http://localhost:3000`

---

## 🔐 Authentication & Login

### Access Point
Go to: `http://localhost:3000/public/login.html`

### Available Roles

| Role | Username | Password | Access |
|------|----------|----------|--------|
| **Admin** | admin | 'admin123' for example | Full system: dashboard, reports, user management, settings |
| **Waiter** | waiter | ********* | Session management, order tracking, receipt printing |
| **Kitchen** | kitchen |********* | Food orders display, status management |
| **Bar** | bar | ********* | Drink orders display, status management |

### How Login Works

1. **Enter Credentials** - Username and password on login page
2. **Server Validation** - Credentials checked against database
3. **Session Created** - 24-hour session established on server
4. **Redirect by Role** - Automatically sent to role-specific dashboard
5. **Access Granted** - Can now use all features for that role

### User Management

Admin can manage staff accounts via **Settings → User Management**:
-  **Add User** - Create new staff account with role assignment
-  **Edit User** - Modify user details (coming soon)
-  **Delete User** - Remove staff accounts
- View all users in the system

### Session Management

- **Session Duration** - 24 hours from login
- **Auto Logout** - Session expires after inactivity
- **Manual Logout** - Click Logout button anytime
- **Multiple Sessions** - Each staff member can login independently
- **Session Codes** - Tables get unique 4-digit codes for multi-person ordering

---

## 📊 Key Workflows

**Walk-in Customer:**
```
Select FREE table → Browse with AI suggestions → Add items → Checkout
→ Session code generated → Others can join with code
```

**Online Reservation:**
```
Fill reservation form → Email confirmation sent → Customer arrives
→ Enter code → Table becomes active for ordering
```

**Order Processing:**
```
Kiosk: Customer orders with AI recommendations
→ Backend: Auto stock deduction + category split (FOOD/DRINK)
→ Kitchen Display: Receives FOOD items
→ Bar Display: Receives DRINK items
→ Staff: Mark status → Waiter: Print receipt → Close session
```

---

##  Technology Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL 14+
- **Real-time**: Socket.IO for live updates
- **Frontend**: React (CDN) + Vanilla JavaScript
- **Email**: Nodemailer (Gmail SMTP)
- **API Endpoints**: 40+ RESTful endpoints with real-time events

---

## 📧 Email Notifications

Automatic reservation confirmations sent to customer email with:
- Reservation code (large, easy-to-read format)
- Table number and capacity
- Date, time, party size
- Mobile-responsive HTML template
- Reminder to arrive early

---

## 🖨️ Receipt Printing

Thermal printer compatible (80mm) receipts include:
- Restaurant name and date
- Table number and session code
- All items with quantities and prices
- Subtotal, tax (20%), and total
- Professional formatting optimized for printing

---

## 📈 Reports & Analytics

- **Daily Report** - Today's sales, orders, sessions
- **Weekly Report** - 7-day trends and comparison
- **Monthly Report** - Month-over-month analytics with top products
- **Yearly Report** - Annual revenue and performance metrics
- **Real-time Dashboard** - Active orders, sessions, revenue, top products

---

##  Database

**Core Tables:**
- `tables` - Restaurant seating with status and capacity
- `menu_items` - Products with pricing and availability
- `orders` - Customer orders with status tracking
- `table_sessions` - Session management with unique codes
- `inventory` - Stock levels with movement tracking
- `reservations` - Online bookings with confirmation codes
- `users` - Staff accounts with role-based access

---

## 🔐 Security Features

- SQL injection protection (parameterized queries)
- CORS configuration for cross-origin requests
- Input validation on all forms
- Session-based authentication
- Role-based access control (admin/waiter/kitchen/bar)
- Stock validation before orders
- Unique session code verification

---

## ⚡ Performance

- Real-time updates via Socket.IO (no polling)
- Connection pooling for database efficiency
- Async/await patterns throughout
- Lazy-loaded recommendations
- Indexed database queries
- Stateless backend (scalable)

---

## 📋 API Endpoints

**Core Operations:**
- `POST /orders` - Create order with auto stock deduction
- `POST /sessions/open` - Start new table session
- `POST /sessions/:id/close` - Close session with total calculation
- `POST /reservations` - Create reservation and send email
- `POST /reservations/:id/seat` - Convert reservation to active session

**Data Retrieval:**
- `GET /menu_items` - All products with stock status
- `GET /tables` - All tables with current status
- `GET /sessions/active` - Active sessions with totals
- `GET /inventory` - Current stock levels
- `GET /admin/reports/*` - Daily/weekly/monthly/yearly analytics

**Admin Management:**
- `POST /admin/products` - Add/update products
- `POST /admin/categories` - Manage categories
- `POST /admin/users` - Add/delete staff accounts
- `POST /admin/tables/:id/free` - Cancel reservations and free tables

**AI Recommendations:**
- `GET /ai/popular-items` - Best sellers today
- `GET /ai/recommendations` - Time-based suggestions
- `GET /ai/pairings` - Frequently bought together

---

## 📁 Project Structure

```
Restaurant_Backend/
├── server.js                 # Main backend (Node.js + Express)
├── package.json              # Dependencies
├── public/
│   ├── kiosk.html           # Customer kiosk
│   ├── kitchen.html         # Kitchen display
│   ├── bar.html             # Bar display
│   ├── waiter.html          # Waiter panel
│   ├── admin.html           # Admin dashboard
│   ├── reserve.html         # Reservations
│   └── js/                  # Frontend logic files
└── database/                # SQL schema files
```

---

## 🎯 System Capabilities

✅ **40+ API Endpoints** - Full CRUD operations  
✅ **Real-time Updates** - Socket.IO for live data  
✅ **Email Integration** - Automatic confirmations  
✅ **AI Recommendations** - Smart suggestions  
✅ **Multi-user Support** - 4 staff roles  
✅ **Inventory Tracking** - Auto stock management  
✅ **Receipt Printing** - Thermal printer compatible  
✅ **Analytics** - Daily/weekly/monthly/yearly reports  
✅ **Backup System** - Manual and automatic backups  
✅ **QR Code Management** - Generate and print codes  

---

## 🚀 Production Ready

The system is fully functional and production-ready with:
- Complete authentication system
- Comprehensive error handling
- Real-time data synchronization
- Email notification system
- Backup and recovery functionality
- Performance optimized queries

---

## 📄 License

MIT License - Free to use for educational and commercial purposes.

---

## 📊 Git History

Latest commits include:
- ✅ Authentication system (login, role-based access)
- ✅ Admin Dashboard (statistics, reports, management)
- ✅ Waiter Panel (session management, receipts)
- ✅ Kitchen/Bar Display (real-time updates)
- ✅ Kiosk (AI recommendations, reservations)
- ✅ User Management (add/delete staff)
- ✅ Inventory Management (stock tracking)
- ✅ Email Notifications (reservations)
- ✅ Database Backups (manual + automatic)

**Version:** 1.0  
**Status:** Complete & Tested  
**Last Updated:** May 2026

---

**Built with ❤️ for modern restaurants**
