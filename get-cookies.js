/**
 * Extract cookies for HTTrack usage
 * Run this in browser console on rainbet.com/casino/originals/plinko
 */

(function() {
    // Get all cookies
    const cookies = document.cookie.split(';').map(c => c.trim());
    
    console.log('========================================');
    console.log('COOKIE HEADER (for PowerShell):');
    console.log('========================================');
    console.log(document.cookie);
    console.log('');
    
    console.log('========================================');
    console.log('NETSCAPE FORMAT (for HTTrack):');
    console.log('========================================');
    console.log('# Netscape HTTP Cookie File');
    
    // Parse and output in Netscape format
    cookies.forEach(cookie => {
        const [nameValue, ...rest] = cookie.split(';');
        const [name, value] = nameValue.split('=');
        
        if (name && value) {
            // Format: domain, flag, path, secure, expiration, name, value
            const domain = '.rainbet.com';
            const flag = 'TRUE';
            const path = '/';
            const secure = 'FALSE';
            const expiration = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // 1 year from now
            
            console.log(`${domain}\t${flag}\t${path}\t${secure}\t${expiration}\t${name}\t${value}`);
        }
    });
    
    console.log('');
    console.log('========================================');
    console.log('Copy everything between the lines above');
    console.log('========================================');
    
    // Also create downloadable files
    const cookieHeader = document.cookie;
    const netscapeCookies = ['# Netscape HTTP Cookie File'];
    
    cookies.forEach(cookie => {
        const [nameValue] = cookie.split(';');
        const [name, value] = nameValue.split('=');
        
        if (name && value) {
            const domain = '.rainbet.com';
            const flag = 'TRUE';
            const path = '/';
            const secure = 'FALSE';
            const expiration = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60);
            
            netscapeCookies.push(`${domain}\t${flag}\t${path}\t${secure}\t${expiration}\t${name}\t${value}`);
        }
    });
    
    // Download cookie header
    const blob1 = new Blob([cookieHeader], { type: 'text/plain' });
    const url1 = URL.createObjectURL(blob1);
    const a1 = document.createElement('a');
    a1.href = url1;
    a1.download = 'cookie-header.txt';
    document.body.appendChild(a1);
    a1.click();
    document.body.removeChild(a1);
    URL.revokeObjectURL(url1);
    
    // Download Netscape format
    const blob2 = new Blob([netscapeCookies.join('\n')], { type: 'text/plain' });
    const url2 = URL.createObjectURL(blob2);
    const a2 = document.createElement('a');
    a2.href = url2;
    a2.download = 'cookies-netscape.txt';
    document.body.appendChild(a2);
    a2.click();
    document.body.removeChild(a2);
    URL.revokeObjectURL(url2);
    
    console.log('Downloaded: cookie-header.txt and cookies-netscape.txt');
    
})();
