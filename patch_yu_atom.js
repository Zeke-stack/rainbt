const fs = require('fs');
const content = fs.readFileSync('./mines/mines_files/c3cccf965a__app-a32a0248a19c9d94.js', 'utf8');

// Check for unique pattern
const oldStr = 'slots-mobile-fullscreen",!0),y=(0,i.cn)(!1)';
const newStr = 'slots-mobile-fullscreen",!0),y=(0,i.cn)(!0)';

const occurrences = content.split(oldStr).length - 1;
console.log('Occurrences of patch target:', occurrences);

if (occurrences === 1) {
  const patched = content.replace(oldStr, newStr);
  fs.writeFileSync('./mines/mines_files/c3cccf965a__app-a32a0248a19c9d94.js', patched, 'utf8');
  console.log('Patched! YU atom now starts as true (user is logged in)');
} else {
  console.log('CANNOT PATCH - not exactly 1 occurrence!');
  // Find all positions
  let pos = 0;
  while (true) {
    const idx = content.indexOf(oldStr, pos);
    if (idx === -1) break;
    console.log('Found at position:', idx);
    console.log('Context:', content.substring(Math.max(0, idx-50), idx+100));
    pos = idx + oldStr.length;
  }
}
