// Download missing chunks from CDN
const https = require('https');
const fs = require('fs');
const path = require('path');

const dest = __dirname;
const chunks = [
  '4153.bc691ece3335fca4.js',
  '3460-1aad56ec76945362.js',  // hyphen form used in some refs
  '5722.d758b8c4a3e712f0.js',
  '6531.666ae7bf12951fa8.js',
  '5374.6196889af6d31eb3.js',
  '8864.fc5823d3c0a94a3b.js',
  '4367.1fa7198ac88fe495.js',
  '7335.bfaa25c1e48a9074.js',
  '7323.06bb57410fb4cbe0.js',
  '4967.5864374eee8de34b.js',
  '5034.ba663923712530d8.js',
  '8119.feacfda72bd581b4.js',
  '3745.bd6ddf81f09f8f43.js',
];

let done = 0;
let failed = [];

chunks.forEach(name => {
  // Always use dot form for CDN URL
  const urlName = name.replace(/^(\d+)-/, '$1.');
  const url = 'https://rainbet.com/_next/static/chunks/' + urlName;
  
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, r => {
    let data = Buffer.alloc(0);
    r.on('data', c => data = Buffer.concat([data, c]));
    r.on('end', () => {
      done++;
      if (r.statusCode === 200 && data.length > 0 && data.toString('utf8', 0, 20).includes('webpackChunk')) {
        // Save with dot form
        const saveName = name.replace(/^(\d+)-/, '$1.');
        fs.writeFileSync(path.join(dest, saveName), data);
        console.log(`[${done}/${chunks.length}] OK ${saveName} (${data.length}B)`);
      } else {
        console.log(`[${done}/${chunks.length}] FAIL ${urlName} status=${r.statusCode} size=${data.length}`);
        failed.push(urlName);
      }
      if (done === chunks.length) {
        console.log('\nDone! Failed:', failed.length > 0 ? failed.join(', ') : 'none');
      }
    });
  }).on('error', e => {
    done++;
    console.log(`[${done}/${chunks.length}] ERROR ${urlName}: ${e.message}`);
    failed.push(urlName);
  });
});
