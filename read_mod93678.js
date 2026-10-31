const fs = require('fs');
const content = fs.readFileSync('./mines/mines_files/c3cccf965a__app-a32a0248a19c9d94.js', 'utf8');

// Find where module 93678 (axios) is defined
const mod93678 = content.indexOf('93678:function');
console.log('Module 93678 at:', mod93678);
console.log(content.substring(mod93678, mod93678 + 4000));
