const fs = require('fs');
const content = fs.readFileSync('./mines/mines_files/c3cccf965a__app-a32a0248a19c9d94.js', 'utf8');

// Find ALL occurrences of UELW
let pos = 0;
let count = 0;
while (true) {
  const idx = content.indexOf('UELW', pos);
  if (idx === -1) break;
  console.log('=== UELW at', idx, '===');
  console.log(content.substring(Math.max(0, idx - 100), idx + 300));
  console.log('---');
  pos = idx + 4;
  count++;
  if (count > 10) break;
}
console.log('Total UELW hits:', count);
