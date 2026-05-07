// ═══════════════════════════════════════════════════════════
// ADMIN PANEL - COMPLETE & PROFESSIONAL
// ═══════════════════════════════════════════════════════════

const { useState, useEffect } = React;
const API = window.location.port === '5501' ? 'http://localhost:3000' : '';

function AdminPanel() {
  const [view, setView] = useState('dashboard');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (view === 'dashboard') loadDashboard();
  }, [view]);

  const loadDashboard = async () => {
    try {
      const res = await fetch(`${API}/dashboard/stats`);
      setStats(await res.json());
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <div className="admin-layout">
      <Sidebar current={view} onNavigate={setView} />
      <div className="main-content">
        <Header title={getTitleForView(view)} />
        <div className="content-body">
          {view === 'dashboard' && <Dashboard stats={stats} onNavigate={setView} />}
          {view === 'inventory' && <Inventory />}
          {view === 'menu' && <MenuManagement />}
          {view === 'reports' && <Reports />}
          {view === 'settings' && <Settings />}
        </div>
      </div>
    </div>
  );
}

function getTitleForView(view) {
  const titles = {
    dashboard: 'Dashboard',
    inventory: 'Inventory Management',
    menu: 'Menu Management',
    reports: 'Reports & Analytics',
    settings: 'Settings'
  };
  return titles[view] || 'Admin Panel';
}

function Sidebar({ current, onNavigate }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'menu', label: 'Menu' },
    { id: 'reports', label: 'Reports' },
    { id: 'settings', label: 'Settings' }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <h1>Admin Panel</h1>
      </div>
      <nav className="sidebar-nav">
        {items.map(item => (
          <button
            key={item.id}
            className={`nav-btn ${current === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Header({ title }) {
  return (
    <div className="header">
      <h2>{title}</h2>
      <div className="header-date">
        {new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════

function Dashboard({ stats, onNavigate }) {
  if (!stats) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <StatCard title="Today's Sales" value={`€${stats.total_sales?.toFixed(2) || '0.00'}`} />
        <StatCard title="Active Sessions" value={stats.active_sessions || 0} />
        <StatCard title="Active Orders" value={stats.active_orders || 0} />
        <StatCard title="Low Stock Items" value={stats.low_stock_count || 0} />
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-btn" onClick={() => onNavigate('reports')}>
            <div className="action-label">View Reports</div>
            <div className="action-desc">Daily, weekly & monthly reports</div>
          </button>
          <button className="action-btn" onClick={() => onNavigate('menu')}>
            <div className="action-label">Add Product</div>
            <div className="action-desc">Create new menu items</div>
          </button>
          <button className="action-btn" onClick={() => onNavigate('inventory')}>
            <div className="action-label">Manage Inventory</div>
            <div className="action-desc">Adjust stock levels</div>
          </button>
        </div>
      </div>

      {stats.top_products?.length > 0 && (
        <div className="top-products">
          <h3>Top Selling Products</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Sold</th>
              </tr>
            </thead>
            <tbody>
              {stats.top_products.map((p, i) => (
                <tr key={i}>
                  <td>{p.name}</td>
                  <td>{p.sold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════════════════════

function Inventory() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const res = await fetch(`${API}/inventory`);
      setItems(await res.json());
    } catch(e) {
      console.error(e);
    }
  };

  const handleAdjust = async (quantity, notes) => {
    try {
      await fetch(`${API}/inventory/adjust`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          menu_item_id: selectedItem.menu_item_id,
          quantity: parseInt(quantity),
          notes,
          user_id: 1
        })
      });
      setSelectedItem(null);
      loadInventory();
    } catch(e) {
      alert('Error');
    }
  };

  return (
    <div className="inventory">
      <table className="data-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Min Stock</th>
            <th>Unit</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const status = item.quantity_in_stock <= 0 ? 'out' : 
                          item.quantity_in_stock <= item.minimum_stock ? 'low' : 'ok';
            return (
              <tr key={item.id}>
                <td>{item.item_name}</td>
                <td>{item.category_name}</td>
                <td>{item.quantity_in_stock}</td>
                <td>{item.minimum_stock}</td>
                <td>{item.unit}</td>
                <td><span className={`badge ${status}`}>{status.toUpperCase()}</span></td>
                <td>
                  <button className="btn-sm" onClick={() => setSelectedItem(item)}>Adjust</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {selectedItem && (
        <AdjustModal 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)}
          onSave={handleAdjust}
        />
      )}
    </div>
  );
}

function AdjustModal({ item, onClose, onSave }) {
  const [qty, setQty] = useState('0');
  const [notes, setNotes] = useState('');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Adjust Stock - {item.item_name}</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p>Current: <strong>{item.quantity_in_stock} {item.unit}</strong></p>
          <div className="form-group">
            <label>Quantity (+/-)</label>
            <input type="number" value={qty} onChange={e => setQty(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <p>New: <strong>{item.quantity_in_stock + parseInt(qty || 0)} {item.unit}</strong></p>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-success" onClick={() => onSave(qty, notes)}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MENU MANAGEMENT
// ═══════════════════════════════════════════════════════════

function MenuManagement() {
  const [tab, setTab] = useState('products');

  return (
    <div className="menu-management">
      <div className="tabs">
        <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>
          Products
        </button>
        <button className={tab === 'categories' ? 'active' : ''} onClick={() => setTab('categories')}>
          Categories
        </button>
      </div>
      {tab === 'products' && <Products />}
      {tab === 'categories' && <Categories />}
    </div>
  );
}

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [p, c] = await Promise.all([
      fetch(`${API}/menu_items`).then(r => r.json()),
      fetch(`${API}/categories`).then(r => r.json())
    ]);
    setProducts(p);
    setCategories(c);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    await fetch(`${API}/admin/products/${id}`, {method: 'DELETE'});
    loadData();
  };

  const handleSave = async (data) => {
    const url = editProduct ? `${API}/admin/products/${editProduct.id}` : `${API}/admin/products`;
    const method = editProduct ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    setShowModal(false);
    loadData();
  };

  return (
    <div className="products">
      <div className="section-header">
        <h3>Products</h3>
        <button className="btn-primary" onClick={() => {setEditProduct(null); setShowModal(true);}}>
          Add Product
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.category_name}</td>
              <td>€{parseFloat(p.price).toFixed(2)}</td>
              <td><span className={`badge ${p.in_stock ? 'ok' : 'out'}`}>{p.in_stock ? 'IN' : 'OUT'}</span></td>
              <td>
                <button className="btn-sm" onClick={() => {setEditProduct(p); setShowModal(true);}}>Edit</button>
                <button className="btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <ProductModal 
          product={editProduct}
          categories={categories}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function ProductModal({ product, categories, onClose, onSave }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    category_id: product?.category_id || '',
    minimum_stock: product?.minimum_stock || 10,
    unit: product?.unit || 'copë'
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{product ? 'Edit' : 'Add'} Product</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Price</label>
              <input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
                <option value="">Select...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-success" onClick={() => onSave(form)}>Save</button>
        </div>
      </div>
    </div>
  );
}

function Categories() {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const res = await fetch(`${API}/categories`);
    setCategories(await res.json());
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    try {
      await fetch(`${API}/admin/categories/${id}`, {method: 'DELETE'});
      loadCategories();
    } catch(e) {
      alert('Cannot delete category with products');
    }
  };

  const handleSave = async (data) => {
    const url = editCat ? `${API}/admin/categories/${editCat.id}` : `${API}/admin/categories`;
    const method = editCat ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    setShowModal(false);
    loadCategories();
  };

  return (
    <div className="categories">
      <div className="section-header">
        <h3>Categories</h3>
        <button className="btn-primary" onClick={() => {setEditCat(null); setShowModal(true);}}>
          Add Category
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(c => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td><span className={`badge ${c.type.toLowerCase()}`}>{c.type}</span></td>
              <td>
                <button className="btn-sm" onClick={() => {setEditCat(c); setShowModal(true);}}>Edit</button>
                <button className="btn-sm btn-danger" onClick={() => handleDelete(c.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <CategoryModal 
          category={editCat}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function CategoryModal({ category, onClose, onSave }) {
  const [form, setForm] = useState({
    name: category?.name || '',
    type: category?.type || 'FOOD'
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{category ? 'Edit' : 'Add'} Category</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option value="FOOD">FOOD</option>
              <option value="DRINK">DRINK</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-success" onClick={() => onSave(form)}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════

function Reports() {
  const [period, setPeriod] = useState('today');
  const [data, setData] = useState({ daily: null, top: [], category: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [period]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [daily, top, category] = await Promise.all([
        fetch(`${API}/admin/reports/daily?date=${new Date().toISOString().split('T')[0]}`).then(r => r.json()),
        fetch(`${API}/admin/reports/top-products?period=${period}&limit=10`).then(r => r.json()),
        fetch(`${API}/admin/reports/sales-by-category?period=${period}`).then(r => r.json())
      ]);
      setData({ daily, top, category });
      setLoading(false);
    } catch(e) {
      console.error(e);
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="reports">
      <div className="section-header">
        <h3>Reports</h3>
        <select value={period} onChange={e => setPeriod(e.target.value)} className="period-select">
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {data.daily && (
        <div className="stats-grid">
          <StatCard title="Total Sales" value={`€${parseFloat(data.daily.total_sales || 0).toFixed(2)}`} />
          <StatCard title="Total Orders" value={data.daily.total_orders || 0} />
          <StatCard title="Sessions" value={data.daily.total_sessions || 0} />
        </div>
      )}

      <div className="reports-grid">
        <div className="report-card">
          <h4>Top Products</h4>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.top.length === 0 ? (
                <tr><td colSpan="4" style={{textAlign: 'center'}}>No data</td></tr>
              ) : (
                data.top.map((p, i) => (
                  <tr key={i}>
                    <td>{p.name}</td>
                    <td>{p.category}</td>
                    <td>{p.total_sold}</td>
                    <td>€{parseFloat(p.total_revenue).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="report-card">
          <h4>Sales by Category</h4>
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Type</th>
                <th>Items Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.category.length === 0 ? (
                <tr><td colSpan="4" style={{textAlign: 'center'}}>No data</td></tr>
              ) : (
                data.category.map((c, i) => (
                  <tr key={i}>
                    <td>{c.category}</td>
                    <td><span className={`badge ${c.type.toLowerCase()}`}>{c.type}</span></td>
                    <td>{c.items_sold}</td>
                    <td>€{parseFloat(c.revenue).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════

function Settings() {
  const [tab, setTab] = useState('users');

  return (
    <div className="settings">
      <div className="tabs">
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>
          User Management
        </button>
        <button className={tab === 'tables' ? 'active' : ''} onClick={() => setTab('tables')}>
          Table Management
        </button>
        <button className={tab === 'system' ? 'active' : ''} onClick={() => setTab('system')}>
          System Settings
        </button>
      </div>
      {tab === 'users' && <UserManagement />}
      {tab === 'tables' && <TableManagement />}
      {tab === 'system' && <SystemSettings />}
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState([
    { id: 1, name: 'Admin User', username: 'admin', role: 'admin' },
    { id: 2, name: 'Waiter 1', username: 'waiter1', role: 'waiter' }
  ]);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const handleSave = (data) => {
    if (editUser) {
      setUsers(users.map(u => u.id === editUser.id ? {...u, ...data} : u));
    } else {
      setUsers([...users, {...data, id: Math.max(...users.map(u => u.id)) + 1}]);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (!confirm('Delete?')) return;
    setUsers(users.filter(u => u.id !== id));
  };

  return (
    <div className="user-management">
      <div className="section-header">
        <h3>Users</h3>
        <button className="btn-primary" onClick={() => {setEditUser(null); setShowModal(true);}}>
          Add User
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.username}</td>
              <td><span className={`badge ${u.role}`}>{u.role}</span></td>
              <td>
                <button className="btn-sm" onClick={() => {setEditUser(u); setShowModal(true);}}>Edit</button>
                <button className="btn-sm btn-danger" onClick={() => handleDelete(u.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <UserModal 
          user={editUser}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    username: user?.username || '',
    password: '',
    role: user?.role || 'waiter'
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{user ? 'Edit' : 'Add'} User</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Username</label>
            <input value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder={user ? 'Leave blank to keep' : ''} />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
              <option value="waiter">Waiter</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-success" onClick={() => onSave(form)}>Save</button>
        </div>
      </div>
    </div>
  );
}

function TableManagement() {
  const [tables, setTables] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editTable, setEditTable] = useState(null);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const res = await fetch(`${API}/tables`);
      setTables(await res.json());
    } catch(e) {
      console.error(e);
    }
  };

  const handleSave = async (data) => {
    try {
      const url = editTable ? `${API}/admin/tables/${editTable.id}` : `${API}/admin/tables`;
      const method = editTable ? 'PUT' : 'POST';
      await fetch(url, {
        method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      setShowModal(false);
      loadTables();
    } catch(e) {
      alert('Error saving table');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this table?')) return;
    try {
      await fetch(`${API}/admin/tables/${id}`, {method: 'DELETE'});
      loadTables();
    } catch(e) {
      alert('Cannot delete table');
    }
  };

  const handleFreeTable = async (id) => {
    if (!confirm('Free this table and cancel reservation?')) return;
    try {
      console.log('Freeing table:', id);
      const res = await fetch(`${API}/admin/tables/${id}/free`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
      });
      
      const data = await res.json();
      console.log('Response:', data);
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to free table');
      }
      
      await loadTables();
      alert(`✅ Table freed! ${data.cancelledReservations || 0} reservations cancelled.`);
    } catch(e) {
      console.error('Free table error:', e);
      alert('❌ Error: ' + e.message);
    }
  };

  return (
    <div className="table-management">
      <div className="section-header">
        <h3>Tables</h3>
        <button className="btn-success" onClick={() => {setEditTable(null); setShowModal(true);}}>
          Add Table
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Table Number</th>
            <th>Capacity</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tables.map(t => (
            <tr key={t.id}>
              <td>Table {t.table_number}</td>
              <td>{t.capacity || 4} people</td>
              <td><span className={`badge ${t.status === 'free' ? 'ok' : 'low'}`}>{t.status.toUpperCase()}</span></td>
              <td>
                {t.status === 'reserved' && (
                  <button className="btn-sm btn-warning" onClick={() => handleFreeTable(t.id)}>Free</button>
                )}
                <button className="btn-sm" onClick={() => {setEditTable(t); setShowModal(true);}}>Edit</button>
                <button className="btn-sm btn-danger" onClick={() => handleDelete(t.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <TableModal 
          table={editTable}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function TableModal({ table, onClose, onSave }) {
  const [form, setForm] = useState({
    table_number: table?.table_number || '',
    capacity: table?.capacity || 4
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{table ? 'Edit' : 'Add'} Table</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Table Number</label>
            <input type="number" value={form.table_number} onChange={e => setForm({...form, table_number: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Capacity (people)</label>
            <input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-success" onClick={() => onSave(form)}>Save</button>
        </div>
      </div>
    </div>
  );
}

function SystemSettings() {
  const [settings, setSettings] = useState({
    restaurant_name: 'Restaurant System',
    tax_rate: 20,
    currency: '€',
    opening_time: '10:00',
    closing_time: '23:00'
  });

  useEffect(() => {
    const stored = localStorage.getItem('system_settings');
    if (stored) setSettings(JSON.parse(stored));
  }, []);

  const handleSave = () => {
    localStorage.setItem('system_settings', JSON.stringify(settings));
    alert('Settings saved!');
  };

  return (
    <div className="system-settings">
      <div className="section-header">
        <h3>System Configuration</h3>
      </div>

      <div className="settings-form">
        <div className="form-group">
          <label>Restaurant Name</label>
          <input value={settings.restaurant_name} onChange={e => setSettings({...settings, restaurant_name: e.target.value})} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tax Rate (%)</label>
            <input type="number" step="0.1" value={settings.tax_rate} onChange={e => setSettings({...settings, tax_rate: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Currency</label>
            <input value={settings.currency} onChange={e => setSettings({...settings, currency: e.target.value})} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Opening Time</label>
            <input type="time" value={settings.opening_time} onChange={e => setSettings({...settings, opening_time: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Closing Time</label>
            <input type="time" value={settings.closing_time} onChange={e => setSettings({...settings, closing_time: e.target.value})} />
          </div>
        </div>

        <button className="btn-primary" onClick={handleSave} className="btn-success">Save Settings</button>
      </div>
    </div>
  );
}

ReactDOM.render(<AdminPanel />, document.getElementById('root'));