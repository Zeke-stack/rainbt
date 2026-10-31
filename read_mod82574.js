const fs = require('fs');
const content = fs.readFileSync('./mines/mines_files/c3cccf965a__app-a32a0248a19c9d94.js', 'utf8');

// Find module 82574 start and read it
const mod82574 = content.indexOf('82574:function');
console.log('Module 82574 at:', mod82574);
console.log(content.substring(mod82574, mod82574 + 3000));
