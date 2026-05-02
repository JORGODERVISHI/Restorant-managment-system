// Bar Display - Minimal Version
const { useState, useEffect } = React;
const API = 'http://localhost:3000';
const socket = io(API);

function BarDisplay() {
  const [orders, setOrders] = useState([]);
  const [notification, setNotification] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // DON'T load all orders on startup - only listen for bar-specific orders
    setLoading(false);

    // Listen for new BAR orders only
    socket.on('new_bar_order', (data) => {
      const newOrder = {
        id: data.order_id,
        table_id: data.table_id,
        status: 'NEW',
        created_at: new Date(),
        items: data.items || []
      };
      setOrders(prev => [newOrder, ...prev]);
      setNotification(`🍺 New Drink Order #${data.order_id} - Table ${data.table_id}`);
      playSound();
      setTimeout(() => setNotification(''), 5000);
    });

    // Listen for cancelled orders
    socket.on('order_cancelled', (data) => {
      setNotification(`🛑 Order #${data.order_id} CANCELLED`);
      setTimeout(() => setNotification(''), 3000);
      
      // Remove immediately
      setOrders(prev => prev.filter(o => o.id !== data.order_id));
    });

    return () => {
      socket.off('new_bar_order');
      socket.off('order_cancelled');
    };
  }, []);

  const playSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltrzxnMpBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0vBSF1xe/glEILElyx6O+nVRUJQJzd8sFuJAUuhM/z1YU2Bhxqvu7mnEoODlOq5O+zYBoGPJPY88p2KwUme8rx3I4+CRZiturqpVITC0mi4PK8aB8GM4nU8tGAMQYfcsLu45ZFDBFZr+fxrV0YCTyU2fPJdisEKIHM8tyJOQcZaLrt56VOEA1MpuHxt2IdBjiP1/PMeS0GI3fH8N2RQAoUXrTp66hVFApGnt/yvmwhBTCG0fPTgjQGHW/A7+OZSA0PVazn77BdGAg+ltrzxnUoBSh+zPLaizsIGGS56+mjTxELTKXh8bllHAU1jdXzz3wvBSF1xe/glEILElux6O+mVRUJPpzd88FuJAUthM/y1oU2Bhxqvu3mnEoPDlOq5O+zYRsGPJLZ88p3KwUme8rx3I4+CRVht+rqpVITC0mh4fK8aiAFM4nU8tGAMQYfccPu45ZFDBFYr+fxrV0YCTuU2fPJdywEKIHM8tyKOQcZZ7vs56VPEA1MpeLxt2IdBjiP1/PMeywGI3fH8N+RQAoUXrTp66hWFApGnt/yv2wiBTCG0fPTgzQGHW/A7eSaRw0PVazm8LBdGAg+ltrzxnUoBSh+zPLaizsIGGS56+mjUBELTKXh8bllHAU1jdXzz3wvBSF1xe/glEILElux6O+mVRUJPpzd88FuJAUthM/y1oU2Bhxqvu3mnEoPDlOq5O+zYRsGO5LZ88p3KwUme8rx3I4+CRVht+rqpVITC0mh4PK8aiAFM4nU8tGAMQYfccPu45ZFDBFYr+fxrV0YCTuU2fPJdywEKIHM8tyKOQcZZ7vs56VPEA1MpeLxt2IdBjiP1/PMeywGI3fH8N+RQAoUXrTp66hWFApGnt/yv2wiBTCG0fPTgzQGHW/A7eSaRw0PVazm8LBdGAg+ltrzxnUoBSh+zPLaizsIGGS56+mjUBELTKXh8bllHAU1jdXzz3wvBSF1xe/glEILElux6O+mVRUJPpzd88FuJAUthM/y1oU2Bhxqvu3mnEoPDlOq5O+zYRsGO5LZ88p3KwUme8rx3I4+CRVht+rqpVITC0mh4PK8aiAFM4nU8tGAMQYfccPu45ZFDBFYr+fxrV0YCTuU2fPJdywEJ4HM8tyKOQcZZ7vs56VPEA1MpeLxt2IdBjiP1/PMeywGI3fH8N+RQAoUXrTp66hWFApGnt/yv2wiBTCG0fPTgzQGHW/A7eSaRw0PVazm8LBdGAg+ltrzxnUoBSh+zPLaizsIGGS56+mjUBELTKXh8bllHAU1jdXzz3wvBSF1xe/glEILElux6O+mVRUJPpzd88FuJAUthM/y1oU2Bhxqvu3mnEoPDlOq5O+zYRsGO5LZ88p3KwUme8rx3I4+CRVht+rqpVITC0mh4PK8aiAFM4nU8tGAMQYfccPu45ZFDBFYr+fxrV0YCTuU2fPJdywEJ4HM8tyKOQcZZ7vs56VPEA1MpeLxt2IdBjiP1/PMeywGI3fH8N+RQAoUXrTp66hWFApGnt/yv2wiBTCG0fPTgzQGHW/A7eSaRw0PVazm8LBdGAg+ltrzxnUoBSh+zPLaizsIGGS56+mjUBELTKXh8bllHAU1jdXzz3wvBSF1xe/glEILElux6O+mVRUJPpzd88FuJAUthM/y1oU2Bhxqvu3mnEo=');
    audio.play().catch(() => {});
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await fetch(`${API}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({status: newStatus})
      });

      setOrders(prev => prev.map(o =>
        o.id === orderId ? {...o, status: newStatus} : o
      ));

      if (newStatus === 'COMPLETED') {
        setTimeout(() => {
          setOrders(prev => prev.filter(o => o.id !== orderId));
        }, 1000);
      }
    } catch (e) {
      console.error('Error:', e);
    }
  };

  const getTimeSince = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes < 1 ? `${seconds}s` : `${minutes}m ${seconds % 60}s`;
  };

  const getTimeClass = (date) => {
    const minutes = Math.floor((new Date() - date) / 1000 / 60);
    if (minutes >= 15) return 'danger';
    if (minutes >= 10) return 'warning';
    return '';
  };

  const byStatus = {
    NEW: orders.filter(o => o.status === 'NEW'),
    PREPARING: orders.filter(o => o.status === 'PREPARING'),
    READY: orders.filter(o => o.status === 'READY')
  };

  // Auto-refresh timers
  useEffect(() => {
    const interval = setInterval(() => setOrders(prev => [...prev]), 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="loading">Loading orders...</div>;

  return (
    <>
      {notification && <div className="notification">{notification}</div>}

      <header className="header">
        <h1>🍺 Bar Display</h1>
        <div className="stats">
          <div className="stat new">
            <div className="label">New</div>
            <div className="value">{byStatus.NEW.length}</div>
          </div>
          <div className="stat preparing">
            <div className="label">Preparing</div>
            <div className="value">{byStatus.PREPARING.length}</div>
          </div>
          <div className="stat ready">
            <div className="label">Ready</div>
            <div className="value">{byStatus.READY.length}</div>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="columns">
          {/* NEW ORDERS */}
          <div className="column new">
            <div className="column-header">
              <div className="column-title">🔵 New Orders</div>
              <div className="column-badge">{byStatus.NEW.length}</div>
            </div>
            {byStatus.NEW.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✓</div>
                <p>No new drink orders</p>
              </div>
            ) : (
              byStatus.NEW.map(o => (
                <OrderCard key={o.id} order={o} getTimeSince={getTimeSince}
                  getTimeClass={getTimeClass}
                  onStart={() => updateStatus(o.id, 'PREPARING')} />
              ))
            )}
          </div>

          {/* PREPARING ORDERS */}
          <div className="column preparing">
            <div className="column-header">
              <div className="column-title">🟣 Preparing</div>
              <div className="column-badge">{byStatus.PREPARING.length}</div>
            </div>
            {byStatus.PREPARING.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🍹</div>
                <p>Start preparing!</p>
              </div>
            ) : (
              byStatus.PREPARING.map(o => (
                <OrderCard key={o.id} order={o} getTimeSince={getTimeSince}
                  getTimeClass={getTimeClass}
                  onReady={() => updateStatus(o.id, 'READY')} />
              ))
            )}
          </div>

          {/* READY ORDERS */}
          <div className="column ready">
            <div className="column-header">
              <div className="column-title">🟢 Ready</div>
              <div className="column-badge">{byStatus.READY.length}</div>
            </div>
            {byStatus.READY.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🥤</div>
                <p>No drinks ready</p>
              </div>
            ) : (
              byStatus.READY.map(o => (
                <OrderCard key={o.id} order={o} getTimeSince={getTimeSince}
                  getTimeClass={getTimeClass}
                  onComplete={() => updateStatus(o.id, 'COMPLETED')} />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function OrderCard({order, getTimeSince, getTimeClass, onStart, onReady, onComplete}) {
  return (
    <div className={`order-card ${order.status.toLowerCase()}`}>
      <div className="order-header">
        <div className="order-number">Order #{order.id}</div>
        <div className="table-badge">Table {order.table_id}</div>
      </div>

      <div className="order-time">
        {new Date(order.created_at).toLocaleTimeString()}
        <span className={`timer ${getTimeClass(order.created_at)}`}>
          {getTimeSince(order.created_at)}
        </span>
      </div>

      <div className="order-items">
        {order.items.length > 0 ? (
          order.items.map((item, idx) => (
            <div key={idx} className="order-item">
              <div className="item-name">
                <span className="item-qty">{item.quantity}x</span>
                {item.name || `Item #${item.menu_item_id}`}
              </div>
            </div>
          ))
        ) : (
          <div className="order-item">
            <div className="item-name">Loading items...</div>
          </div>
        )}
      </div>

      <div className="order-actions">
        {order.status === 'NEW' && (
          <button className="btn btn-start" onClick={onStart}>
            Start Preparing
          </button>
        )}
        {order.status === 'PREPARING' && (
          <button className="btn btn-ready" onClick={onReady}>
            Mark Ready
          </button>
        )}
        {order.status === 'READY' && (
          <button className="btn btn-complete" onClick={onComplete}>
            Complete
          </button>
        )}
      </div>
    </div>
  );
}

ReactDOM.render(<BarDisplay />, document.getElementById('root'));