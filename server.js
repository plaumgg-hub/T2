const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

// ฟังก์ชันหลักสำหรับรันบอทเติมเงิน
async function runTopupBot(playerId, pinCode) {
    let browser;
    try {
        const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || null;

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
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        console.log(`[BOT] กำลังเริ่มเติมเงินสำหรับ UID: ${playerId}`);
        await page.goto('https://httpbin.org/forms/post', { waitUntil: 'networkidle2' });

        await page.waitForSelector('input[name="custname"]');
        await page.type('input[name="custname"]', playerId);

        await page.waitForSelector('textarea[name="comments"]');
        await page.type('textarea[name="comments"]', pinCode);

        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
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

// Route หน้าแรกสำหรับเช็คว่าเซิร์ฟเวอร์ยังทำงานอยู่ไหม
app.get('/', (req, res) => {
    res.send('✅ Free Fire Topup Bot Server is Running (Free Tier)');
});

// Route สำหรับสั่งเติมเงินผ่าน URL /topup?uid=XXX&pin=YYY
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
    console.log(`=========================================`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`=========================================`);
});
