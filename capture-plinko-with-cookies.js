const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Read cookie header
const cookieHeader = fs.readFileSync('c:\\Users\\zekef\\Downloads\\chicken-cross\\cookie-header.txt', 'utf8').trim();

// Configuration
const targetUrl = 'https://rainbet.com/casino/originals/plinko';
const outputDir = './public/plinko';

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const downloadedFiles = new Set();
const toDownload = [];

// Download a file
function downloadFile(url, outputPath) {
    return new Promise((resolve, reject) => {
        const fileUrl = url.startsWith('http') ? url : `https://rainbet.com${url}`;
        
        if (downloadedFiles.has(fileUrl)) {
            console.log(`⏭️  Skip: ${fileUrl}`);
            resolve();
            return;
        }
        
        downloadedFiles.add(fileUrl);
        console.log(`📥 Download: ${fileUrl}`);
        
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 OPR/117.0.0.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cookie': cookieHeader,
                'Referer': 'https://rainbet.com/',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                'Cache-Control': 'max-age=0'
            }
        };
        
        https.get(fileUrl, options, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                const redirectUrl = res.headers.location;
                console.log(`↪️  Redirect to: ${redirectUrl}`);
                downloadFile(redirectUrl, outputPath).then(resolve).catch(reject);
                return;
            }
            
            if (res.statusCode !== 200) {
                console.error(`❌ Error ${res.statusCode}: ${fileUrl}`);
                resolve(); // Continue anyway
                return;
            }
            
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            const fileStream = fs.createWriteStream(outputPath);
            res.pipe(fileStream);
            
            fileStream.on('finish', () => {
                fileStream.close();
                console.log(`✅ Saved: ${outputPath}`);
                
                // If it's HTML or JS, parse for more resources
                if (outputPath.endsWith('.html') || outputPath.endsWith('.js')) {
                    const content = fs.readFileSync(outputPath, 'utf8');
                    parseForResources(content, fileUrl);
                }
                
                resolve();
            });
        }).on('error', (err) => {
            console.error(`❌ Failed: ${fileUrl} - ${err.message}`);
            resolve(); // Continue anyway
        });
    });
}

// Parse content for resources
function parseForResources(content, baseUrl) {
    const patterns = [
        /src=["']([^"']+)["']/g,
        /href=["']([^"']+)["']/g,
        /"([^"]+\.(?:js|css|png|jpg|jpeg|gif|svg|webp|woff2?|ttf|eot|json|mp3|wav))"/g,
        /_next\/static\/[^"'\s]+/g,
        /\/_buildManifest\.js/g,
        /\/_ssgManifest\.js/g
    ];
    
    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            const resourceUrl = match[1] || match[0];
            if (resourceUrl && !resourceUrl.startsWith('data:') && 
                !resourceUrl.startsWith('#') && !resourceUrl.startsWith('blob:')) {
                
                let fullUrl;
                if (resourceUrl.startsWith('http')) {
                    fullUrl = resourceUrl;
                } else if (resourceUrl.startsWith('//')) {
                    fullUrl = 'https:' + resourceUrl;
                } else if (resourceUrl.startsWith('/')) {
                    fullUrl = 'https://rainbet.com' + resourceUrl;
                } else {
                    continue;
                }
                
                // Only download rainbet.com resources
                if (fullUrl.includes('rainbet.com') && !downloadedFiles.has(fullUrl)) {
                    const urlPath = new URL(fullUrl).pathname;
                    const outputPath = path.join(outputDir, urlPath);
                    toDownload.push({ url: fullUrl, path: outputPath });
                }
            }
        }
    }
}

// Main execution
async function main() {
    console.log('🚀 Starting Plinko capture with fresh cookies...\n');
    
    // Download main page
    const mainPagePath = path.join(outputDir, 'plinko.html');
    await downloadFile(targetUrl, mainPagePath);
    
    console.log(`\n📦 Found ${toDownload.length} resources to download\n`);
    
    // Download resources in batches
    const batchSize = 5;
    for (let i = 0; i < toDownload.length; i += batchSize) {
        const batch = toDownload.slice(i, i + batchSize);
        await Promise.all(batch.map(item => downloadFile(item.url, item.path)));
    }
    
    console.log('\n✅ Plinko capture complete!');
    console.log(`📁 Output directory: ${path.resolve(outputDir)}`);
    console.log(`📄 Total files downloaded: ${downloadedFiles.size}`);
}

main().catch(console.error);
