// ========================================
// getUserId.js - สคริปต์ช่วยหา User ID
// ========================================

const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());

console.log('========================================');
console.log('🔍 เครื่องมือหา LINE User ID');
console.log('========================================');
console.log('');
console.log('📝 วิธีใช้:');
console.log('1. รันสคริปต์นี้');
console.log('2. ใช้ ngrok เปิด webhook: ngrok http 3000');
console.log('3. คัดลอก URL จาก ngrok ไปตั้งค่าใน LINE Developers');
console.log('4. แอดบอท LINE หรือส่งข้อความหาบอท');
console.log('5. User ID จะแสดงที่นี่');
console.log('');
console.log('========================================');

app.post('/webhook', (req, res) => {
    try {
        const events = req.body.events || [];
        
        events.forEach(event => {
            if (event.type === 'follow') {
                console.log('\n🎉 มีคนแอดบอทใหม่!');
                console.log('========================================');
                console.log('📋 User ID:', event.source.userId);
                console.log('👤 Display Name:', event.source.displayName || 'N/A');
                console.log('========================================');
                console.log('💡 คัดลอก User ID ด้านบนไปใส่ใน .env file');
                console.log('');
            }
            
            if (event.type === 'message') {
                console.log('\n💬 มีข้อความใหม่!');
                console.log('========================================');
                console.log('📋 User ID:', event.source.userId);
                console.log('📝 ข้อความ:', event.message.text || 'N/A');
                console.log('========================================');
                console.log('💡 คัดลอก User ID ด้านบนไปใส่ใน .env file');
                console.log('');
            }
        });
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(200).send('OK');
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n✅ Webhook server กำลังทำงานที่ port ${PORT}`);
    console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook`);
    console.log('\n⏳ รอการแอดบอทหรือข้อความ...\n');
});
