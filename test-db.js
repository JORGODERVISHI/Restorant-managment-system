// TEST DATABASE CONNECTION
// Vendose këtë në folderin Restaurant_Backend dhe ekzekuto: node test-db.js

const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "Restaurant_System",
  password: "Jorgo123.",
  port: 5432,
});

async function testDatabase() {
  console.log("🔗 Testing database connection...\n");

  try {
    // Test connection
    const testConn = await pool.query("SELECT NOW()");
    console.log("✅ Database connected successfully!");
    console.log("   Server time:", testConn.rows[0].now);
    console.log("");

    // Test categories
    console.log("📂 CATEGORIES:");
    const categories = await pool.query("SELECT * FROM categories ORDER BY type, name");
    console.log(`   Found ${categories.rows.length} categories`);
    categories.rows.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.type})`);
    });
    console.log("");

    // Test menu items
    console.log("🍽️  MENU ITEMS:");
    const menuItems = await pool.query("SELECT * FROM menu_items WHERE is_available = true ORDER BY category_id LIMIT 10");
    console.log(`   Found ${menuItems.rows.length} available items (showing first 10)`);
    menuItems.rows.forEach(item => {
      console.log(`   - ${item.name}: €${item.price}`);
    });
    console.log("");

    // Test tables
    console.log("🏓 TABLES:");
    const tables = await pool.query("SELECT * FROM tables ORDER BY table_number");
    console.log(`   Found ${tables.rows.length} tables`);
    tables.rows.forEach(table => {
      console.log(`   - Table ${table.table_number}: ${table.status}`);
    });
    console.log("");

    // Summary
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ DATABASE IS READY!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Total Categories: ${categories.rows.length}`);
    console.log(`Total Menu Items: ${menuItems.rows.length}`);
    console.log(`Total Tables: ${tables.rows.length}`);
    console.log("");

    pool.end();

  } catch (error) {
    console.error("❌ DATABASE ERROR:", error.message);
    console.log("");
    console.log("TROUBLESHOOTING:");
    console.log("1. Check if PostgreSQL is running");
    console.log("2. Verify database name: Restaurant_System");
    console.log("3. Check password: Jorgo123.");
    console.log("4. Ensure tables exist");
    pool.end();
  }
}

testDatabase();