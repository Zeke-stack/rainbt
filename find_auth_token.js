const fs = require('fs');
const content = fs.readFileSync('./mines/mines_files/c3cccf965a__app-a32a0248a19c9d94.js', 'utf8');

// Find module 93678 (axios interceptor) - look for Authorization header setup
// and find actual token storage key
const authIdx = content.indexOf('Authorization');
console.log('=== Authorization header usage ===');
console.log(content.substring(Math.max(0, authIdx - 200), authIdx + 600));

console.log('\n\n=== All Authorization occurrences ===');
let pos = 0;
let count = 0;
while (count < 5) {
  const idx = content.indexOf('Authorization', pos);
  if (idx === -1) break;
  console.log('--- At', idx, '---');
  console.log(content.substring(Math.max(0, idx - 100), idx + 300));
  pos = idx + 13;
  count++;
}

// Also search for access_token storage
console.log('\n\n=== access_token / Bearer token patterns ===');
['Bearer', 'access_token', 'accessToken', 'authToken', 'auth_token'].forEach(pat => {
  const idx = content.indexOf(pat);
  if (idx !== -1) {
    console.log('---', pat, 'at', idx, '---');
    console.log(content.substring(Math.max(0, idx - 100), idx + 400));
  }
});
