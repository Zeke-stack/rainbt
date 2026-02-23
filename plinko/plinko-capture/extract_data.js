const fs = require('fs');
const html = fs.readFileSync('plinko.html', 'utf8');

// Extract __NEXT_DATA__
const marker = 'id="__NEXT_DATA__"';
const ndStart = html.indexOf(marker);
if (ndStart < 0) { console.log('No __NEXT_DATA__ found'); process.exit(); }
const jsonStart = html.indexOf('>', ndStart) + 1;
const jsonEnd = html.indexOf('</script>', jsonStart);
const json = html.substring(jsonStart, jsonEnd);
const data = JSON.parse(json);

console.log('buildId:', data.buildId);
console.log('page:', data.page);
console.log('query:', JSON.stringify(data.query));
console.log('');

const pp = data.props.pageProps;
console.log('gameDetails:', JSON.stringify(pp.gameDetails, null, 2));
console.log('');
console.log('gameLimits:', JSON.stringify(pp.gameLimits, null, 2));
console.log('');
console.log('userData keys:', Object.keys(pp.userData || {}));
console.log('wallet:', JSON.stringify(pp.wallet, null, 2));
console.log('balances count:', (pp.balances || []).length);
console.log('currencies count:', (pp.currencies || []).length);
if (pp.currencies && pp.currencies.length > 0) {
  console.log('first currency:', JSON.stringify(pp.currencies[0]));
}

// Save full __NEXT_DATA__ for reference
fs.writeFileSync('next_data.json', JSON.stringify(data, null, 2));
console.log('\nSaved full __NEXT_DATA__ to next_data.json');
