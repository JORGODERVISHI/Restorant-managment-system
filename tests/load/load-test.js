
const autocannon = require('autocannon');

(async () => {
  console.log('Duke matur performancën... (10 sekonda, 20 klientë njëkohësisht)\n');

  const result = await autocannon({
    url: 'http://localhost:3000/menu_items',
    method: 'GET',
    connections: 20,
    duration: 10
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('REZULTATI I MATJES SË PERFORMANCËS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Kërkesa gjithsej:              ${result.requests.total}`);
  console.log(`Kërkesa/sekondë (mesatare):    ${result.requests.average}`);
  console.log(`Latenca mesatare:              ${result.latency.average} ms`);
  console.log(`Latenca p99 (rasti më i keq):  ${result.latency.p99} ms`);
  console.log(`Gabime/timeouts:               ${result.errors + result.timeouts}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
})();