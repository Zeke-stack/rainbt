const fs = require('fs');
const content = fs.readFileSync('./mines/mines_files/c3cccf965a__app-a32a0248a19c9d94.js', 'utf8');

// Read full module 70328 context that contains the UELW token functions
// UELW starts at ~417966, let's read the broader module around it
console.log('=== Module containing UELW token (around pos 416000-420000) ===');
console.log(content.substring(416000, 420000));
