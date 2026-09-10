const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

async function runTopupBot(playerId, pinCode) {
    let browser;
    try {
        const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || null;

        // ปรับแต่ง Flag ให้เบาที่สุด ประหยัด RAM ไม่ให้จอดำ
        browser = await puppeteer.launch({
            executablePath: executablePath,
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu',
                '--disable-speech-api',
                '--disable-background-networking'
            ]
        });

        const page = await browser.newPage();
        
        // บล็อกไม่ให้โหลดรูปและ CSS เพื่อให้บอททำงานไวขึ้น 3 เท่า และประหยัด RAM
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // ตั้งเวลา Timeout ไว้ที่ 30 วินาที
        page.setDefaultNavigationTimeout(30000);

        console.log(`[BOT] กำลังเริ่มเติมเงินสำหรับ UID: ${playerId}`);
        await page.goto('https://httpbin.org/forms/post', { waitUntil: 'domcontentloaded' });

        await page.waitForSelector('input[name="custname"]');
        await page.type('input[name="custname"]', playerId);

        await page.waitForSelector('textarea[name="comments"]');
        await page.type('textarea[name="comments"]', pinCode);

        await Promise.all([
            page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
            page.click('button')
        ]);

        const pageContent = await page.content();
        await browser.close();

        if (pageContent.includes(playerId)) {
            return { success: true, message: 'เติมเงินสำเร็จเรียบร้อย!' };
        } else {
            return { success: false, message: 'ทำรายการไม่สำเร็จ' };
        }

    } catch (error) {
        if (browser) await browser.close();
        console.error('[BOT ERROR]:', error.message);
        return { success: false, error: error.message };
    }
}

app.get('/', (req, res) => {
    res.send('✅ Free Fire Topup Bot Server is Running (Free Tier)');
});

app.get('/topup', async (req, res) => {
    const { uid, pin } = req.query;

    if (!uid || !pin) {
        return res.status(400).json({ 
            success: false, 
            message: 'กรุณาระบุ uid และ pin เช่น /topup?uid=12345&pin=67890' 
        });
    }

    const result = await runTopupBot(uid, pin);
    res.json(result);
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
