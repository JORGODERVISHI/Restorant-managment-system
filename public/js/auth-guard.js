// ═══════════════════════════════════════════════════════════
// 🔐 AUTH GUARD - mbron faqet e stafit (admin/waiter/kitchen/bar)
// Nëse s'je i loguar, ruan faqen që doje të hapje dhe të dërgon
// te login; pas login-it të suksesshëm, login.js të rikthen
// automatikisht saktësisht këtu.
// ═══════════════════════════════════════════════════════════
(function () {
  const PAGE_ROLES = {
    'admin.html': 'admin',
    'waiter.html': 'waiter',
    'kitchen.html': 'kitchen',
    'bar.html': 'bar'
  };

  const pageName = window.location.pathname.split('/').pop();
  const requiredRole = PAGE_ROLES[pageName];

  const isLoggedIn = sessionStorage.getItem('isLoggedIn');
  const user = JSON.parse(sessionStorage.getItem('user') || 'null');

  if (!isLoggedIn || !user) {
    console.log('❌ Not logged in - ruaj faqen e synuar dhe ridrejto te login');
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    window.location.href = '/public/login.html';
    return;
  }

  if (requiredRole && user.role !== requiredRole) {
    console.log(`❌ Access denied - faqja kërkon rolin "${requiredRole}", ti je "${user.role}"`);
    alert(`❌ Access Denied - Vetëm roli "${requiredRole}" mund ta hapë këtë faqe`);
    sessionStorage.removeItem('redirectAfterLogin');
    window.location.href = '/public/login.html';
    return;
  }

  console.log(`✅ Autorizuar si ${user.role}:`, user.name);
  // E vëmë globalisht që admin.js/waiter.js/etj. ta përdorin (header, logout)
  window.currentUser = user;
})();