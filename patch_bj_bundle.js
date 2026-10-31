const fs = require('fs');
const filePath = './rainbet/public/blackjack_files/_app-a32a0248a19c9d94.js';
const content = fs.readFileSync(filePath, 'utf8');

const oldStr = 'slots-mobile-fullscreen",!0),y=(0,i.cn)(!1)';
const newStr = 'slots-mobile-fullscreen",!0),y=(0,i.cn)(!0)';

const occ = content.split(oldStr).length - 1;
console.log('Occurrences:', occ);

if (occ === 1) {
  fs.writeFileSync(filePath, content.replace(oldStr, newStr), 'utf8');
  console.log('Patched BJ bundle - YU atom = true');
} else {
  const already = content.includes(newStr);
  if (already) console.log('Already patched');
  else {
    const y = content.indexOf('YU:function(){return y}');
    if (y > -1) {
      const j = content.indexOf(',y=', y);
      console.log('Current YU context:', JSON.stringify(content.substring(j-20, j+70)));
    } else console.log('YU not found');
  }
}
