// ═══════════════════════════════════════════════════════════
// WAITER PANEL - ULTIMATE WITH PRINT RECEIPT
// ═══════════════════════════════════════════════════════════

const { useState, useEffect } = React;
const API = 'http://localhost:3000';
const socket = io(API);

// ✨ RECEIPT GENERATOR FUNCTION
function generateReceiptHTML(session, orders) {
  const now = new Date();
  const date = now.toLocaleDateString('sq-AL');
  const time = now.toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' });
  
  const subtotal = orders.reduce((sum, order) => {
    if (order.status === 'CANCELLED') return sum;
    return sum + parseFloat(order.total_price || 0);
  }, 0);
  
  const tax = subtotal * 0.20;
  const total = subtotal + tax;
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Faturë - Tavolina ${session.table_number}</title>
  <style>
    @media print { @page { margin: 0; } body { margin: 1cm; } }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Courier New', monospace; 
      font-size: 12pt; 
      line-height: 1.4; 
      max-width: 80mm; 
      margin: 0 auto; 
      padding: 10mm; 
    }
    .receipt { border: 2px solid #000; padding: 5mm; }
    .header { 
      text-align: center; 
      border-bottom: 2px dashed #000; 
      padding-bottom: 5mm; 
      margin-bottom: 5mm; 
    }
    .header h1 { font-size: 18pt; font-weight: bold; margin-bottom: 2mm; }
    .header p { font-size: 10pt; margin: 1mm 0; }
    .info { margin-bottom: 5mm; font-size: 11pt; }
    .info-row { 
      display: flex; 
      justify-content: space-between; 
      margin: 1mm 0; 
    }
    .items { 
      border-top: 1px solid #000; 
      border-bottom: 1px solid #000; 
      padding: 3mm 0; 
      margin: 5mm 0; 
    }
    .item { 
      display: flex; 
      justify-content: space-between; 
      margin: 2mm 0; 
      font-size: 10pt;
    }
    .item-name { flex: 1; }
    .item-qty { width: 30mm; text-align: right; }
    .item-price { width: 25mm; text-align: right; font-weight: bold; }
    .totals { 
      margin-top: 5mm; 
      border-top: 2px solid #000; 
      padding-top: 3mm; 
    }
    .total-row { 
      display: flex; 
      justify-content: space-between; 
      margin: 2mm 0; 
      font-size: 11pt; 
    }
    .total-row.grand { 
      font-size: 14pt; 
      font-weight: bold; 
      border-top: 2px dashed #000; 
      padding-top: 3mm; 
      margin-top: 3mm; 
    }
    .footer { 
      text-align: center; 
      margin-top: 5mm; 
      padding-top: 5mm; 
      border-top: 2px dashed #000; 
      font-size: 10pt; 
    }
    @media screen { 
      body { background: #f5f5f5; padding: 20px; } 
      .receipt { background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); } 
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>RESTAURANT</h1>
      <p>Tiranë, Shqipëri</p>
      <p>Tel: +355 XX XXX XXX</p>
    </div>
    
    <div class="info">
      <div class="info-row">
        <span><strong>Tavolina:</strong></span>
        <span>${session.table_number}</span>
      </div>
      <div class="info-row">
        <span><strong>Data:</strong></span>
        <span>${date}</span>
      </div>
      <div class="info-row">
        <span><strong>Ora:</strong></span>
        <span>${time}</span>
      </div>
      <div class="info-row">
        <span><strong>Session:</strong></span>
        <span>#${session.session_code || session.id}</span>
      </div>
    </div>
    
    <div class="items">
      <div class="item" style="font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2mm; margin-bottom: 3mm;">
        <div class="item-name">Artikulli</div>
        <div class="item-qty">Sasia</div>
        <div class="item-price">Çmimi</div>
      </div>
      ${orders.filter(order => order.status !== 'CANCELLED').map(order => 
        order.items ? order.items.map(item => `
          <div class="item">
            <div class="item-name">${item.name || 'Item'}</div>
            <div class="item-qty">${item.quantity}x €${parseFloat(item.price).toFixed(2)}</div>
            <div class="item-price">€${(item.quantity * item.price).toFixed(2)}</div>
          </div>
        `).join('') : ''
      ).join('')}
    </div>
    
    <div class="totals">
      <div class="total-row">
        <span>Subtotal:</span>
        <span>€${subtotal.toFixed(2)}</span>
      </div>
      <div class="total-row">
        <span>TVSH (20%):</span>
        <span>€${tax.toFixed(2)}</span>
      </div>
      <div class="total-row grand">
        <span>TOTAL:</span>
        <span>€${total.toFixed(2)}</span>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Faleminderit!</strong></p>
      <p>Ju presim përsëri!</p>
    </div>
  </div>
  
  <script>
    window.onload = function() {
      // Trigger print
      window.print();
      
      // Close window after print (multiple fallbacks)
      window.onafterprint = function() { 
        setTimeout(() => window.close(), 100);
      };
      
      // Fallback: close after 2 seconds regardless
      setTimeout(() => {
        window.close();
      }, 2000);
      
      // Listen for Esc key to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') window.close();
      });
    };
  </script>
</body>
</html>`;
}

// ✨ PRINT RECEIPT FUNCTION
function printReceipt(session, orders) {
  const receiptHTML = generateReceiptHTML(session, orders);
  const printWindow = window.open('', '_blank', 'width=300,height=600');
  printWindow.document.write(receiptHTML);
  printWindow.document.close();
}

// MAIN WAITER PANEL
function WaiterPanel() {
  const [view, setView] = useState('active');
  const [sessions, setSessions] = useState([]);
  const [closedSessions, setClosedSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionOrders, setSessionOrders] = useState([]);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    
    socket.on('new_kitchen_order', loadData);
    socket.on('new_bar_order', loadData);

    return () => {
      clearInterval(interval);
      socket.off('new_kitchen_order');
      socket.off('new_bar_order');
    };
  }, []);

  const loadData = async () => {
    try {
      const [activeRes, closedRes] = await Promise.all([
        fetch(`${API}/sessions/active`),
        fetch(`${API}/sessions/closed/today`)
      ]);
      
      const activeData = await activeRes.json();
      const closedData = await closedRes.json();
      
      setSessions(activeData);
      setClosedSessions(closedData);
      setLoading(false);
    } catch(e) {
      console.error('Error:', e);
      setLoading(false);
    }
  };

  const viewBill = async (sessionId) => {
    try {
      const res = await fetch(`${API}/sessions/${sessionId}/orders`);
      const data = await res.json();
      setSessionOrders(data);
      setSelectedSession(sessionId);
    } catch(e) {
      console.error('Error:', e);
    }
  };

  const closeSession = async (sessionId) => {
    if (!confirm('Mbyll session dhe faturën?')) return;
    
    try {
      const res = await fetch(`${API}/sessions/${sessionId}/close`, {method: 'POST'});
      if (res.ok) {
        alert('Session u mbyll!');
        setSelectedSession(null);
        setSessionOrders([]);
        loadData();
      }
    } catch(e) {
      alert('Gabim');
    }
  };

  const closeAndPrint = async (sessionId) => {
    // First get session and orders for printing
    const session = sessions.find(s => s.id === sessionId);
    try {
      const res = await fetch(`${API}/sessions/${sessionId}/orders`);
      const orders = await res.json();
      
      // Print first
      printReceipt(session, orders);
      
      // Then close session after 1 second delay
      setTimeout(async () => {
        const closeRes = await fetch(`${API}/sessions/${sessionId}/close`, {method: 'POST'});
        if (closeRes.ok) {
          alert('Session u mbyll!');
          setSelectedSession(null);
          setSessionOrders([]);
          loadData();
        }
      }, 1000);
    } catch(e) {
      console.error('Error:', e);
      alert('Gabim');
    }
  };

  const totalToday = closedSessions.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
  const totalActive = sessions.reduce((sum, s) => sum + parseFloat(s.current_total || 0), 0);
  const grandTotal = totalToday + totalActive;

  if (loading) return <div className="loading">Po ngarkohet...</div>;

  return (
    <>
      <header className="header">
        <h1>👨‍🍳 Waiter Panel</h1>
        <div className="header-actions">
          <button className="btn-new-order" onClick={() => setShowNewOrderModal(true)}>
            + Porosi e Re
          </button>
        </div>
      </header>

      <nav className="nav-tabs">
        <button 
          className={view === 'active' ? 'active' : ''} 
          onClick={() => setView('active')}
        >
          🟢 Aktive ({sessions.length})
        </button>
        <button 
          className={view === 'history' ? 'active' : ''} 
          onClick={() => setView('history')}
        >
          📋 Historiku ({closedSessions.length})
        </button>
        <button 
          className={view === 'shift' ? 'active' : ''} 
          onClick={() => setView('shift')}
        >
          💰 Turni
        </button>
      </nav>

      <div className="container">
        {view === 'active' && (
          <ActiveView 
            sessions={sessions}
            onViewBill={viewBill}
            onAddItems={(sessionId) => {
              setSelectedSession(sessionId);
              setShowAddItemsModal(true);
            }}
            onCloseAndPrint={closeAndPrint}
          />
        )}

        {view === 'history' && (
          <HistoryView 
            sessions={closedSessions}
            onViewBill={viewBill}
            onPrint={async (sessionId) => {
              // Get session and orders for printing
              const session = closedSessions.find(s => s.id === sessionId);
              try {
                const res = await fetch(`${API}/sessions/${sessionId}/orders`);
                const orders = await res.json();
                printReceipt(session, orders);
              } catch(e) {
                console.error('Print error:', e);
              }
            }}
          />
        )}

        {view === 'shift' && (
          <ShiftView 
            activeSessions={sessions}
            closedSessions={closedSessions}
            totalActive={totalActive}
            totalClosed={totalToday}
            grandTotal={grandTotal}
          />
        )}
      </div>

      {selectedSession && !showAddItemsModal && (
        <BillModal 
          orders={sessionOrders}
          session={sessions.find(s => s.id === selectedSession) || closedSessions.find(s => s.id === selectedSession)}
          onClose={() => setSelectedSession(null)}
          onPrint={() => {
            const session = sessions.find(s => s.id === selectedSession) || closedSessions.find(s => s.id === selectedSession);
            printReceipt(session, sessionOrders);
          }}
        />
      )}

      {showNewOrderModal && (
        <NewOrderModal 
          onClose={() => setShowNewOrderModal(false)}
          onSuccess={() => {
            setShowNewOrderModal(false);
            loadData();
          }}
        />
      )}

      {showAddItemsModal && (
        <AddItemsModal
          sessionId={selectedSession}
          onClose={() => {
            setShowAddItemsModal(false);
            setSelectedSession(null);
          }}
          onSuccess={() => {
            setShowAddItemsModal(false);
            setSelectedSession(null);
            loadData();
          }}
        />
      )}
    </>
  );
}

function ActiveView({ sessions, onViewBill, onAddItems, onCloseAndPrint }) {
  if (sessions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <p>Nuk ka tavolina aktive</p>
      </div>
    );
  }

  return (
    <div className="sessions-grid">
      {sessions.map(s => (
        <SessionCard 
          key={s.id} 
          session={s} 
          onViewBill={() => onViewBill(s.id)}
          onAddItems={() => onAddItems(s.id)}
          onCloseAndPrint={() => onCloseAndPrint(s.id)}
        />
      ))}
    </div>
  );
}

function HistoryView({ sessions, onViewBill, onPrint }) {
  if (sessions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <p>Nuk ka fatura të mbyllura sot</p>
      </div>
    );
  }

  return (
    <div className="history-list">
      {sessions.map(s => (
        <div key={s.id} className="history-item">
          <div className="history-header">
            <div>
              <h3>🏓 Tavolina {s.table_number}</h3>
              <span className="history-time">
                {new Date(s.opened_at).toLocaleTimeString()} - {new Date(s.closed_at).toLocaleTimeString()}
              </span>
            </div>
            <div className="history-total">€{parseFloat(s.total_amount).toFixed(2)}</div>
          </div>
          <div className="history-meta">
            <span>{s.order_count || 0} porosi</span>
            <span>•</span>
            <span>{Math.floor((new Date(s.closed_at) - new Date(s.opened_at)) / 60000)} min</span>
          </div>
          <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.5rem'}}>
            <button className="btn-view-small" onClick={() => onViewBill(s.id)}>
              Shiko Detajet
            </button>
            <button 
              className="btn-print-small" 
              onClick={() => onPrint(s.id)}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              🖨️ Print
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ShiftView({ activeSessions, closedSessions, totalActive, totalClosed, grandTotal }) {
  const printShift = () => {
    window.print();
  };

  return (
    <div className="shift-summary">
      <div className="shift-header">
        <h2>📊 Përmbledhje e Turnit</h2>
        <button className="btn-print" onClick={printShift}>🖨️ Print</button>
      </div>

      <div className="shift-stats">
        <div className="shift-stat-card active">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <div className="stat-label">Sessions Aktive</div>
            <div className="stat-value">{activeSessions.length}</div>
            <div className="stat-amount">€{totalActive.toFixed(2)}</div>
          </div>
        </div>

        <div className="shift-stat-card closed">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-label">Fatura të Mbyllura</div>
            <div className="stat-value">{closedSessions.length}</div>
            <div className="stat-amount">€{totalClosed.toFixed(2)}</div>
          </div>
        </div>

        <div className="shift-stat-card total">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <div className="stat-label">Totali i Ditës</div>
            <div className="stat-value">{activeSessions.length + closedSessions.length}</div>
            <div className="stat-amount">€{grandTotal.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="shift-details">
        <h3>Detajet e Faturave të Mbyllura</h3>
        <table className="shift-table">
          <thead>
            <tr>
              <th>Tavolina</th>
              <th>Hapur</th>
              <th>Mbyllur</th>
              <th>Kohëzgjatja</th>
              <th>Totali</th>
            </tr>
          </thead>
          <tbody>
            {closedSessions.map(s => (
              <tr key={s.id}>
                <td>Tavolina {s.table_number}</td>
                <td>{new Date(s.opened_at).toLocaleTimeString()}</td>
                <td>{new Date(s.closed_at).toLocaleTimeString()}</td>
                <td>{Math.floor((new Date(s.closed_at) - new Date(s.opened_at)) / 60000)} min</td>
                <td>€{parseFloat(s.total_amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="4"><strong>TOTAL:</strong></td>
              <td><strong>€{totalClosed.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function SessionCard({ session, onViewBill, onAddItems, onCloseAndPrint }) {
  const duration = Math.floor((new Date() - new Date(session.opened_at)) / 60000);
  
  return (
    <div className="session-card">
      <div className="session-header">
        <h3>🏓 Tavolina {session.table_number}</h3>
        <span className="session-badge">{session.order_count} porosi</span>
      </div>
      
      <div className="session-stats">
        <div className="stat-item">
          <span className="stat-label">Kohëzgjatja</span>
          <span className="stat-value">{duration} min</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Totali</span>
          <span className="stat-value">€{parseFloat(session.current_total).toFixed(2)}</span>
        </div>
      </div>

      <div className="session-actions">
        <button className="btn btn-view" onClick={onViewBill}>Fatura</button>
        <button className="btn btn-add" onClick={onAddItems}>+ Shto</button>
        <button 
          className="btn btn-close-print" 
          onClick={onCloseAndPrint}
          style={{
            background: '#10b981',
            color: 'white',
            flex: 1
          }}
        >
          🖨️ Mbyll & Print
        </button>
      </div>
    </div>
  );
}

function BillModal({ orders, session, onClose, onPrint }) {
  const total = orders.reduce((sum, o) => {
    if (o.status === 'CANCELLED') return sum;
    return sum + parseFloat(o.total_price || 0);
  }, 0);
  
  const cancelOrder = async (orderId) => {
    if (!confirm('Anulo porosinë? Stoku do të rikthehet.')) return;
    
    try {
      const res = await fetch(`${API}/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({user_id: 1})
      });
      
      if (res.ok) {
        alert('Porosia u anulua!');
        window.location.reload();
      }
    } catch(e) {
      alert('Gabim');
    }
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Fatura - Tavolina {session?.table_number}</h2>
          <button className="btn-close-modal" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {orders.map(order => (
            <div key={order.id} className="bill-order">
              <div className="bill-order-header">
                <span>Porosi #{order.id}</span>
                <span className={`order-status ${order.status === 'CANCELLED' ? 'cancelled' : ''}`}>
                  {order.status}
                </span>
              </div>
              <div className="bill-items">
                {order.items && order.items.map((item, i) => (
                  <div key={i} className="bill-item">
                    <span className="item-detail">{item.quantity}x {item.name}</span>
                    <span className="item-price">€{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="order-subtotal">
                Subtotal: €{parseFloat(order.total_price).toFixed(2)}
                {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && (
                  <button 
                    className="btn-cancel-order" 
                    onClick={() => cancelOrder(order.id)}
                  >
                    🛑 Anulo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <div className="total-line">
            <span className="total-label">TOTAL:</span>
            <span className="total-amount">€{total.toFixed(2)}</span>
          </div>
          <button 
            className="btn btn-print-modal" 
            onClick={onPrint}
            style={{
              background: '#10b981',
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '1rem',
              width: '100%'
            }}
          >
            🖨️ Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

function NewOrderModal({ onClose, onSuccess }) {
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetch(`${API}/tables`).then(r => r.json()).then(setTables);
    fetch(`${API}/menu_items`).then(r => r.json()).then(setMenuItems);
  }, []);

  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? {...c, quantity: c.quantity + 1} : c));
    } else {
      setCart([...cart, {...item, quantity: 1}]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(c => c.id === id ? {...c, quantity: Math.max(0, c.quantity + delta)} : c).filter(c => c.quantity > 0));
  };

  const handleSubmit = async () => {
    if (!selectedTable || !cart.length) return alert('Zgjedh tavolinë dhe produkte');
    try {
      const sessRes = await fetch(`${API}/tables/${selectedTable}/session`);
      const sessData = await sessRes.json();
      let sessionId = sessData.session?.id;
      if (!sessData.exists) {
        const openRes = await fetch(`${API}/sessions/open`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({table_id: selectedTable})
        });
        const openData = await openRes.json();
        sessionId = openData.session.id;
      }
      const orderRes = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          table_id: selectedTable,
          user_id: 1,
          session_id: sessionId,
          items: cart.map(c => ({menu_item_id: c.id, quantity: c.quantity}))
        })
      });
      if (orderRes.ok) {
        alert('Porosia u shtua!');
        onSuccess();
      }
    } catch(e) {
      alert('Gabim');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Porosi e Re</h2>
          <button className="btn-close-modal" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-section">
            <label>Tavolina:</label>
            <select value={selectedTable || ''} onChange={e => setSelectedTable(parseInt(e.target.value))}>
              <option value="">Zgjedh tavolinë</option>
              {tables.map(t => (
                <option key={t.id} value={t.id}>Tavolina {t.table_number}</option>
              ))}
            </select>
          </div>
          <div className="menu-section">
            <h3>Produktet:</h3>
            <div className="menu-grid-small">
              {menuItems.map(item => (
                <div key={item.id} className="menu-item-small" onClick={() => addToCart(item)}>
                  <span>{item.name}</span>
                  <span>€{parseFloat(item.price).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
          {cart.length > 0 && (
            <div className="cart-section">
              <h3>Shporta:</h3>
              {cart.map(item => (
                <div key={item.id} className="cart-item-inline">
                  <span>{item.name}</span>
                  <div className="qty-controls-inline">
                    <button onClick={() => updateQty(item.id, -1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, 1)}>+</button>
                  </div>
                  <span>€{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-submit" onClick={handleSubmit}>Konfirmo Porosinë</button>
        </div>
      </div>
    </div>
  );
}

function AddItemsModal({ sessionId, onClose, onSuccess }) {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    fetch(`${API}/menu_items`).then(r => r.json()).then(setMenuItems);
    fetch(`${API}/sessions/active`).then(r => r.json()).then(data => {
      const sess = data.find(s => s.id === sessionId);
      setSessionInfo(sess);
    });
  }, []);

  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? {...c, quantity: c.quantity + 1} : c));
    } else {
      setCart([...cart, {...item, quantity: 1}]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(c => c.id === id ? {...c, quantity: Math.max(0, c.quantity + delta)} : c).filter(c => c.quantity > 0));
  };

  const handleSubmit = async () => {
    if (!cart.length) return alert('Shto produkte');
    try {
      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          table_id: sessionInfo.table_id,
          user_id: 1,
          session_id: sessionId,
          items: cart.map(c => ({menu_item_id: c.id, quantity: c.quantity}))
        })
      });
      if (res.ok) {
        alert('Produktet u shtuan!');
        onSuccess();
      }
    } catch(e) {
      alert('Gabim');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Shto Produkte - Tavolina {sessionInfo?.table_number}</h2>
          <button className="btn-close-modal" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="menu-section">
            <h3>Produktet:</h3>
            <div className="menu-grid-small">
              {menuItems.map(item => (
                <div key={item.id} className="menu-item-small" onClick={() => addToCart(item)}>
                  <span>{item.name}</span>
                  <span>€{parseFloat(item.price).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
          {cart.length > 0 && (
            <div className="cart-section">
              <h3>Shporta:</h3>
              {cart.map(item => (
                <div key={item.id} className="cart-item-inline">
                  <span>{item.name}</span>
                  <div className="qty-controls-inline">
                    <button onClick={() => updateQty(item.id, -1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, 1)}>+</button>
                  </div>
                  <span>€{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-submit" onClick={handleSubmit}>Shto në Porosi</button>
        </div>
      </div>
    </div>
  );
}

ReactDOM.render(<WaiterPanel />, document.getElementById('root'));