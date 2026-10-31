const fs = require('fs');
const content = fs.readFileSync('./mines/mines_files/c3cccf965a__app-a32a0248a19c9d94.js', 'utf8');

// Find where module 24998 is imported (r(24998)) and used
// The 'x' export (login success = set YU=true) must be called somewhere in init
let pos = 0;
let count = 0;
while (count < 20) {
  const idx = content.indexOf('24998', pos);
  if (idx === -1) break;
  const ctx = content.substring(Math.max(0, idx - 50), idx + 100);
  // Only show relevant ones (module usage, not the module definition)
  if (!ctx.includes('24998:function')) {
    console.log('--- At', idx, '---');
    console.log(ctx);
  }
  pos = idx + 5;
  count++;
}

// Also look for the refresh token initialization call on component mount
// Search for useEffect with refresh-token or auth/me
console.log('\n\n=== Looking for auth init useEffect ===');
const authMeIdx = content.indexOf('/v1/auth/me');
console.log('/v1/auth/me at:', authMeIdx);
// Read context to find all calls
let pos2 = 0;
let count2 = 0;
while (count2 < 10) {
  const idx = content.indexOf('/v1/auth/me', pos2);
  if (idx === -1) break;
  console.log('--- /v1/auth/me at', idx, '---');
  console.log(content.substring(Math.max(0, idx - 100), idx + 200));
  pos2 = idx + 11;
  count2++;
}

// Find useAuth or similar hooks
console.log('\n\n=== useAuth patterns ===');
const authHookIdx = content.indexOf('useAuth');
if (authHookIdx !== -1) {
  console.log('useAuth at:', authHookIdx);
  console.log(content.substring(authHookIdx - 200, authHookIdx + 500));
}

// Look for the SWR call that checks auth on startup (fetches user data)
console.log('\n\n=== SWR fetcher for initial auth ===');
['/v1/user', '/v1/me', 'v1/auth/session'].forEach(pat => {
  let p2 = 0;
  while (true) {
    const idx = content.indexOf(pat, p2);
    if (idx === -1) break;
    console.log('---', pat, 'at', idx, '---');
    console.log(content.substring(Math.max(0, idx - 100), idx + 200));
    p2 = idx + pat.length;
    break; // just first occurrence
  }
});
