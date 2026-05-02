// ═══════════════════════════════════════════
//  KIOSK APP — Restaurant Self-Ordering
// ═══════════════════════════════════════════

const { useState, useEffect } = React;

const API_URL = 'http://localhost:3000';

const categoryEmojis = {
  'Antipasta': '🧀',
  'Mishra': '🥩',
  'Embelsira': '🍰',
  'Sallata': '🥗',
  'Pije Alkolike': '🍷',
  'Pije Freskuese': '🥤',
  'Birra': '🍺',
  'Verera': '🍷',
  'Verëra': '🍷',
  'Uje': '💧',
  'Ujë': '💧'
};

function KioskApp() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTable, setSelectedTable] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [catRes, prodRes, tablesRes] = await Promise.all([
        fetch(`${API_URL}/categories`),
        fetch(`${API_URL}/menu_items`),
        fetch(`${API_URL}/tables`)
      ]);

      if (!catRes.ok || !prodRes.ok || !tablesRes.ok) {
        throw new Error('Failed to load data');
      }

      const [categoriesData, productsData, tablesData] = await Promise.all([
        catRes.json(),
        prodRes.json(),
        tablesRes.json()
      ]);

      setCategories(categoriesData);
      setProducts(productsData);
      setTables(tablesData);
      setFilteredProducts(productsData);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleReservationCode = async () => {
    const code = prompt('Fusni kodin e rezervimit (4 shifra):');
    
    if (!code) return;
    
    try {
      const res = await fetch(`${API_URL}/reservations/verify-code`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ reservation_code: code })
      });
      const data = await res.json();
      
      if (data.valid) {
        // Seat the reservation
        const seatRes = await fetch(`${API_URL}/reservations/${data.reservation.id}/seat`, {
          method: 'POST'
        });
        const seatData = await seatRes.json();
        
        setSelectedTable(data.reservation.table_id);
        setCurrentSession(seatData.session);
        
        alert(
          `✅ Rezervimi u konfirmua!\n\n` +
          `📍 Tavolina: ${data.reservation.table_number}\n` +
          `👤 Emri: ${data.reservation.customer_name}\n\n` +
          `Tani mund të porosisni!`
        );
        
        setToast(`Mirë se vini! Filloni porosinë.`);
        
        // Reload tables
        const tablesRes = await fetch(`${API_URL}/tables`);
        const tablesData = await tablesRes.json();
        setTables(tablesData);
        
      } else {
        alert('❌ Kod rezervimi i gabuar ose i skaduar!');
      }
    } catch(e) {
      console.error('Reservation error:', e);
      alert('Gabim në verifikimin e rezervimit');
    }
  };

  const selectTable = async (tableId) => {
    const table = tables.find(t => t.id === tableId);
    
    // CASE 1: OCCUPIED table (session aktiv)
    if (table.status === 'occupied') {
      const code = prompt(
        `Tavolina ${table.table_number} është e ZËNË.\n\n` +
        `Nëse jeni pjesë e grupit që ka një session aktiv,\n` +
        `fusni kodin e sesionit (4 shifra):`
      );
      
      if (!code) {
        setToast(`Tavolina ${table.table_number} është e zënë. Zgjidhni një tjetër.`);
        setSelectedTable(null); // CLEAR selection
        return;
      }
      
      // Verify session code
      try {
        const res = await fetch(`${API_URL}/sessions/verify-code`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ table_id: tableId, session_code: code })
        });
        const data = await res.json();
        
        if (data.valid) {
          setSelectedTable(tableId);
          setCurrentSession(data.session);
          setToast(`✓ Kodi u verifikua! U lidhët me sesionin ekzistues.`);
        } else {
          alert('❌ Kod sesioni i gabuar!');
          setSelectedTable(null); // CLEAR selection
          return;
        }
      } catch(e) {
        console.error('Code verification error:', e);
        alert('Gabim në verifikimin e kodit');
        setSelectedTable(null); // CLEAR selection
        return;
      }
    }
    // CASE 2: FREE table — VETËM selekto, MOS hap session
    else {
      setSelectedTable(tableId);
      setToast(`Tavolina ${table.table_number} u zgjodh. Shtoni produkte në cart.`);
      // Session do të hapet kur porosia vendoset
    }
  };

  const filterByCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.category_id === categoryId));
    }
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  const handleCheckout = async () => {
    if (!cart.length || !selectedTable) return;

    // Kontrollo nëse tavolina është OCCUPIED por nuk kemi session
    const table = tables.find(t => t.id === selectedTable);
    if (table?.status === 'occupied' && !currentSession) {
      alert('❌ Ju duhet të verifikoni kodin e sesionit për këtë tavolinë!');
      setSelectedTable(null);
      setCart([]);
      return;
    }

    try {
      let sessionId = currentSession?.id;
      
      // Nëse nuk ka session (tavolinë FREE e sapo zgjedhur), hape tani
      if (!sessionId) {
        const sessionRes = await fetch(`${API_URL}/sessions/open`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({table_id: selectedTable})
        });
        const sessionData = await sessionRes.json();
        setCurrentSession(sessionData.session);
        sessionId = sessionData.session.id;
        
        // Shfaq kodin e sesionit
        alert(
          `✅ Session u hap me porosinë tuaj!\n\n` +
          `🔐 Kodi i Sesionit: ${sessionData.session.session_code}\n\n` +
          `⚠️ RËNDËSISHME: Ruajeni këtë kod!\n` +
          `Anëtarët e tjerë të grupit mund ta përdorin për të shtuar porosi.`
        );
      }

      const orderData = {
        table_id: selectedTable,
        user_id: 1,
        session_id: sessionId,
        items: cart.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity
        }))
      };

      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!res.ok) throw new Error('Order failed');

      const result = await res.json();
      setToast(`✓ Porosia u dërgua! Total: €${result.total.toFixed(2)}`);
      setCart([]);
      setIsCartOpen(false);
      
      // Reload tables to show updated status (OCCUPIED)
      const tablesRes = await fetch(`${API_URL}/tables`);
      const tablesData = await tablesRes.json();
      setTables(tablesData);
      
      setTimeout(() => setToast(''), 4000);
    } catch (error) {
      alert('Gabim në dërgimin e porosisë');
    }
  };

  if (loading) return React.createElement('div', { className: 'loading' }, 'Loading...');
  
  if (error) return React.createElement('div', { className: 'error' },
    React.createElement('div', { className: 'error-icon' }, '⚠'),
    React.createElement('h2', null, 'Connection Error'),
    React.createElement('p', null, error),
    React.createElement('button', {
      onClick: fetchData,
      style: { marginTop: '1rem', padding: '0.75rem 1.5rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }
    }, 'Retry')
  );

  return React.createElement(React.Fragment, null,
    toast && React.createElement('div', { className: 'toast' }, toast),

    React.createElement('header', { className: 'header' },
      React.createElement('div', { className: 'header-content' },
        React.createElement('div', { className: 'logo' }, 'Restaurant System'),
        React.createElement('div', { className: 'header-info' },
          selectedTable && React.createElement('div', { className: 'selected-table-badge' },
            'Table ', tables.find(t => t.id === selectedTable)?.table_number
          )
        )
      )
    ),

    React.createElement('div', { className: 'container' },
      React.createElement('section', { className: 'section' },
        React.createElement('h2', { className: 'section-title' }, 'Select Table'),
        
        React.createElement('div', { style: {textAlign: 'center', marginBottom: '2rem'} },
          React.createElement('button', {
            className: 'btn-reservation',
            onClick: handleReservationCode,
            style: {
              background: '#3b82f6',
              color: 'white',
              padding: '1rem 2rem',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }
          }, '📅 Kam Rezervim')
        ),
        
        React.createElement('div', { className: 'table-grid' },
          tables.map(table =>
            React.createElement('button', {
              key: table.id,
              className: `table-btn ${selectedTable === table.id ? 'selected' : ''} ${
                table.status === 'occupied' ? 'occupied' : 
                table.status === 'reserved' ? 'reserved' : ''
              }`,
              onClick: () => selectTable(table.id),
              disabled: table.status === 'reserved'
            },
              'Table ', table.table_number,
              React.createElement('div', { className: 'table-status' },
                table.status === 'occupied' ? '👥 Occupied' : 
                table.status === 'reserved' ? '📅 Reserved' :
                '✓ Available'
              )
            )
          )
        )
      ),

      React.createElement('section', { className: 'section' },
        React.createElement('h2', { className: 'section-title' }, 'Menu'),
        React.createElement('div', { className: 'categories' },
          React.createElement('button', {
            className: `category-btn ${selectedCategory === 'all' ? 'active' : ''}`,
            onClick: () => filterByCategory('all')
          },
            'All ',
            React.createElement('span', { className: 'category-count' }, `(${products.length})`)
          ),
          categories.map(cat =>
            React.createElement('button', {
              key: cat.id,
              className: `category-btn ${selectedCategory === cat.id ? 'active' : ''}`,
              onClick: () => filterByCategory(cat.id)
            },
              categoryEmojis[cat.name] || '🍴', ' ', cat.name,
              React.createElement('span', { className: 'category-count' },
                `(${products.filter(p => p.category_id === cat.id).length})`
              )
            )
          )
        )
      ),

      React.createElement('div', { className: 'products-grid' },
        filteredProducts.map(product => {
          const category = categories.find(c => c.id === product.category_id);
          const isOutOfStock = !product.in_stock || product.quantity_in_stock <= 0;
          
          return React.createElement('div', { 
            key: product.id, 
            className: `product-card ${isOutOfStock ? 'out-of-stock' : ''}` 
          },
            React.createElement('div', { className: 'product-image' },
              categoryEmojis[category?.name] || '🍴'
            ),
            React.createElement('div', { className: 'product-info' },
              React.createElement('h3', { className: 'product-name' }, product.name),
              React.createElement('p', { className: 'product-description' }, product.description),
              isOutOfStock && React.createElement('div', { className: 'out-of-stock-badge' }, '⚠️ Out of Stock'),
              React.createElement('div', { className: 'product-footer' },
                React.createElement('span', { className: 'product-price' }, `€${parseFloat(product.price).toFixed(2)}`),
                React.createElement('button', {
                  className: 'add-btn',
                  onClick: () => !isOutOfStock && addToCart(product),
                  disabled: isOutOfStock
                }, isOutOfStock ? 'Unavailable' : 'Add')
              )
            )
          );
        })
      )
    ),

    React.createElement('button', {
      className: 'cart-fab',
      onClick: () => setIsCartOpen(true)
    },
      '🛒',
      cart.length > 0 && React.createElement('span', { className: 'cart-badge' }, cart.length)
    ),

    React.createElement('div', {
      className: `overlay ${isCartOpen ? 'active' : ''}`,
      onClick: () => setIsCartOpen(false)
    }),

    React.createElement('div', { className: `cart-sidebar ${isCartOpen ? 'open' : ''}` },
      React.createElement('div', { className: 'cart-header' },
        React.createElement('h2', null, 'Your Order'),
        React.createElement('button', {
          className: 'close-btn',
          onClick: () => setIsCartOpen(false)
        }, '×')
      ),

      React.createElement('div', { className: 'cart-items' },
        cart.length === 0 ? (
          React.createElement('div', { className: 'empty-cart' },
            React.createElement('div', { className: 'empty-cart-icon' }, '🛒'),
            React.createElement('p', null, 'Your cart is empty')
          )
        ) : (
          cart.map(item =>
            React.createElement('div', { key: item.id, className: 'cart-item' },
              React.createElement('div', { className: 'cart-item-info' },
                React.createElement('h3', null, item.name),
                React.createElement('p', { className: 'cart-item-price' }, `€${parseFloat(item.price).toFixed(2)}`)
              ),
              React.createElement('div', { className: 'quantity-controls' },
                React.createElement('button', {
                  className: 'qty-btn',
                  onClick: () => updateQuantity(item.id, -1)
                }, '−'),
                React.createElement('span', { className: 'quantity' }, item.quantity),
                React.createElement('button', {
                  className: 'qty-btn',
                  onClick: () => updateQuantity(item.id, 1)
                }, '+')
              )
            )
          )
        )
      ),

      cart.length > 0 && React.createElement('div', { className: 'cart-footer' },
        React.createElement('div', { className: 'cart-total' },
          React.createElement('span', { className: 'cart-total-label' }, 'Total'),
          React.createElement('span', { className: 'cart-total-price' }, `€${cartTotal.toFixed(2)}`)
        ),
        React.createElement('button', {
          className: 'checkout-btn',
          onClick: handleCheckout,
          disabled: !selectedTable
        }, selectedTable ? 'Place Order' : 'Select a Table')
      )
    )
  );
}

ReactDOM.render(React.createElement(KioskApp), document.getElementById('root'));