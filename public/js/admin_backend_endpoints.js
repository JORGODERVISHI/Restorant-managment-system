// ═══════════════════════════════════════════════════════════
// 🍔 ADMIN - MENU MANAGEMENT ENDPOINTS
// ═══════════════════════════════════════════════════════════

// Add these to your server.js file

// CREATE PRODUCT
app.post("/admin/products", async (req, res) => {
  try {
    const { name, description, price, category_id, image_url, minimum_stock, unit } = req.body;
    
    // Insert menu item
    const itemResult = await pool.query(
      `INSERT INTO menu_items (name, description, price, category_id, image_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, description, price, category_id, image_url || '/images/default.jpg']
    );
    
    const menuItemId = itemResult.rows[0].id;
    
    // Create inventory record
    await pool.query(
      `INSERT INTO inventory (menu_item_id, quantity_in_stock, minimum_stock, unit)
       VALUES ($1, 0, $2, $3)`,
      [menuItemId, minimum_stock || 10, unit || 'copë']
    );
    
    console.log(`✅ Product created: ${name}`);
    res.json({ product: itemResult.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE PRODUCT
app.put("/admin/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category_id, image_url } = req.body;
    
    const result = await pool.query(
      `UPDATE menu_items 
       SET name = $1, description = $2, price = $3, category_id = $4, image_url = $5
       WHERE id = $6 RETURNING *`,
      [name, description, price, category_id, image_url, id]
    );
    
    console.log(`✅ Product updated: ${name}`);
    res.json({ product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE PRODUCT
app.delete("/admin/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete inventory record first
    await pool.query("DELETE FROM inventory WHERE menu_item_id = $1", [id]);
    
    // Delete product
    await pool.query("DELETE FROM menu_items WHERE id = $1", [id]);
    
    console.log(`✅ Product deleted: ${id}`);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE CATEGORY
app.post("/admin/categories", async (req, res) => {
  try {
    const { name, type } = req.body;
    
    const result = await pool.query(
      `INSERT INTO categories (name, type) VALUES ($1, $2) RETURNING *`,
      [name, type]
    );
    
    console.log(`✅ Category created: ${name}`);
    res.json({ category: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE CATEGORY
app.put("/admin/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type } = req.body;
    
    const result = await pool.query(
      `UPDATE categories SET name = $1, type = $2 WHERE id = $3 RETURNING *`,
      [name, type, id]
    );
    
    res.json({ category: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE CATEGORY
app.delete("/admin/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category has products
    const check = await pool.query(
      "SELECT COUNT(*) FROM menu_items WHERE category_id = $1",
      [id]
    );
    
    if (parseInt(check.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: "Cannot delete category with products" 
      });
    }
    
    await pool.query("DELETE FROM categories WHERE id = $1", [id]);
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// 📊 ADMIN - REPORTS ENDPOINTS
// ═══════════════════════════════════════════════════════════

// DAILY SALES REPORT
app.get("/admin/reports/daily", async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const result = await pool.query(
      `SELECT 
        DATE(o.created_at) as date,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(CASE WHEN o.status != 'CANCELLED' THEN o.total_price ELSE 0 END) as total_sales,
        COUNT(DISTINCT o.session_id) as total_sessions
       FROM orders o
       WHERE DATE(o.created_at) = $1
       GROUP BY DATE(o.created_at)`,
      [targetDate]
    );
    
    res.json(result.rows[0] || { 
      date: targetDate, 
      total_orders: 0, 
      total_sales: 0, 
      total_sessions: 0 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TOP PRODUCTS REPORT
app.get("/admin/reports/top-products", async (req, res) => {
  try {
    const { period = 'today', limit = 10 } = req.query;
    
    let dateFilter = "DATE(o.created_at) = CURRENT_DATE";
    if (period === 'week') dateFilter = "o.created_at >= CURRENT_DATE - INTERVAL '7 days'";
    if (period === 'month') dateFilter = "o.created_at >= CURRENT_DATE - INTERVAL '30 days'";
    
    const result = await pool.query(
      `SELECT 
        m.id,
        m.name,
        c.name as category,
        SUM(oi.quantity) as total_sold,
        SUM(oi.price * oi.quantity) as total_revenue
       FROM order_items oi
       JOIN menu_items m ON oi.menu_item_id = m.id
       JOIN categories c ON m.category_id = c.id
       JOIN orders o ON oi.order_id = o.id
       WHERE ${dateFilter} AND o.status != 'CANCELLED'
       GROUP BY m.id, m.name, c.name
       ORDER BY total_sold DESC
       LIMIT $1`,
      [limit]
    );
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SALES BY CATEGORY
app.get("/admin/reports/sales-by-category", async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    
    let dateFilter = "DATE(o.created_at) = CURRENT_DATE";
    if (period === 'week') dateFilter = "o.created_at >= CURRENT_DATE - INTERVAL '7 days'";
    if (period === 'month') dateFilter = "o.created_at >= CURRENT_DATE - INTERVAL '30 days'";
    
    const result = await pool.query(
      `SELECT 
        c.name as category,
        c.type,
        COUNT(DISTINCT oi.id) as items_sold,
        SUM(oi.price * oi.quantity) as revenue
       FROM order_items oi
       JOIN menu_items m ON oi.menu_item_id = m.id
       JOIN categories c ON m.category_id = c.id
       JOIN orders o ON oi.order_id = o.id
       WHERE ${dateFilter} AND o.status != 'CANCELLED'
       GROUP BY c.id, c.name, c.type
       ORDER BY revenue DESC`
    );
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});