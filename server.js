const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const nodemailer = require("nodemailer");
const session = require('express-session');
const bcrypt = require('bcrypt');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');


const app = express();
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use(session({
  secret: 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
  secure: false,
  maxAge: 24 * 60 * 60 * 1000,
  sameSite: 'lax'
}
}));

// ═══════════════════════════════════════════════════════════
// AUTHENTICATION MIDDLEWARE
// ═══════════════════════════════════════════════════════════

const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    next();
  };
};

// 📧 EMAIL CONFIGURATION
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jorgosdervishi@gmail.com',
    pass: 'PASTE-APP-PASSWORD-HERE'
  }
});

// Email template function
function getReservationEmailHTML(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #2563eb; color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px 20px; }
    .code-box { background: #f0f7ff; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .code { font-size: 36px; font-weight: bold; color: #2563eb; letter-spacing: 8px; font-family: 'Courier New', monospace; }
    .details { background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .details-row:last-child { border-bottom: none; }
    .label { font-weight: 600; color: #6b7280; }
    .value { color: #1f2937; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
    .note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>✓ Rezervimi u Konfirmua</h1></div>
    <div class="content">
      <p>Përshëndetje <strong>${data.customer_name}</strong>,</p>
      <p>Rezervimi juaj është konfirmuar me sukses!</p>
      <div class="code-box">
        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">KODI I REZERVIMIT</p>
        <div class="code">${data.reservation_code}</div>
        <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">Mbajeni këtë kod për të hyrë në tavolinë</p>
      </div>
      <div class="details">
        <div class="details-row"><span class="label">Tavolina:</span><span class="value">Tavolina ${data.table_number}</span></div>
        <div class="details-row"><span class="label">Data:</span><span class="value">${new Date(data.reservation_date).toLocaleDateString('sq-AL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
        <div class="details-row"><span class="label">Ora:</span><span class="value">${data.reservation_time}</span></div>
        <div class="details-row"><span class="label">Numri i personave:</span><span class="value">${data.party_size} persona</span></div>
      </div>
      <div class="note"><strong>📌 Shënim:</strong> Ju lutem arrini 10 minuta para kohës së rezervimit dhe tregojini kamarierit kodin <strong>${data.reservation_code}</strong>.</div>
      <p style="margin-top: 30px;">Faleminderit që na zgjodhët!</p>
    </div>
    <div class="footer">
      <p>Nëse keni pyetje, na kontaktoni.</p>
      <p style="margin: 5px 0; font-size: 12px;">© ${new Date().getFullYear()} Restaurant. Të gjitha të drejtat e rezervuara.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Send reservation email
async function sendReservationEmail(emailData) {
  try {
    const mailOptions = {
      from: '"Restaurant" <jorgosdervishi@gmail.com>',
      to: emailData.customer_email,
      subject: `✓ Rezervimi juaj - Kod: ${emailData.reservation_code}`,
      html: getReservationEmailHTML(emailData)
    };
    
    const info = await emailTransporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    return false;
  }
}

// 🔗 DATABASE CONNECTION
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "Restaurant_System",
  password: "Jorgo123.", 
  port: 5432,
});

// ⚡ HTTP SERVER + SOCKET.IO
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// 🧪 TEST ROUTE
app.get("/", (req, res) => {
  res.send("Backend running with realtime 🚀");
});

// ═══════════════════════════════════════════════════════════
// LOGIN ENDPOINTS
// ═══════════════════════════════════════════════════════════

app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const result = await pool.query(
      'SELECT id, username, password, role, name FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];

    if (password !== user.password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name
    };

    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      },
      token: req.sessionID
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.session.user });
});

// 📂 GET CATEGORIES
app.get("/categories", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM categories ORDER BY type, name"
    );
    console.log(`✅ GET /categories → ${result.rows.length} categories`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ ERROR fetching categories:", err);
    res.status(500).json({ error: err.message });
  }
});


// 🍽️ GET MENU ITEMS
app.get("/menu_items", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, i.quantity_in_stock, i.unit,
       CASE 
         WHEN m.out_of_stock = true OR i.quantity_in_stock <= 0 THEN false
         ELSE true
       END as in_stock
       FROM menu_items m
       LEFT JOIN inventory i ON m.id = i.menu_item_id
       WHERE m.is_available = true
       ORDER BY m.category_id, m.name`
    );
    console.log(`✅ GET /menu_items → ${result.rows.length} items`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ ERROR fetching menu items:", err);
    res.status(500).json({ error: err.message });
  }
});


// 🏓 GET TABLES
app.get("/tables", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tables ORDER BY table_number"
    );
    console.log(`✅ GET /tables → ${result.rows.length} tables`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ ERROR fetching tables:", err);
    res.status(500).json({ error: err.message });
  }
});


// 📋 GET ORDER ITEMS
app.get("/orders/:id/items", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT oi.*, m.name 
       FROM order_items oi
       JOIN menu_items m ON oi.menu_item_id = m.id
       WHERE oi.order_id = $1`,
      [id]
    );
    console.log(`✅ GET /orders/${id}/items → ${result.rows.length} items`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ ERROR fetching order items:", err);
    res.status(500).json({ error: err.message });
  }
});


// 🔓 OPEN TABLE SESSION
app.post("/sessions/open", async (req, res) => {
  try {
    const { table_id, waiter_id = 1 } = req.body;

    // Check if table already has active session
    const existing = await pool.query(
      "SELECT * FROM table_sessions WHERE table_id = $1 AND status = 'ACTIVE'",
      [table_id]
    );

    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]);
    }

    // Create new session
    const sessionCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    const result = await pool.query(
      `INSERT INTO table_sessions (table_id, waiter_id, status, session_code) 
       VALUES ($1, $2, 'ACTIVE', $3) RETURNING *`,
      [table_id, waiter_id, sessionCode]
    );

    // Update table status
    await pool.query("UPDATE tables SET status = 'occupied' WHERE id = $1", [table_id]);

    console.log(`✅ Session opened - Table ${table_id}, Code: ${sessionCode}`);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔒 VERIFY SESSION CODE
app.post("/sessions/verify-code", async (req, res) => {
  try {
    const { table_id, session_code } = req.body;
    
    const result = await pool.query(
      `SELECT * FROM table_sessions 
       WHERE table_id = $1 AND session_code = $2 AND status = 'ACTIVE'`,
      [table_id, session_code]
    );
    
    if (result.rows.length > 0) {
      res.json({ valid: true, session: result.rows[0] });
    } else {
      res.json({ valid: false, message: "Invalid code" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔒 CLOSE TABLE SESSION
app.post("/sessions/:id/close", async (req, res) => {
  try {
    const { id } = req.params;

    // Get session
    const session = await pool.query(
      "SELECT * FROM table_sessions WHERE id = $1",
      [id]
    );

    if (session.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    const table_id = session.rows[0].table_id;

    // Calculate total (EXCLUDE CANCELLED)
    const totalResult = await pool.query(
      `SELECT COALESCE(SUM(total_price), 0) as total 
       FROM orders 
       WHERE session_id = $1 AND status != 'CANCELLED'`,
      [id]
    );
    const total = totalResult.rows[0].total;

    // Close session
    await pool.query(
      `UPDATE table_sessions 
       SET status = 'CLOSED', closed_at = NOW(), total_amount = $1 
       WHERE id = $2`,
      [total, id]
    );

    // Free table
    await pool.query("UPDATE tables SET status = 'free' WHERE id = $1", [table_id]);

    res.json({ message: "Session closed", total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🧹 CLEANUP - Free tables without active sessions
app.post("/tables/cleanup", async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE tables 
       SET status = 'free' 
       WHERE status = 'occupied' 
       AND id NOT IN (
         SELECT table_id 
         FROM table_sessions 
         WHERE status = 'ACTIVE'
       )
       RETURNING *`
    );
    
    console.log(`✅ Cleaned up ${result.rows.length} tables`);
    res.json({ 
      message: "Tables cleaned up", 
      freed_tables: result.rows.length,
      tables: result.rows 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 📊 GET ACTIVE SESSIONS
app.get("/sessions/active", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        s.*,
        t.table_number,
        COALESCE(SUM(CASE WHEN o.status != 'CANCELLED' THEN o.total_price ELSE 0 END), 0) as current_total,
        COUNT(CASE WHEN o.status != 'CANCELLED' THEN o.id END) as order_count
       FROM table_sessions s
       LEFT JOIN tables t ON s.table_id = t.id
       LEFT JOIN orders o ON o.session_id = s.id
       WHERE s.status = 'ACTIVE'
       GROUP BY s.id, t.table_number
       ORDER BY s.opened_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 📋 GET CLOSED SESSIONS TODAY
app.get("/sessions/closed/today", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, t.table_number,
        COUNT(CASE WHEN o.status != 'CANCELLED' THEN o.id END) as order_count
       FROM table_sessions s
       LEFT JOIN tables t ON s.table_id = t.id
       LEFT JOIN orders o ON o.session_id = s.id
       WHERE s.status = 'CLOSED' 
       AND DATE(s.closed_at) = CURRENT_DATE
       GROUP BY s.id, t.table_number
       ORDER BY s.closed_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 📋 GET SESSION ORDERS
app.get("/sessions/:id/orders", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT o.*, 
        json_agg(
          json_build_object(
            'name', m.name,
            'quantity', oi.quantity,
            'price', COALESCE(oi.price, m.price)
          )
        ) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN menu_items m ON oi.menu_item_id = m.id
       WHERE o.session_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔍 GET OR CREATE SESSION FOR TABLE
app.get("/tables/:id/session", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      "SELECT * FROM table_sessions WHERE table_id = $1 AND status = 'ACTIVE'",
      [id]
    );

    if (result.rows.length > 0) {
      res.json({ session: result.rows[0], exists: true });
    } else {
      res.json({ session: null, exists: false });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🍔 CREATE ORDER
app.post("/orders", async (req, res) => {
  try {
    const { table_id, user_id, items, session_id } = req.body;

    // 1. krijo porosinë
    const orderResult = await pool.query(
      "INSERT INTO orders (table_id, user_id, status, total_price, session_id) VALUES ($1, $2, 'NEW', 0, $3) RETURNING *",
      [table_id, user_id, session_id || null]
    );

    const order = orderResult.rows[0];
    let total = 0;

    // 2. shto produktet
    let foodItems = [];
let drinkItems = [];

for (let item of items) {
  const menuItem = await pool.query(
    `SELECT m.id, m.name, m.price, c.type 
     FROM menu_items m
     JOIN categories c ON m.category_id = c.id
     WHERE m.id = $1`,
    [item.menu_item_id]
  );

  if (menuItem.rows.length === 0) {
    return res.status(400).json({ error: "Menu item not found" });
  }

  const price = menuItem.rows[0].price;
  const type = menuItem.rows[0].type;
  const name = menuItem.rows[0].name;

  total += price * item.quantity;

  // ruaj në DB (si më parë)
  await pool.query(
    "INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES ($1, $2, $3, $4)",
    [order.id, item.menu_item_id, item.quantity, price]
  );

  // 🔥 STOCK DEDUCTION
  await pool.query(
    `UPDATE inventory SET quantity_in_stock = quantity_in_stock - $1 
     WHERE menu_item_id = $2 AND quantity_in_stock >= $1`,
    [item.quantity, item.menu_item_id]
  );

  // Log stock movement
  await pool.query(
    `INSERT INTO stock_movements 
     (menu_item_id, movement_type, quantity, reference_id, reference_type, created_by)
     VALUES ($1, 'SALE', $2, $3, 'ORDER', $4)`,
    [item.menu_item_id, -item.quantity, order.id, user_id]
  );

  // Check if out of stock
  const stockCheck = await pool.query(
    "SELECT quantity_in_stock FROM inventory WHERE menu_item_id = $1",
    [item.menu_item_id]
  );
  
  if (stockCheck.rows[0]?.quantity_in_stock <= 0) {
    await pool.query(
      "UPDATE menu_items SET out_of_stock = true WHERE id = $1",
      [item.menu_item_id]
    );
  }

  // 🔥 NDAJA FOOD vs DRINK (me emra)
  const itemWithName = {
    menu_item_id: item.menu_item_id,
    name: name,
    quantity: item.quantity,
    price: price
  };

  if (type === "FOOD") {
    foodItems.push(itemWithName);
  } else if (type === "DRINK") {
    drinkItems.push(itemWithName);
  }
  console.log("TYPE:", type, "NAME:", name);
}
console.log("FOOD ITEMS:", foodItems);
console.log("DRINK ITEMS:", drinkItems);

    // 3. update total
    await pool.query(
      "UPDATE orders SET total_price = $1 WHERE id = $2",
      [total, order.id]
    );

    // 🔥 REAL-TIME EVENT
   // 🍳 KUZHINA
if (foodItems.length > 0) {
  io.emit("new_kitchen_order", {
    order_id: order.id,
    table_id,
    items: foodItems
  });
}

// 🥤 BAR / WAITER
if (drinkItems.length > 0) {
  console.log("SENDING BAR ORDER");
  io.emit("new_bar_order", {
    order_id: order.id,
    table_id,
    items: drinkItems
  });
}

    // përgjigje
    res.json({
      message: "Order created",
      order_id: order.id,
      total
    });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).send(err.message);
  }
});


// 📥 GET ORDERS
app.get("/orders", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});


// 🔄 UPDATE STATUS
app.put("/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    await pool.query(
      "UPDATE orders SET status = $1 WHERE id = $2",
      [status, req.params.id]
    );

    res.json({ message: "Status updated" });

  } catch (err) {
    res.status(500).send(err.message);
  }
});


// 🛑 CANCEL ORDER
app.post("/orders/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id = 1 } = req.body;

    // Get order items
    const orderItems = await pool.query(
      "SELECT menu_item_id, quantity FROM order_items WHERE order_id = $1",
      [id]
    );

    // Refund stock for each item (WITHOUT emitting events)
    for (const item of orderItems.rows) {
      await pool.query(
        `UPDATE inventory SET quantity_in_stock = quantity_in_stock + $1 
         WHERE menu_item_id = $2`,
        [item.quantity, item.menu_item_id]
      );

      // Log stock movement
      await pool.query(
        `INSERT INTO stock_movements 
         (menu_item_id, movement_type, quantity, reference_id, reference_type, notes, created_by)
         VALUES ($1, 'ADJUSTMENT', $2, $3, 'ORDER_CANCEL', 'Order cancelled - stock refunded', $4)`,
        [item.menu_item_id, item.quantity, id, user_id]
      );

      // Update out_of_stock status
      await pool.query(
        "UPDATE menu_items SET out_of_stock = false WHERE id = $1",
        [item.menu_item_id]
      );
    }

    // Mark order as cancelled
    await pool.query(
      "UPDATE orders SET status = 'CANCELLED' WHERE id = $1",
      [id]
    );

    // ONLY emit cancel event (do NOT re-emit products)
    io.emit("order_cancelled", { order_id: parseInt(id) });

    console.log(`✅ Order ${id} cancelled - stock refunded`);
    res.json({ message: "Order cancelled and stock refunded" });
  } catch (err) {
    console.error("❌ Cancel error:", err);
    res.status(500).json({ error: err.message });
  }
});


// ═══════════════════════════════════════════════════════════
// 🎫 RESERVATION MANAGEMENT
// ═══════════════════════════════════════════════════════════

// Create reservation
app.post("/reservations", async (req, res) => {
  try {
    const { table_id = 1, customer_name, customer_phone = 'N/A', customer_email, reservation_date, reservation_time, party_size, notes, user_id = 1 } = req.body;
    
    // Generate unique code
    const codeResult = await pool.query("SELECT generate_reservation_code() as code");
    const reservationCode = codeResult.rows[0].code;
    
    const result = await pool.query(
      `INSERT INTO reservations 
       (table_id, customer_name, customer_phone, reservation_date, reservation_time, party_size, reservation_code, status, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'CONFIRMED', $8, $9) RETURNING *`,
      [table_id, customer_name, customer_phone, reservation_date, reservation_time, party_size, reservationCode, notes, user_id]
    );
    
    // Update table status to reserved
    await pool.query("UPDATE tables SET status = 'reserved' WHERE id = $1", [table_id]);
    
    const reservation = result.rows[0];
    
    console.log(`✅ Reservation created - Table ${table_id}, Code: ${reservationCode}, Customer: ${customer_name}`);
    
    // 📧 Send email if customer_email provided
    if (customer_email && customer_email.trim() !== '') {
      const tableResult = await pool.query("SELECT table_number FROM tables WHERE id = $1", [table_id]);
      const table_number = tableResult.rows[0]?.table_number || table_id;
      
      const emailData = {
        customer_name,
        customer_email,
        reservation_code: reservationCode,
        table_number,
        reservation_date,
        reservation_time,
        party_size
      };
      
      // Send email asynchronously (don't wait)
      sendReservationEmail(emailData).catch(err => 
        console.error('Email sending failed but reservation created:', err.message)
      );
      
      console.log(`📧 Sending confirmation email to: ${customer_email}`);
    }
    
    res.json({ 
      reservation: result.rows[0],
      message: 'Reservation confirmed! Code displayed on screen.' 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get reservations
app.get("/reservations", async (req, res) => {
  try {
    const { date } = req.query;
    let query = "SELECT r.*, t.table_number FROM reservations r JOIN tables t ON r.table_id = t.id";
    const params = [];
    
    if (date) {
      query += " WHERE r.reservation_date = $1";
      params.push(date);
    }
    
    query += " ORDER BY r.reservation_date DESC, r.reservation_time DESC";
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify reservation code
app.post("/reservations/verify-code", async (req, res) => {
  try {
    const { reservation_code } = req.body;
    
    const result = await pool.query(
      `SELECT r.*, t.table_number FROM reservations r 
       JOIN tables t ON r.table_id = t.id
       WHERE r.reservation_code = $1 AND r.status IN ('CONFIRMED', 'PENDING')`,
      [reservation_code]
    );
    
    if (result.rows.length > 0) {
      res.json({ valid: true, reservation: result.rows[0] });
    } else {
      res.json({ valid: false, message: "Invalid or expired code" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seat reservation
app.post("/reservations/:id/seat", async (req, res) => {
  try {
    const { id } = req.params;
    
    const reservation = await pool.query("SELECT * FROM reservations WHERE id = $1", [id]);
    
    if (reservation.rows.length === 0) {
      return res.status(404).json({ error: "Reservation not found" });
    }
    
    const resData = reservation.rows[0];
    
    // Create session with same code
    const sessionResult = await pool.query(
      `INSERT INTO table_sessions (table_id, status, session_code, reservation_id)
       VALUES ($1, 'ACTIVE', $2, $3) RETURNING *`,
      [resData.table_id, resData.reservation_code, id]
    );
    
    // Update reservation & table
    await pool.query("UPDATE reservations SET status = 'SEATED' WHERE id = $1", [id]);
    await pool.query("UPDATE tables SET status = 'occupied' WHERE id = $1", [resData.table_id]);
    
    console.log(`✅ Reservation ${id} seated`);
    res.json({ session: sessionResult.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel reservation
app.post("/reservations/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;
    
    const reservation = await pool.query("SELECT table_id FROM reservations WHERE id = $1", [id]);
    
    if (reservation.rows.length === 0) {
      return res.status(404).json({ error: "Reservation not found" });
    }
    
    await pool.query("UPDATE reservations SET status = 'CANCELLED' WHERE id = $1", [id]);
    await pool.query("UPDATE tables SET status = 'free' WHERE id = $1", [reservation.rows[0].table_id]);
    
    res.json({ message: "Reservation cancelled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ═══════════════════════════════════════════════════════════
// 📦 INVENTORY MANAGEMENT
// ═══════════════════════════════════════════════════════════

// Get all inventory
app.get("/inventory", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, m.name as item_name, m.price, c.name as category_name, c.type
       FROM inventory i
       JOIN menu_items m ON i.menu_item_id = m.id
       JOIN categories c ON m.category_id = c.id
       ORDER BY m.name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get low stock items
app.get("/inventory/low-stock", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM low_stock_items");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update stock
app.post("/inventory/adjust", async (req, res) => {
  try {
    const { menu_item_id, quantity, notes, user_id = 1 } = req.body;
    
    const current = await pool.query(
      "SELECT quantity_in_stock FROM inventory WHERE menu_item_id = $1",
      [menu_item_id]
    );
    
    const previousStock = current.rows[0].quantity_in_stock;
    const newStock = previousStock + quantity;
    
    await pool.query(
      "UPDATE inventory SET quantity_in_stock = $1 WHERE menu_item_id = $2",
      [newStock, menu_item_id]
    );
    
    await pool.query(
      `INSERT INTO stock_movements 
       (menu_item_id, movement_type, quantity, previous_stock, new_stock, reference_type, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, 'MANUAL', $6, $7)`,
      [menu_item_id, quantity > 0 ? 'PURCHASE' : 'ADJUSTMENT', quantity, previousStock, newStock, notes, user_id]
    );
    
    if (newStock > 0) {
      await pool.query("UPDATE menu_items SET out_of_stock = false WHERE id = $1", [menu_item_id]);
    }
    
    res.json({ message: "Stock updated", previous: previousStock, new: newStock });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get stock movements
app.get("/inventory/movements", async (req, res) => {
  try {
    const { menu_item_id, limit = 50 } = req.query;
    
    let query = `
      SELECT sm.*, m.name as item_name, u.name as user_name
      FROM stock_movements sm
      JOIN menu_items m ON sm.menu_item_id = m.id
      LEFT JOIN users u ON sm.created_by = u.id
    `;
    
    const params = [];
    if (menu_item_id) {
      query += " WHERE sm.menu_item_id = $1";
      params.push(menu_item_id);
    }
    
    query += ` ORDER BY sm.created_at DESC LIMIT ${limit}`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard stats
app.get("/dashboard/stats", async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const salesRes = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total 
       FROM table_sessions 
       WHERE DATE(closed_at) = $1 AND status = 'CLOSED'`,
      [today]
    );
    
    const ordersRes = await pool.query(
      `SELECT COUNT(*) as count 
       FROM orders o
       JOIN table_sessions ts ON o.session_id = ts.id
       WHERE ts.status = 'ACTIVE'
       AND o.status NOT IN ('COMPLETED', 'CANCELLED')`
    );
    
    const lowStockRes = await pool.query(
      `SELECT COUNT(*) as count 
       FROM inventory 
       WHERE quantity_in_stock <= minimum_stock`
    );
    
    const sessionsRes = await pool.query(
      `SELECT COUNT(*) as count 
       FROM table_sessions 
       WHERE status = 'ACTIVE'`
    );
    
    const topProductsRes = await pool.query(
      `SELECT m.name, SUM(oi.quantity) as sold
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN menu_items m ON oi.menu_item_id = m.id
       JOIN table_sessions ts ON o.session_id = ts.id
       WHERE DATE(ts.closed_at) = $1
       AND o.status = 'COMPLETED'
       GROUP BY m.name
       ORDER BY sold DESC
       LIMIT 5`,
      [today]
    );
    
    res.json({
      total_sales: parseFloat(salesRes.rows[0].total),
      active_orders: parseInt(ordersRes.rows[0].count),
      active_sessions: parseInt(sessionsRes.rows[0].count),
      low_stock_count: parseInt(lowStockRes.rows[0].count),
      top_products: topProductsRes.rows
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN REPORTS ENDPOINTS
// ═══════════════════════════════════════════════════════════

// Daily Report
app.get("/admin/reports/daily", async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT 
        COALESCE(SUM(ts.total_amount), 0) as total_sales,
        COUNT(DISTINCT ts.id) as total_sessions,
        COUNT(DISTINCT o.id) as total_orders
       FROM table_sessions ts
       LEFT JOIN orders o ON o.session_id = ts.id
       WHERE DATE(ts.closed_at) = $1
       AND ts.status = 'CLOSED'`,
      [targetDate]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Daily report error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Top Products Report
app.get("/admin/reports/top-products", async (req, res) => {
  try {
    const { period = 'today', limit = 10 } = req.query;
    
    let dateCondition = "DATE(ts.closed_at) = CURRENT_DATE";
    if (period === 'week') {
      dateCondition = "ts.closed_at >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (period === 'month') {
      dateCondition = "ts.closed_at >= CURRENT_DATE - INTERVAL '30 days'";
    }

    const result = await pool.query(
      `SELECT 
        m.name,
        c.name as category,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * COALESCE(oi.price, m.price)) as total_revenue
       FROM order_items oi
       JOIN menu_items m ON oi.menu_item_id = m.id
       JOIN categories c ON m.category_id = c.id
       JOIN orders o ON oi.order_id = o.id
       JOIN table_sessions ts ON o.session_id = ts.id
       WHERE ${dateCondition}
       AND o.status = 'COMPLETED'
       GROUP BY m.id, m.name, c.name
       ORDER BY total_sold DESC
       LIMIT $1`,
      [limit]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Top products error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Sales by Category
app.get("/admin/reports/sales-by-category", async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    
    let dateCondition = "DATE(ts.closed_at) = CURRENT_DATE";
    if (period === 'week') {
      dateCondition = "ts.closed_at >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (period === 'month') {
      dateCondition = "ts.closed_at >= CURRENT_DATE - INTERVAL '30 days'";
    }

    const result = await pool.query(
      `SELECT 
        c.name as category,
        c.type,
        SUM(oi.quantity) as items_sold,
        SUM(oi.quantity * COALESCE(oi.price, m.price)) as revenue
       FROM order_items oi
       JOIN menu_items m ON oi.menu_item_id = m.id
       JOIN categories c ON m.category_id = c.id
       JOIN orders o ON oi.order_id = o.id
       JOIN table_sessions ts ON o.session_id = ts.id
       WHERE ${dateCondition}
       AND o.status = 'COMPLETED'
       GROUP BY c.id, c.name, c.type
       ORDER BY revenue DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Sales by category error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 📊 WEEKLY REPORT
app.get('/admin/reports/weekly', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    
    const report = await pool.query(`
      SELECT 
        DATE(o.created_at) as date,
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT o.session_id) as total_sessions,
        SUM(o.total_price) as total_revenue,
        AVG(o.total_price) as avg_order_value,
        COUNT(DISTINCT o.table_id) as tables_used
      FROM orders o
      WHERE o.created_at >= $1 AND o.created_at < $2::date + INTERVAL '1 day'
        AND o.status != 'CANCELLED'
      GROUP BY DATE(o.created_at)
      ORDER BY date DESC
    `, [start, end]);
    
    const totals = {
      total_orders: report.rows.reduce((sum, day) => sum + parseInt(day.total_orders || 0), 0),
      total_sessions: report.rows.reduce((sum, day) => sum + parseInt(day.total_sessions || 0), 0),
      total_revenue: report.rows.reduce((sum, day) => sum + parseFloat(day.total_revenue || 0), 0),
      avg_order_value: report.rows.length > 0 
        ? report.rows.reduce((sum, day) => sum + parseFloat(day.avg_order_value || 0), 0) / report.rows.length 
        : 0
    };
    
    res.json({ period: 'weekly', start_date: start, end_date: end, daily_breakdown: report.rows, totals });
  } catch (err) {
    console.error('Weekly report error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 📊 MONTHLY REPORT
app.get('/admin/reports/monthly', async (req, res) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month || (now.getMonth() + 1);
    const targetYear = year || now.getFullYear();
    
    const report = await pool.query(`
      SELECT 
        DATE(o.created_at) as date,
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT o.session_id) as total_sessions,
        SUM(o.total_price) as total_revenue,
        AVG(o.total_price) as avg_order_value,
        COUNT(DISTINCT o.table_id) as tables_used
      FROM orders o
      WHERE EXTRACT(MONTH FROM o.created_at) = $1
        AND EXTRACT(YEAR FROM o.created_at) = $2
        AND o.status != 'CANCELLED'
      GROUP BY DATE(o.created_at)
      ORDER BY date DESC
    `, [targetMonth, targetYear]);
    
    const topProducts = await pool.query(`
      SELECT 
        m.name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.price) as revenue
      FROM order_items oi
      JOIN menu_items m ON oi.menu_item_id = m.id
      JOIN orders o ON oi.order_id = o.id
      WHERE EXTRACT(MONTH FROM o.created_at) = $1
        AND EXTRACT(YEAR FROM o.created_at) = $2
        AND o.status != 'CANCELLED'
      GROUP BY m.id, m.name
      ORDER BY total_sold DESC
      LIMIT 10
    `, [targetMonth, targetYear]);
    
    const totals = {
      total_orders: report.rows.reduce((sum, day) => sum + parseInt(day.total_orders || 0), 0),
      total_sessions: report.rows.reduce((sum, day) => sum + parseInt(day.total_sessions || 0), 0),
      total_revenue: report.rows.reduce((sum, day) => sum + parseFloat(day.total_revenue || 0), 0),
      avg_order_value: report.rows.length > 0 
        ? report.rows.reduce((sum, day) => sum + parseFloat(day.avg_order_value || 0), 0) / report.rows.length 
        : 0,
      days_active: report.rows.length
    };
    
    res.json({ period: 'monthly', month: targetMonth, year: targetYear, daily_breakdown: report.rows, top_products: topProducts.rows, totals });
  } catch (err) {
    console.error('Monthly report error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 📊 YEARLY REPORT
app.get('/admin/reports/yearly', async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year || new Date().getFullYear();
    
    const report = await pool.query(`
      SELECT 
        EXTRACT(MONTH FROM o.created_at) as month,
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT o.session_id) as total_sessions,
        SUM(o.total_price) as total_revenue,
        AVG(o.total_price) as avg_order_value
      FROM orders o
      WHERE EXTRACT(YEAR FROM o.created_at) = $1
        AND o.status != 'CANCELLED'
      GROUP BY EXTRACT(MONTH FROM o.created_at)
      ORDER BY month ASC
    `, [targetYear]);
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = report.rows.map(row => ({ ...row, month_name: monthNames[parseInt(row.month) - 1] }));
    
    const totals = {
      total_orders: report.rows.reduce((sum, m) => sum + parseInt(m.total_orders || 0), 0),
      total_sessions: report.rows.reduce((sum, m) => sum + parseInt(m.total_sessions || 0), 0),
      total_revenue: report.rows.reduce((sum, m) => sum + parseFloat(m.total_revenue || 0), 0),
      avg_order_value: report.rows.length > 0 
        ? report.rows.reduce((sum, m) => sum + parseFloat(m.avg_order_value || 0), 0) / report.rows.length 
        : 0,
      months_active: report.rows.length
    };
    
    res.json({ period: 'yearly', year: targetYear, monthly_breakdown: monthlyData, totals });
  } catch (err) {
    console.error('Yearly report error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 📊 WAITER PERFORMANCE
app.get('/admin/waiter-performance', async (req, res) => {
  try {
    const { startDate, endDate, waiterId } = req.query;
    
    let query = `
      SELECT 
        u.id as waiter_id,
        u.name as waiter_name,
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_price), 0) as total_revenue,
        COALESCE(AVG(o.total_price), 0) as avg_order_value,
        COUNT(DISTINCT DATE(s.opened_at)) as days_worked
      FROM users u
      LEFT JOIN table_sessions s ON u.id = s.waiter_id
      LEFT JOIN orders o ON s.id = o.session_id AND o.status != 'CANCELLED'
      WHERE u.id IS NOT NULL
    `;
    
    const params = [];
    if (waiterId) {
      params.push(waiterId);
      query += ` AND u.id = $${params.length}`;
    }
    if (startDate) {
      params.push(startDate);
      query += ` AND s.opened_at >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      query += ` AND s.opened_at < $${params.length}::date + INTERVAL '1 day'`;
    }
    
    query += ` GROUP BY u.id, u.name HAVING COUNT(DISTINCT s.id) > 0 ORDER BY total_revenue DESC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Waiter performance error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 📊 GET WAITER SHIFTS
app.get('/waiter/my-shifts', async (req, res) => {
  try {
    const { waiter_id, date } = req.query;
    if (!waiter_id) return res.status(400).json({ error: 'waiter_id required' });
    
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const result = await pool.query(`
      SELECT 
        s.id as session_id, s.table_id, t.table_number, s.opened_at, s.closed_at, s.status,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(o.total_price), 0) as session_total
      FROM table_sessions s
      JOIN tables t ON s.table_id = t.id
      LEFT JOIN orders o ON s.id = o.session_id AND o.status != 'CANCELLED'
      WHERE s.waiter_id = $1 AND DATE(s.opened_at) = $2
      GROUP BY s.id, t.table_number
      ORDER BY s.opened_at DESC
    `, [waiter_id, targetDate]);
    
    const totals = {
      total_sessions: result.rows.length,
      total_revenue: result.rows.reduce((sum, s) => sum + parseFloat(s.session_total || 0), 0),
      active_sessions: result.rows.filter(s => s.status === 'ACTIVE').length,
      closed_sessions: result.rows.filter(s => s.status === 'CLOSED').length
    };
    
    res.json({ date: targetDate, waiter_id: parseInt(waiter_id), shifts: result.rows, totals });
  } catch (err) {
    console.error('My shifts error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 📊 TOP WAITERS LEADERBOARD
app.get('/admin/top-waiters', async (req, res) => {
  try {
    const { period } = req.query;
    let dateFilter = "DATE(s.opened_at) = CURRENT_DATE";
    
    if (period === 'week') dateFilter = "s.opened_at >= CURRENT_DATE - INTERVAL '7 days'";
    else if (period === 'month') dateFilter = "s.opened_at >= CURRENT_DATE - INTERVAL '30 days'";
    
    const result = await pool.query(`
      SELECT 
        u.id, u.name,
        COUNT(DISTINCT s.id) as sessions_served,
        COALESCE(SUM(o.total_price), 0) as total_revenue,
        COALESCE(AVG(o.total_price), 0) as avg_order_value,
        COUNT(DISTINCT o.id) as total_orders
      FROM users u
      JOIN table_sessions s ON u.id = s.waiter_id
      LEFT JOIN orders o ON s.id = o.session_id AND o.status != 'CANCELLED'
      WHERE ${dateFilter}
      GROUP BY u.id, u.name
      ORDER BY total_revenue DESC
      LIMIT 10
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Top waiters error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN USER MANAGEMENT
// ═══════════════════════════════════════════════════════════

// GET ALL USERS
app.get("/admin/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, role, name, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: err.message });
  }
});

// CREATE USER
app.post("/admin/users", requireRole('admin'), async (req, res) => {
  try {
    const { username, password, role, name } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role required' });
    }

    const result = await pool.query(
      `INSERT INTO users (username, password, role, name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, role, name, created_at`,
      [username, password, role, name || username]
    );

    console.log(`✅ User created: ${username}`);
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    console.error('Create user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE USER
app.put("/admin/users/:id", requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, name } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET username = $1, password = $2, role = $3, name = $4
       WHERE id = $5
       RETURNING id, username, role, name, created_at`,
      [username, password, role, name, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`✅ User updated: ${id}`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE USER
app.delete("/admin/users/:id", requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Don't allow deleting yourself
    if (req.session.user.id == id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`✅ User deleted: ${id}`);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: err.message });
  }
});


// ═══════════════════════════════════════════════════════════
// ADMIN PRODUCTS MANAGEMENT
// ═══════════════════════════════════════════════════════════

// CREATE PRODUCT
app.post("/admin/products", async (req, res) => {
  try {
    const { name, description, price, category_id, minimum_stock, unit } = req.body;
    
    const menuResult = await pool.query(
      `INSERT INTO menu_items (name, description, price, category_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description, price, category_id]
    );
    
    await pool.query(
      `INSERT INTO inventory (menu_item_id, quantity_in_stock, minimum_stock, unit)
       VALUES ($1, 0, $2, $3)`,
      [menuResult.rows[0].id, minimum_stock || 10, unit || 'copë']
    );
    
    console.log(`✅ Product created: ${name}`);
    res.json(menuResult.rows[0]);
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE PRODUCT
app.put("/admin/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category_id } = req.body;
    
    const result = await pool.query(
      `UPDATE menu_items 
       SET name = $1, description = $2, price = $3, category_id = $4
       WHERE id = $5
       RETURNING *`,
      [name, description, price, category_id, id]
    );
    
    console.log(`✅ Product updated: ${id}`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE PRODUCT
app.delete("/admin/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM inventory WHERE menu_item_id = $1', [id]);
    await pool.query('DELETE FROM menu_items WHERE id = $1', [id]);
    
    console.log(`✅ Product deleted: ${id}`);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN CATEGORIES MANAGEMENT
// ═══════════════════════════════════════════════════════════

// CREATE CATEGORY
app.post("/admin/categories", async (req, res) => {
  try {
    const { name, type } = req.body;
    
    const result = await pool.query(
      `INSERT INTO categories (name, type)
       VALUES ($1, $2)
       RETURNING *`,
      [name, type || 'FOOD']
    );
    
    console.log(`✅ Category created: ${name}`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE CATEGORY
app.put("/admin/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type } = req.body;
    
    const result = await pool.query(
      `UPDATE categories 
       SET name = $1, type = $2
       WHERE id = $3
       RETURNING *`,
      [name, type, id]
    );
    
    console.log(`✅ Category updated: ${id}`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE CATEGORY
app.delete("/admin/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const check = await pool.query(
      'SELECT id FROM menu_items WHERE category_id = $1',
      [id]
    );
    
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete category with products' });
    }
    
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    
    console.log(`✅ Category deleted: ${id}`);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN TABLE MANAGEMENT
// ═══════════════════════════════════════════════════════════

// CREATE TABLE
app.post("/admin/tables", async (req, res) => {
  try {
    const { table_number, capacity } = req.body;
    
    const result = await pool.query(
      `INSERT INTO tables (table_number, capacity, status)
       VALUES ($1, $2, 'free')
       RETURNING *`,
      [table_number, capacity || 4]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Create table error:', err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE TABLE
app.put("/admin/tables/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { table_number, capacity } = req.body;
    
    const result = await pool.query(
      `UPDATE tables 
       SET table_number = $1, capacity = $2
       WHERE id = $3
       RETURNING *`,
      [table_number, capacity, id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update table error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE TABLE
app.delete("/admin/tables/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const activeCheck = await pool.query(
      `SELECT id FROM table_sessions WHERE table_id = $1 AND status = 'ACTIVE'`,
      [id]
    );
    
    if (activeCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete table with active sessions' });
    }
    
    await pool.query('DELETE FROM tables WHERE id = $1', [id]);
    res.json({ message: 'Table deleted' });
  } catch (err) {
    console.error('Delete table error:', err);
    res.status(500).json({ error: err.message });
  }
});

// FREE TABLE (Cancel Reservation)
app.post("/admin/tables/:id/free", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 Attempting to free table ID: ${id}`);
    
    const cancelResult = await pool.query(
      `UPDATE reservations 
       SET status = 'CANCELLED'
       WHERE table_id = $1 AND status IN ('CONFIRMED', 'SEATED')
       RETURNING id`,
      [id]
    );
    console.log(`📋 Cancelled ${cancelResult.rowCount} reservations`);
    
    const freeResult = await pool.query(
      `UPDATE tables SET status = 'free' WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (freeResult.rowCount === 0) {
      console.log(`⚠️ Table ${id} not found`);
      return res.status(404).json({ error: 'Table not found' });
    }
    
    console.log(`✅ Table ${id} freed successfully`);
    res.json({ 
      message: 'Table freed successfully',
      table: freeResult.rows[0],
      cancelledReservations: cancelResult.rowCount
    });
  } catch (err) {
    console.error('❌ Free table error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// AI FEATURES
// ═══════════════════════════════════════════════════════════

app.get('/ai/popular-items', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.id, m.name, m.price, m.description, m.category_id,
        COUNT(oi.id) as order_count
      FROM menu_items m
      JOIN order_items oi ON m.id = oi.menu_item_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at > CURRENT_DATE
      GROUP BY m.id, m.name, m.price, m.description, m.category_id
      HAVING COUNT(oi.id) >= 2
      ORDER BY order_count DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Popular items error:', err);
    res.json([]);
  }
});

app.get('/ai/recommendations', async (req, res) => {
  try {
    const hour = new Date().getHours();
    let categoryType;
    
    if (hour >= 6 && hour < 11) {
      categoryType = ['KAFETERIA', 'Antipasta'];
    } else if (hour >= 11 && hour < 15) {
      categoryType = ['Mishra', 'Sallata'];
    } else {
      categoryType = ['Mishra', 'Pije Alkolike'];
    }
    
    const result = await pool.query(`
      SELECT 
        m.id, m.name, m.price, m.description, m.category_id,
        c.name as category_name
      FROM menu_items m
      JOIN categories c ON m.category_id = c.id
      WHERE c.name = ANY($1) AND m.out_of_stock = false
      ORDER BY RANDOM()
      LIMIT 6
    `, [categoryType]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Recommendations error:', err);
    res.json([]);
  }
});

app.get('/ai/pairings', async (req, res) => {
  try {
    const result = await pool.query(`
      WITH order_pairs AS (
        SELECT 
          oi1.menu_item_id as item1,
          oi2.menu_item_id as item2,
          COUNT(*) as pair_count
        FROM order_items oi1
        JOIN order_items oi2 ON oi1.order_id = oi2.order_id 
          AND oi1.menu_item_id < oi2.menu_item_id
        GROUP BY oi1.menu_item_id, oi2.menu_item_id
        HAVING COUNT(*) >= 2
      )
      SELECT 
        item1,
        ARRAY_AGG(item2) as paired_items
      FROM order_pairs
      GROUP BY item1
    `);
    
    const pairings = {};
    result.rows.forEach(row => {
      pairings[row.item1] = row.paired_items;
      row.paired_items.forEach(item2 => {
        if (!pairings[item2]) {
          pairings[item2] = [];
        }
        if (!pairings[item2].includes(row.item1)) {
          pairings[item2].push(row.item1);
        }
      });
    });
    
    res.json(pairings);
  } catch (err) {
    console.error('Pairings error:', err);
    res.json({});
  }
});

// ═══════════════════════════════════════════════════════════
// DATABASE BACKUP SYSTEM
// ═══════════════════════════════════════════════════════════

const BACKUP_DIR = path.join(__dirname, 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log('✅ Backups directory created');
}

const createBackup = () => {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `backup_${timestamp}_${time}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    const dbConfig = {
      host: 'localhost',
      port: 5432,
      database: 'Restaurant_System',
      user: 'postgres',
      password: 'Jorgo123.'
    };

   const command = process.platform === 'win32'
  ? `set PGPASSWORD=${dbConfig.password} && pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -F p -f "${filepath}"`
  : `PGPASSWORD="${dbConfig.password}" pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -F p -f "${filepath}"`;
   
  exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Backup failed:', error.message);
        reject(error);
        return;
      }

      console.log(`✅ Backup created: ${filename}`);
      resolve({ filename, filepath, size: fs.statSync(filepath).size });
    });
  });
};

const cleanupOldBackups = () => {
  const files = fs.readdirSync(BACKUP_DIR);
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

  files.forEach(file => {
    const filepath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filepath);
    
    if (stats.mtimeMs < thirtyDaysAgo) {
      fs.unlinkSync(filepath);
      console.log(`🗑️  Deleted old backup: ${file}`);
    }
  });
};

const scheduleBackups = () => {
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(2, 0, 0, 0);

  if (now > scheduledTime) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const timeUntilBackup = scheduledTime - now;

  setTimeout(async () => {
    try {
      await createBackup();
      cleanupOldBackups();
    } catch (error) {
      console.error('Scheduled backup failed:', error);
    }

    setInterval(async () => {
      try {
        await createBackup();
        cleanupOldBackups();
      } catch (error) {
        console.error('Scheduled backup failed:', error);
      }
    }, 24 * 60 * 60 * 1000);

  }, timeUntilBackup);

  console.log(`📅 Next automatic backup scheduled for: ${scheduledTime.toLocaleString()}`);
};

scheduleBackups();

// ═══════════════════════════════════════════════════════════
// BACKUP ENDPOINTS
// ═══════════════════════════════════════════════════════════

app.post('/admin/backup/create', requireRole('admin'), async (req, res) => {
  try {
    const result = await createBackup();
    res.json({
      message: 'Backup created successfully',
      backup: result
    });
  } catch (error) {
    res.status(500).json({ error: 'Backup failed' });
  }
});

app.get('/admin/backup/list', requireRole('admin'), (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    
    const backups = files
      .filter(f => f.endsWith('.sql'))
      .map(f => {
        const filepath = path.join(BACKUP_DIR, f);
        const stats = fs.statSync(filepath);
        return {
          filename: f,
          size: stats.size,
          created: stats.mtime,
          sizeFormatted: (stats.size / 1024 / 1024).toFixed(2) + ' MB'
        };
      })
      .sort((a, b) => b.created - a.created);

    res.json({ backups });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list backups' });
  }
});

app.get('/admin/backup/download/:filename', requireRole('admin'), (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    res.download(filepath);
  } catch (error) {
    res.status(500).json({ error: 'Download failed' });
  }
});

app.delete('/admin/backup/:filename', requireRole('admin'), (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    fs.unlinkSync(filepath);
    res.json({ message: 'Backup deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

app.post('/admin/backup/restore/:filename', requireRole('admin'), (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(BACKUP_DIR, filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Backup not found' });
  }

  const dbConfig = {
    host: 'localhost',
    port: 5432,
    database: 'Restaurant_System',
    user: 'postgres',
    password: 'Jorgo123.'
  };

  const command = `PGPASSWORD="${dbConfig.password}" psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f "${filepath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Restore failed:', error.message);
      return res.status(500).json({ error: 'Restore failed' });
    }

    console.log('✅ Database restored from:', filename);
    res.json({ message: 'Database restored successfully' });
  });
});

console.log('✅ Backup system initialized');

// ═══════════════════════════════════════════════════════════
// SERVE STATIC FILES
// ═══════════════════════════════════════════════════════════

app.use('/public', express.static('public'));

// 🚀 START SERVER
server.listen(3000, () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚀 Server running on http://localhost:3000");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📡 Main endpoints:");
  console.log("   GET  /categories");
  console.log("   GET  /menu_items");
  console.log("   GET  /tables");
  console.log("   POST /orders");
  console.log("   POST /reservations");
  console.log("");
  console.log("🔐 Auth endpoints:");
  console.log("   POST /auth/login");
  console.log("   POST /auth/logout");
  console.log("   GET  /auth/me");
  console.log("");
  console.log("💾 Backup endpoints:");
  console.log("   POST   /admin/backup/create");
  console.log("   GET    /admin/backup/list");
  console.log("   GET    /admin/backup/download/:filename");
  console.log("   DELETE /admin/backup/:filename");
  console.log("   POST   /admin/backup/restore/:filename");
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
});