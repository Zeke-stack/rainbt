const fs = require('fs');
const content = fs.readFileSync('c:/Users/zekef/Downloads/chicken-cross/mines/mines_files/c3cccf965a__app-a32a0248a19c9d94.js', 'utf8');

// Find UELW token key and surrounding context
const tokenIdx = content.indexOf('UELW');
console.log('=== UELW token key context ===');
console.log(content.substring(tokenIdx - 50, tokenIdx + 600));

console.log('\n\n=== ALL occurrences of UELW ===');
let pos = 0;
while (true) {
  const idx = content.indexOf('UELW', pos);
  if (idx === -1) break;
  console.log('At', idx, ':', content.substring(idx - 30, idx + 80));
  pos = idx + 4;
}

// Find refresh-token call and surrounding init code
console.log('\n\n=== refresh-token context ===');
const rtIdx = content.indexOf('refresh-token');
console.log(content.substring(rtIdx - 200, rtIdx + 500));

// Find 'initAuth' or similar initialization functions
console.log('\n\n=== initAuth / useInit patterns ===');
['initAuth', 'useInit', 'useEffect', 'getToken', 'checkAuth', 'autoLogin', 'autoRefresh'].forEach(pat => {
  const idx = content.indexOf(pat);
  if (idx !== -1) console.log(pat, 'at', idx);
});
