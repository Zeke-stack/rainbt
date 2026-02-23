var fs=require('fs');
var fw=fs.readFileSync('framework-6603b6fce1ea64cf.js','utf8');
console.log(fw.includes('18038:') ? '18038 FOUND' : '18038 NOT FOUND');
// Find react module - search for 'react' in module definitions
var reactMatch = fw.match(/(\d+):function\(e,t\)\{"use strict";t\.__esModule/g);
if(reactMatch) console.log('esModule exports:', reactMatch.slice(0,5).join(', '));
// Search for createElement export
var ceIdx = fw.indexOf('createElement');
if(ceIdx > -1) {
  var before = fw.substring(Math.max(0,ceIdx-200), ceIdx);
  var modMatch = before.match(/(\d{4,5}):function/g);
  if(modMatch) console.log('Module near createElement:', modMatch[modMatch.length-1]);
}
// Also check how other already-present chunks import React
var chunk = fs.readFileSync('9628-b165d76bcb061077.js','utf8');
var reqMatch = chunk.match(/__webpack_require__\((\d{4,5})\)/g);
if(reqMatch) console.log('Chunk 9628 requires:', [...new Set(reqMatch)].slice(0,15).join(', '));
