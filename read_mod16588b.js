const fs = require('fs');
const content = fs.readFileSync('./mines/mines_files/c3cccf965a__app-a32a0248a19c9d94.js', 'utf8');

// Find module 16588
const mod16588 = content.indexOf('16588:function');
console.log('Module 16588 at:', mod16588);

// Read 1000 chars of context starting from it
const slice = content.substring(mod16588, mod16588 + 1000);
process.stdout.write('=CONTENT=\n' + slice + '\n=END=\n');
