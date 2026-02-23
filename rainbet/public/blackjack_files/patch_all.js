const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.js') && !f.startsWith('check') && !f.startsWith('dl'));
let total = 0;
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let changed = false;
  ['api.rainbet.com', 'services.rainbet.com', 'originals.rainbet.com'].forEach(d => {
    const pat = 'baseURL:"https://' + d + '"';
    while (c.includes(pat)) {
      c = c.replace(pat, 'baseURL:""');
      changed = true;
      total++;
    }
  });
  if (changed) {
    fs.writeFileSync(f, c);
    console.log('Patched: ' + f);
  }
});
console.log('Total patches: ' + total);
