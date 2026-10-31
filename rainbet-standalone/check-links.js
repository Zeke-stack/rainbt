const f = require('fs').readFileSync(__dirname + '/mines-standalone.html', 'utf8');
const m = f.match(/(?:href|src)="https?:\/\/[^"]{0,120}/g) || [];
const ext = m.filter(x => !x.includes('rainbt.vercel.app'));
console.log('External links remaining:', ext.length);
ext.slice(0,10).forEach(x => console.log(' ', x.substring(0,100)));
