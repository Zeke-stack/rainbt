const f = require('fs').readFileSync('_app-a32a0248a19c9d94.js', 'utf8');
console.log('baseURL empty:', (f.match(/baseURL:""/g) || []).length);
console.log('baseURL https:', (f.match(/baseURL:"https:\/\//g) || []).length);
console.log('retries:0:', (f.match(/retries:0/g) || []).length);
console.log('retries:20:', (f.match(/retries:20/g) || []).length);

// Check for SWR issues
console.log('useSWR count:', (f.match(/useSWR\(/g) || []).length);

// Check for any remaining rainbet.com API calls
const apiCalls = f.match(/https:\/\/[a-z]+\.rainbet\.com/g);
console.log('Remaining rainbet API refs:', apiCalls ? [...new Set(apiCalls)] : 'none');
