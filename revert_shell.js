const fs = require('fs');
const f = 'c:/Users/zekef/Downloads/chicken-cross/plinko/game-server.js';
let src = fs.readFileSync(f, 'utf8');

// 1. Remove buildShellHTML block (it was inserted right before buildHomepageHTML)
const shellStart = src.indexOf('\r\n// ============================================================\r\n// SHELL PAGE');
const shellEnd = src.indexOf('\r\nfunction buildHomepageHTML', shellStart > 0 ? shellStart : 0);
if (shellStart >= 0 && shellEnd > shellStart) {
  src = src.slice(0, shellStart) + '\r\n' + src.slice(shellEnd);
  console.log('1. buildShellHTML removed');
} else {
  console.log('1. buildShellHTML not found (already removed?)');
}

// 2. Remove iframe=1 guard blocks from every page route
// They look like:
//     if (url.searchParams.get('iframe') !== '1') {
//       res.writeHead(200, {'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store'});
//       res.end(buildShellHTML('XXX')); return;
//     }
const guardPattern = /\r\n    if \(url\.searchParams\.get\('iframe'\) !== '1'\) \{\r\n      res\.writeHead\(200, \{'Content-Type':'text\/html; charset=utf-8', 'Cache-Control':'no-store'\}\);\r\n      res\.end\(buildShellHTML\('[^']*'\)\); return;\r\n    \}/g;
const before = src.length;
src = src.replace(guardPattern, '');
const removed = (before - src.length);
console.log('2. iframe guards removed, bytes removed:', removed);

// 3. Revert navigateTo - remove iframe postMessage block
const iframeCheck = "    // If inside the shell iframe, message the parent shell to switch frames\r\n    if (window.self !== window.top) {\r\n      try {\r\n        window.parent.postMessage({ type: 'rb-nav', path: path }, '*');\r\n        window.__NAV_IN_PROGRESS__ = false;\r\n        return;\r\n      } catch(e) {}\r\n    }\r\n    // Standalone navigation (not inside shell)\r\n";
const iframeCheckAlt = "    // If inside the shell iframe, message the parent shell to switch frames\n    if (window.self !== window.top) {\n      try {\n        window.parent.postMessage({ type: 'rb-nav', path: path }, '*');\n        window.__NAV_IN_PROGRESS__ = false;\n        return;\n      } catch(e) {}\n    }\n    // Standalone navigation (not inside shell)\n";

if (src.includes(iframeCheck)) {
  src = src.replace(iframeCheck, '    // For Safari PWA, use location.replace\r\n');
  console.log('3. iframe postMessage block removed (CRLF)');
} else if (src.includes(iframeCheckAlt)) {
  src = src.replace(iframeCheckAlt, '    // For Safari PWA, use location.replace\n');
  console.log('3. iframe postMessage block removed (LF)');
} else {
  console.log('3. iframe postMessage block not found (already clean)');
}

// 4. Fix navLog line to remove 'iframe=' from the log message
src = src.replace(
  "__navLog('nav', 'navigateTo: ' + path + ' iframe=' + (window.self !== window.top));",
  "__navLog('nav', 'navigateTo: ' + path + ' (from ' + location.pathname + ') pwa=' + IS_PWA);"
);
console.log('4. navLog message restored');

fs.writeFileSync(f, src, 'utf8');
console.log('\nDone - all shell changes reverted.');
