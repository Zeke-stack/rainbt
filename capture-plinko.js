/**
 * Capture Plinko game from Rainbet using Opera browser
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const OPERA_PATH = 'C:\\Users\\zekef\\AppData\\Local\\Programs\\Opera\\opera.exe';
const USER_DATA_DIR = 'C:\\Users\\zekef\\AppData\\Roaming\\Opera Software\\Opera Stable';
const OUTPUT_DIR = path.join(__dirname, 'public', 'plinko_files');

async function capturePlinko() {
    console.log('=== Capturing Plinko Game ===');
    
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    console.log('Launching Opera...');
    const browser = await puppeteer.launch({
        executablePath: OPERA_PATH,
        userDataDir: USER_DATA_DIR,
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-blink-features=AutomationControlled',
        ],
        defaultViewport: null,
    });

    const page = await browser.newPage();
    
    // Track all resources
    const capturedResources = new Map();
    
    page.on('response', async (response) => {
        const url = response.url();
        
        // Capture Next.js chunks, CSS, and game assets
        if (
            url.includes('/_next/static/chunks/') ||
            url.includes('/_next/static/css/') ||
            url.includes('/_next/static/media/') ||
            url.includes('/audios/') ||
            url.includes('/images/') ||
            url.includes('.js') ||
            url.includes('.css') ||
            url.includes('.json') ||
            url.includes('.svg') ||
            url.includes('.png') ||
            url.includes('.webp')
        ) {
            try {
                const buffer = await response.buffer();
                capturedResources.set(url, buffer);
                console.log(`Captured: ${url.substring(url.lastIndexOf('/') + 1)} (${buffer.length} bytes)`);
            } catch (e) {
                console.log(`Failed to capture: ${url.substring(url.lastIndexOf('/') + 1)}`);
            }
        }
    });

    console.log('Navigating to Plinko...');
    await page.goto('https://rainbet.com/casino/originals/plinko', {
        waitUntil: 'networkidle2',
        timeout: 60000,
    });

    console.log('Waiting for page to fully load...');
    await page.waitForTimeout(5000);

    // Get the HTML
    const html = await page.content();
    
    // Save HTML
    const htmlPath = path.join(__dirname, 'public', 'plinko.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`\nSaved HTML: ${htmlPath}`);

    // Save all captured resources
    console.log('\nSaving captured resources...');
    let savedCount = 0;
    
    for (const [url, buffer] of capturedResources.entries()) {
        try {
            // Extract filename
            const urlObj = new URL(url);
            let filename = path.basename(urlObj.pathname);
            
            // Handle query parameters for some files
            if (filename.includes('?')) {
                filename = filename.split('?')[0];
            }
            
            const filepath = path.join(OUTPUT_DIR, filename);
            fs.writeFileSync(filepath, buffer);
            savedCount++;
        } catch (e) {
            console.log(`Error saving ${url}: ${e.message}`);
        }
    }

    console.log(`\nSaved ${savedCount} files to ${OUTPUT_DIR}`);
    console.log(`Total resources captured: ${capturedResources.size}`);

    await browser.close();
    console.log('\nCapture complete!');
}

capturePlinko().catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
});
