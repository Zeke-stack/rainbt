const fs = require('fs');
const content = fs.readFileSync('./mines/mines_files/c3cccf965a__app-a32a0248a19c9d94.js', 'utf8');

// Find module 16588 exact content
const mod16588 = content.indexOf('16588:function');
console.log('Module 16588 at:', mod16588);
// Find the end of this module (next module definition)
const modEnd = content.indexOf(':function', mod16588 + 20);
const moduleText = content.substring(mod16588, modEnd + 50);
console.log('Module 16588 content:');
console.log(moduleText);
