const https = require('https');
const fs = require('fs');

const chunks = ['4367.1fa7198ac88fe495.js', '8119.feacfda72bd581b4.js', '5034.ba663923712530d8.js'];
let done = 0;

chunks.forEach(n => {
  https.get('https://rainbet.com/_next/static/chunks/' + n, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  }, r => {
    let d = Buffer.alloc(0);
    r.on('data', c => d = Buffer.concat([d, c]));
    r.on('end', () => {
      done++;
      const text = d.toString('utf8');
      console.log(n + ': status=' + r.statusCode + ' size=' + d.length);
      console.log('  First 120 chars: ' + text.substring(0, 120));
      
      // Save if it looks like webpack
      if (text.includes('webpackChunk') || text.includes('self.__next')) {
        fs.writeFileSync(n, d);
        console.log('  SAVED!');
      }
    });
  });
});
